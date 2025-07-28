import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  loading: boolean;
  address?: string | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  onUpdate?: (position: { lat: number; lng: number; address?: string }) => void;
  includeAddress?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 30000,
    watch = false,
    onUpdate,
    includeAddress = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
    loading: true,
    address: null,
  });

  const watchIdRef = useRef<number | null>(null);

  // Reverse geocoding function using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    if (!includeAddress) return null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      // Format the address nicely
      const components = data.address || {};
      const parts = [
        components.house_number,
        components.road,
        components.neighbourhood || components.suburb,
        components.city || components.town || components.village,
        components.country
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : data.display_name;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const updatePosition = async (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    // Get address if requested
    const address = await reverseGeocode(lat, lng);

    const newState = {
      latitude: lat,
      longitude: lng,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      error: null,
      loading: false,
      address,
    };

    setState(newState);

    if (onUpdate && newState.latitude && newState.longitude) {
      onUpdate({
        lat: newState.latitude,
        lng: newState.longitude,
        address: newState.address || undefined,
      });
    }
  };

  const onError = (error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      onError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  };

  const startWatching = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      onError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  };

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      stopWatching();
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
}

// Utility function to get address from coordinates
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    // Format the address nicely
    const components = data.address || {};
    const parts = [
      components.house_number,
      components.road,
      components.neighbourhood || components.suburb,
      components.city || components.town || components.village,
      components.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : data.display_name;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}