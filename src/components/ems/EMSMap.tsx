import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Navigation,
  Route,
  RefreshCw,
  Target
} from 'lucide-react';
import L from 'leaflet';
import type { EMSRequest } from '@/types/types';
import { useRouteTracking } from '@/hooks/useRouteTracking';

// Import Leaflet CSS - This is crucial for proper map display
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EMSMapWithRouteProps {
  requests: EMSRequest[];
  selectedRequest: EMSRequest | null;
  paramedicLocation: { lat: number; lng: number } | null;
  activeRequest: EMSRequest | null;
  onRequestSelect?: (request: EMSRequest) => void;
  className?: string;
  showPatientLocation?: boolean;      // <-- Add this line
  showParamedicLocation?: boolean;    // <-- Add this line
}

// Enhanced Route display component with map invalidation
function RouteDisplay({ route }: { route: any }) {
  const map = useMap();

  useEffect(() => {
    if (route && route.coordinates && route.coordinates.length > 0) {
      try {
        // Fit map to show the entire route
        const bounds = L.latLngBounds(route.coordinates);
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 16 // Prevent zooming too close
        });

        // Force map to invalidate size after fitting bounds
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } catch (error) {
        console.warn('Error fitting route bounds:', error);
      }
    }
  }, [route, map]);

  return null;
}

// Map invalidation component to fix display issues
function MapSizeHandler() {
  const map = useMap();

  useEffect(() => {
    // Force map to recalculate size on mount and when container changes
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Initial size invalidation
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

function PanToPatient({ patientLat, patientLng }: { patientLat: number, patientLng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && patientLat && patientLng) {
      map.setView([patientLat, patientLng], 15, { animate: true });
    }
  }, [map, patientLat, patientLng]);
  return null;
}

export default function EMSMapWithRoute({
  requests,
  selectedRequest,
  paramedicLocation,
  activeRequest,
  onRequestSelect,
  className = ''
}: EMSMapWithRouteProps) {
  const {
    currentRoute,
    distanceToPatient,
    distancesToRequests,
    isCalculating,
    getETA,
    getClosestRequest,
    refreshRoutes
  } = useRouteTracking(paramedicLocation, activeRequest, requests);

  const [showRoute, setShowRoute] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const closestRequest = getClosestRequest();
  const eta = getETA();

  // Handle map ready state
  const handleMapReady = () => {
    setMapReady(true);
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="h-full overflow-hidden">
        {/* Route Info Panel */}
        {activeRequest && distanceToPatient && (
          <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Active Route
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshRoutes}
                disabled={isCalculating}
              >
                <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{distanceToPatient.distanceText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{distanceToPatient.durationText}</span>
              </div>
              {eta && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium">{eta.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setShowRoute(!showRoute)}
            >
              <Route className="w-4 h-4 mr-2" />
              {showRoute ? 'Hide Route' : 'Show Route'}
            </Button>
          </div>
        )}

        {/* Closest Request Indicator */}
        {!activeRequest && closestRequest && (
          <div className="absolute top-4 right-4 z-[1000] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">
                Closest: {distancesToRequests[closestRequest.id]?.distanceText}
              </span>
            </div>
          </div>
        )}

        {/* Map Container with explicit height and styles */}
        <div className="relative w-full h-full min-h-[400px]">
          <MapContainer
            center={paramedicLocation ? [paramedicLocation.lat, paramedicLocation.lng] : [-1.2921, 36.8219]}
            zoom={13}
            className="h-full w-full"
            style={{
              height: '100%',
              width: '100%',
              minHeight: '400px',
              zIndex: 1
            }}
            whenReady={handleMapReady}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              minZoom={3}
            />

            {/* Map size handler */}
            <MapSizeHandler />

            {/* Pan to patient location when selectedRequest changes */}
            {selectedRequest && (
              <PanToPatient patientLat={selectedRequest.patientLat} patientLng={selectedRequest.patientLng} />
            )}

            {/* Display route if available */}
            {showRoute && currentRoute && currentRoute.coordinates && mapReady && (
              <>
                <Polyline
                  positions={currentRoute.coordinates}
                  color="#3b82f6"
                  weight={6}
                  opacity={0.8}
                />
                <RouteDisplay route={currentRoute} />
              </>
            )}

            {/* Paramedic location */}
            {paramedicLocation && mapReady && (
              <Marker
                position={[paramedicLocation.lat, paramedicLocation.lng]}
                icon={L.divIcon({
                  html: `
                    <div class="flex items-center justify-center bg-blue-600 text-white rounded-full p-2 shadow-lg border-2 border-white" style="width: 32px; height: 32px;">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2L3 7v11a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1V7l-7-5z"/>
                      </svg>
                    </div>
                  `,
                  className: 'custom-marker',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium text-blue-600">Your Location</h3>
                    <p className="text-sm text-gray-600">
                      {paramedicLocation.lat.toFixed(4)}, {paramedicLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Patient locations */}
            {mapReady && requests.map(request => {
              const distance = distancesToRequests[request.id];
              const isActive = activeRequest?.id === request.id;
              const isSelected = selectedRequest?.id === request.id;

              return (
                <Marker
                  key={request.id}
                  position={[request.patientLat, request.patientLng]}
                  icon={L.divIcon({
                    html: `
                      <div class="relative flex flex-col items-center">
                        <div class="flex items-center justify-center ${isActive ? 'bg-red-600 animate-pulse' : isSelected ? 'bg-orange-500' : 'bg-red-500'} text-white rounded-full p-2 shadow-lg border-2 border-white" style="width: 32px; height: 32px;">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                          </svg>
                        </div>
                        ${distance ? `
                          <div class="absolute top-8 bg-white dark:bg-gray-800 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap border">
                            ${distance.distanceText}
                          </div>
                        ` : ''}
                      </div>
                    `,
                    className: 'custom-marker',
                    iconSize: [32, distance ? 60 : 32],
                    iconAnchor: [16, 16],
                  })}
                  eventHandlers={{
                    click: () => onRequestSelect?.(request),
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-64">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Emergency Request</h3>
                        <Badge className="text-xs">
                          {request.priority.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Patient:</span>
                          <span className="ml-2 font-medium">
                            {request.patient.firstName} {request.patient.lastName}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2">{request.emergencyType}</span>
                        </div>

                        {distance && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">{distance.distanceText}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{distance.durationText}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${request.patientLat},${request.patientLng}`;
                            window.open(url, '_blank');
                          }}
                          className="flex-1"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Directions
                        </Button>

                        {request.contactNumber && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${request.contactNumber}`)}
                            className="flex-1"
                          >
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
}