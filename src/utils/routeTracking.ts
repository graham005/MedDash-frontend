// Get your API key from https://openrouteservice.org/
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUzYzMyMGMxMTQ4MTRjMThhNmI3YTE4OGExOTk5MjNkIiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org';

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // route coordinates [lat, lng]
  summary: string;
  // Enhanced properties
  segments?: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      distance: number;
      duration: number;
      instruction: string;
      type: number;
      name: string;
    }>;
  }>;
  bbox?: [number, number, number, number];
}

export interface DistanceInfo {
  distance: number; // in meters
  duration: number; // in seconds
  distanceText: string; // formatted text
  durationText: string; // formatted text
}

/**
 * OpenRouteService API client using fetch
 */
class OpenRouteServiceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = ORS_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getDirections(
    coordinates: [number, number][],
    profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
  ): Promise<any> {
    const url = `${this.baseUrl}/v2/directions/${profile}/geojson`;
    
    const body = {
    coordinates: coordinates.map(coord => [coord[1], coord[0]]), // Convert [lat, lng] to [lng, lat]
    instructions: false,
    elevation: false,
    extra_info: [],
    attributes: [],
    maneuvers: false,
    options: {},
    id: `route_${Date.now()}`
  };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `OpenRouteService API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}

// Create client instance
const orsClient = new OpenRouteServiceClient(ORS_API_KEY);

console.log(orsClient)
/**
 * Calculate route between two points using OpenRouteService
 */
export const calculateRoute = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
): Promise<RouteInfo> => {
  try {
    if (!ORS_API_KEY ) {
      throw new Error('OpenRouteService API key not configured');
    }

    const coordinates: [number, number][] = [
      [startLat, startLng],
      [endLat, endLng]
    ];

    const response = await orsClient.getDirections(coordinates, profile);
    
    if (!response.features || response.features.length === 0) {
      throw new Error('No route found');
    }

    const feature = response.features[0];
    const route = feature.properties;
    
    // Convert coordinates back to [lat, lng] format
    const routeCoordinates: [number, number][] = feature.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      coordinates: routeCoordinates,
      summary: `${formatDistance(route.summary.distance)} • ${formatDuration(route.summary.duration)}`,
      bbox: feature.bbox
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    
    // Fallback to straight-line distance
    const distance = calculateStraightLineDistance(startLat, startLng, endLat, endLng);
    const estimatedDuration = (distance / 1000) / 50 * 3600; // Assume 50 km/h average speed
    
    return {
      distance,
      duration: estimatedDuration,
      coordinates: [[startLat, startLng], [endLat, endLng]],
      summary: `~${formatDistance(distance)} • ~${formatDuration(estimatedDuration)} (estimated)`
    };
  }
};

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
export const calculateStraightLineDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Get distance and duration between paramedic and patient
 */
export const getDistanceToPatient = async (
  paramedicLat: number,
  paramedicLng: number,
  patientLat: number,
  patientLng: number
): Promise<DistanceInfo> => {
  try {
    const route = await calculateRoute(paramedicLat, paramedicLng, patientLat, patientLng);
    
    return {
      distance: route.distance,
      duration: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration)
    };
  } catch (error) {
    console.warn('Falling back to straight-line distance:', error);
    
    // Fallback to straight-line distance
    const distance = calculateStraightLineDistance(paramedicLat, paramedicLng, patientLat, patientLng);
    const estimatedDuration = (distance / 1000) / 50 * 3600; // Assume 50 km/h
    
    return {
      distance,
      duration: estimatedDuration,
      distanceText: `~${formatDistance(distance)}`,
      durationText: `~${formatDuration(estimatedDuration)}`
    };
  }
};

/**
 * Batch calculate distances for multiple requests with rate limiting
 */
export const calculateDistancesToRequests = async (
  paramedicLat: number,
  paramedicLng: number,
  requests: Array<{ id: string; patientLat: number; patientLng: number }>
): Promise<Record<string, DistanceInfo>> => {
  const results: Record<string, DistanceInfo> = {};
  
  // Process in smaller batches to avoid rate limiting
  const batchSize = 3; // Reduced batch size for API stability
  const delay = 300; // Increased delay between batches
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (request) => {
      try {
        const distanceInfo = await getDistanceToPatient(
          paramedicLat,
          paramedicLng,
          request.patientLat,
          request.patientLng
        );
        return { id: request.id, distanceInfo, success: true };
      } catch (error) {
        console.error(`Failed to calculate distance for request ${request.id}:`, error);
        
        // Fallback to straight-line distance
        const distance = calculateStraightLineDistance(
          paramedicLat, 
          paramedicLng, 
          request.patientLat, 
          request.patientLng
        );
        const estimatedDuration = (distance / 1000) / 50 * 3600;
        
        return { 
          id: request.id, 
          distanceInfo: {
            distance,
            duration: estimatedDuration,
            distanceText: `~${formatDistance(distance)}`,
            durationText: `~${formatDuration(estimatedDuration)}`
          },
          success: false 
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ id, distanceInfo }) => {
      results[id] = distanceInfo;
    });
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

// Utility functions
const toRadians = (degrees: number): number => degrees * Math.PI / 180;

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

/**
 * Check if paramedic is within acceptable response distance
 */
export const isWithinResponseRange = (
  distanceMeters: number, 
  priority: 'low' | 'medium' | 'high' | 'critical'
): boolean => {
  const maxDistances = {
    critical: 5000,  // 5km for critical
    high: 10000,     // 10km for high
    medium: 15000,   // 15km for medium
    low: 20000       // 20km for low
  };
  
  return distanceMeters <= maxDistances[priority];
};

/**
 * Get estimated speed based on profile
 */
export const getEstimatedSpeed = (profile: 'driving-car' | 'foot-walking' | 'cycling-regular'): number => {
  const speeds = {
    'driving-car': 50, // km/h
    'foot-walking': 5, // km/h
    'cycling-regular': 15 // km/h
  };
  
  return speeds[profile];
};

/**
 * Calculate ETA based on current time and duration
 */
export const calculateETA = (durationSeconds: number): Date => {
  const now = new Date();
  return new Date(now.getTime() + durationSeconds * 1000);
};

/**
 * Format ETA for display
 */
export const formatETA = (eta: Date): string => {
  return eta.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if API key is configured
 */
export const isApiKeyConfigured = (): boolean => {
  return typeof ORS_API_KEY === 'string' && ORS_API_KEY.trim() !== '' && ORS_API_KEY !== 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUzYzMyMGMxMTQ4MTRjMThhNmI3YTE4OGExOTk5MjNkIiwiaCI6Im11cm11cjY0In0=';
};

/**
 * Get service status
 */
export const getServiceStatus = (): {
  configured: boolean;
  message: string;
} => {
  if (!isApiKeyConfigured()) {
    return {
      configured: false,
      message: 'OpenRouteService API key not configured. Add NEXT_PUBLIC_OPENROUTE_API_KEY to your environment variables.'
    };
  }
  
  return {
    configured: true,
    message: 'OpenRouteService is configured and ready to use.'
  };
};