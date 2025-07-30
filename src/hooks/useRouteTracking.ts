import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateRoute, 
  getDistanceToPatient, 
  calculateDistancesToRequests,
  type RouteInfo,
  type DistanceInfo 
} from '@/utils/routeTracking';
import type { EMSRequest } from '@/types/types';
import axios from 'axios';

interface RouteTrackingState {
  currentRoute: RouteInfo | null;
  distanceToPatient: DistanceInfo | null;
  distancesToRequests: Record<string, DistanceInfo>;
  isCalculating: boolean;
  error: string | null;
}

export const useRouteTracking = (
  paramedicLocation: { lat: number; lng: number } | null,
  activeRequest: EMSRequest | null,
  availableRequests: EMSRequest[] = []
) => {
  const [state, setState] = useState<RouteTrackingState>({
    currentRoute: null,
    distanceToPatient: null,
    distancesToRequests: {},
    isCalculating: false,
    error: null
  });

  // Calculate route to active patient
  const { data: currentRoute, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['route', paramedicLocation, activeRequest?.id],
    queryFn: async () => {
      if (!paramedicLocation || !activeRequest) return null;
      
      return await calculateRoute(
        paramedicLocation.lat,
        paramedicLocation.lng,
        activeRequest.patientLat,
        activeRequest.patientLng
      );
    },
    enabled: !!(paramedicLocation && activeRequest),
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  // Calculate distance to active patient
  const { data: distanceToPatient, isLoading: isLoadingDistance } = useQuery({
    queryKey: ['distance', paramedicLocation, activeRequest?.id],
    queryFn: async () => {
      if (!paramedicLocation || !activeRequest) return null;
      
      return await getDistanceToPatient(
        paramedicLocation.lat,
        paramedicLocation.lng,
        activeRequest.patientLat,
        activeRequest.patientLng
      );
    },
    enabled: !!(paramedicLocation && activeRequest),
    refetchInterval: 15000, // Update every 15 seconds for active tracking
    staleTime: 10000,
  });

  // Calculate distances to all available requests
  const { data: distancesToRequests = {} } = useQuery({
    queryKey: ['distances-batch', paramedicLocation, availableRequests.map(r => r.id).join(',')],
    queryFn: async () => {
      if (!paramedicLocation || availableRequests.length === 0) return {};
      
      const requests = availableRequests.map(req => ({
        id: req.id,
        patientLat: req.patientLat,
        patientLng: req.patientLng
      }));
      
      return await calculateDistancesToRequests(
        paramedicLocation.lat,
        paramedicLocation.lng,
        requests
      );
    },
    enabled: !!(paramedicLocation && availableRequests.length > 0),
    refetchInterval: 60000, // Update every minute for available requests
    staleTime: 45000,
  });

  // Update state when queries complete
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentRoute: currentRoute ?? null,
      distanceToPatient: distanceToPatient ?? null,
      distancesToRequests,
      isCalculating: isLoadingRoute || isLoadingDistance,
      error: null
    }));
  }, [currentRoute, distanceToPatient, distancesToRequests, isLoadingRoute, isLoadingDistance]);

  // Calculate ETA based on current route
  const getETA = useCallback(() => {
    if (!currentRoute) return null;
    
    const now = new Date();
    const eta = new Date(now.getTime() + currentRoute.duration * 1000);
    return eta;
  }, [currentRoute]);

  // Get the closest available request
  const getClosestRequest = useCallback(() => {
    if (Object.keys(distancesToRequests).length === 0) return null;
    
    let closest = { requestId: '', distance: Infinity };
    
    Object.entries(distancesToRequests).forEach(([requestId, info]) => {
      if (info.distance < closest.distance) {
        closest = { requestId, distance: info.distance };
      }
    });
    
    return closest.requestId ? availableRequests.find(r => r.id === closest.requestId) : null;
  }, [distancesToRequests, availableRequests]);

  // Manually refresh calculations
  const refreshRoutes = useCallback(async () => {
    if (!paramedicLocation) return;
    
    setState(prev => ({ ...prev, isCalculating: true }));
    
    try {
      // Refresh all queries
      // This will be handled automatically by React Query
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh routes',
        isCalculating: false
      }));
    }
  }, [paramedicLocation]);

  return {
    ...state,
    getETA,
    getClosestRequest,
    refreshRoutes,
    isLoading: isLoadingRoute || isLoadingDistance
  };
};

// Hook for distance tracking without full route calculation
export const useDistanceTracking = (
  paramedicLocation: { lat: number; lng: number } | null,
  targetLocation: { lat: number; lng: number } | null
) => {
  const { data: distance, isLoading } = useQuery({
    queryKey: ['distance-simple', paramedicLocation, targetLocation],
    queryFn: async () => {
      if (!paramedicLocation || !targetLocation) return null;
      
      return await getDistanceToPatient(
        paramedicLocation.lat,
        paramedicLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      );
    },
    enabled: !!(paramedicLocation && targetLocation),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  return { distance, isLoading };
};

export async function getRouteCoordinates(start: [number, number], end: [number, number]) {
  const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUzYzMyMGMxMTQ4MTRjMThhNmI3YTE4OGExOTk5MjNkIiwiaCI6Im11cm11cjY0In0'; // or your env variable
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;
  const res = await axios.get(url);
  // GeoJSON coordinates: [lng, lat]
  return res.data.features[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
}