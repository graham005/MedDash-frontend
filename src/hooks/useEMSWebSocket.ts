import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/api/url';
import { toast } from 'sonner';

interface EMSLocationUpdate {
  requestId: string;
  lat: number;
  lng: number;
}

interface EMSStatusUpdate {
  requestId: string;
  status: string;
  message?: string;
}

interface EmergencyAlert {
  requestId: string;
  priority: string;
  message: string;
}

export function useEMSWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(`${API_URL.replace('/api', '')}/ems`, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to EMS WebSocket');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from EMS WebSocket');
    });

    // Listen for new emergency alerts
    socket.on('new-emergency', (data: EmergencyAlert) => {
      toast.error(`🚨 NEW EMERGENCY: ${data.message}`, {
        duration: 10000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinEMSRoom = (requestId: string) => {
    socketRef.current?.emit('join-ems-room', { requestId });
  };

  const leaveEMSRoom = (requestId: string) => {
    socketRef.current?.emit('leave-ems-room', { requestId });
  };

  const updatePatientLocation = (requestId: string, lat: number, lng: number) => {
    socketRef.current?.emit('patient-location', { requestId, lat, lng });
  };

  const updateParamedicLocation = (requestId: string, lat: number, lng: number) => {
    socketRef.current?.emit('paramedic-location', { requestId, lat, lng });
  };

  const sendStatusUpdate = (requestId: string, status: string, message?: string) => {
    socketRef.current?.emit('status-update', { requestId, status, message });
  };

  const sendEmergencyAlert = (requestId: string, priority: string, message: string) => {
    socketRef.current?.emit('emergency-alert', { requestId, priority, message });
  };

  const onPatientLocationUpdate = (callback: (data: EMSLocationUpdate) => void) => {
    socketRef.current?.on('patient-location-update', callback);
    return () => socketRef.current?.off('patient-location-update', callback);
  };

  const onParamedicLocationUpdate = (callback: (data: EMSLocationUpdate) => void) => {
    socketRef.current?.on('paramedic-location-update', callback);
    return () => socketRef.current?.off('paramedic-location-update', callback);
  };

  const onStatusChanged = (callback: (data: EMSStatusUpdate) => void) => {
    socketRef.current?.on('status-changed', callback);
    return () => socketRef.current?.off('status-changed', callback);
  };

  const onNewEMSRequest = (callback: (data: any) => void) => {
    socketRef.current?.on('new-ems-request', callback);
    return () => socketRef.current?.off('new-ems-request', callback);
  };

  return {
    isConnected,
    joinEMSRoom,
    leaveEMSRoom,
    updatePatientLocation,
    updateParamedicLocation,
    sendStatusUpdate,
    sendEmergencyAlert,
    onPatientLocationUpdate,
    onParamedicLocationUpdate,
    onStatusChanged,
    onNewEMSRequest,
  };
}