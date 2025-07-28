import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, Clock, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/api/ems';
import type { EMSRequest } from '../../types/types';
import { getAddressFromCoordinates } from '@/hooks/useGeolocation';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EMSMapProps {
  requests: EMSRequest[];
  selectedRequest?: EMSRequest | null;
  onRequestSelect?: (request: EMSRequest) => void;
  showPatientLocation?: boolean;
  showParamedicLocation?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
}

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  type: 'patient' | 'paramedic';
  request: EMSRequest;
}

// Add interface for marker with address
interface MarkerDataWithAddress extends MarkerData {
  address?: string;
}

// Custom Icons
type PriorityKey = keyof typeof PRIORITY_CONFIG;

const createCustomIcon = (type: 'patient' | 'paramedic', priority: string, isSelected: boolean = false) => {
  const priorityConfig = PRIORITY_CONFIG[priority as PriorityKey];
  const size = isSelected ? 40 : 32;
  
  const iconHtml = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      background-color: ${type === 'patient' ? '#ef4444' : '#3b82f6'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      border: ${isSelected ? '3px solid #fbbf24' : '2px solid white'};
    ">
      <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white">
        ${type === 'patient' 
          ? '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>'
          : '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
        }
      </svg>
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: ${size * 0.3}px;
        height: ${size * 0.3}px;
        background-color: ${priorityConfig.badgeColor.includes('red') ? '#dc2626' : priorityConfig.badgeColor.includes('yellow') ? '#eab308' : '#16a34a'};
        border-radius: 50%;
        border: 2px solid white;
      "></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Map controls component
function MapControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  
  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2">
      <Button
        size="sm"
        variant="outline"
        className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl w-10 h-10 p-0"
        onClick={handleZoomIn}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl w-10 h-10 p-0"
        onClick={handleZoomOut}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl w-10 h-10 p-0"
        onClick={onReset}
        title="Reset View"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Auto pan to locations component
function AutoPanToLocations({ 
  markers, 
  selectedRequest, 
  defaultCenter, 
  defaultZoom 
}: { 
  markers: MarkerData[];
  selectedRequest?: EMSRequest | null;
  defaultCenter: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // If a specific request is selected, pan to it
    if (selectedRequest) {
      if (selectedRequest.patientLat && selectedRequest.patientLng) {
        map.setView([selectedRequest.patientLat, selectedRequest.patientLng], 15, {
          animate: true,
          duration: 1
        });
      }
      return;
    }

    // If there are markers, fit bounds to show all locations
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(marker => [marker.lat, marker.lng]));
      
      // Add some padding to the bounds
      const paddedBounds = bounds.pad(0.1);
      
      // Fit the map to show all markers
      map.fitBounds(paddedBounds, {
        animate: true,
        duration: 1,
        maxZoom: 16 // Prevent zooming in too much for single markers
      });
    } else {
      // No markers, return to default view
      map.setView(defaultCenter, defaultZoom, {
        animate: true,
        duration: 1
      });
    }
  }, [map, markers, selectedRequest, defaultCenter, defaultZoom]);

  return null;
}

// Legend component
function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      <Card className="p-3 space-y-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <div className="text-xs font-medium">Legend</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
          <span>Patient Location</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
          <span>Paramedic Location</span>
        </div>
        <div className="border-t pt-2 space-y-1">
          <div className="text-xs font-medium">Priority</div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Routine</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function EMSMap({
  requests,
  selectedRequest,
  onRequestSelect,
  showPatientLocation = true,
  showParamedicLocation = true,
  centerLat = -1.2921, // Nairobi coordinates
  centerLng = 36.8219,
  zoom = 13,
  className = ''
}: EMSMapProps) {
  const [markers, setMarkers] = useState<MarkerDataWithAddress[]>([]);
  const [mapKey, setMapKey] = useState(0);
  const defaultCenter: [number, number] = [centerLat, centerLng];

  // Create markers from requests with address lookup
  useEffect(() => {
    const createMarkersWithAddresses = async () => {
      const newMarkers: MarkerDataWithAddress[] = [];

      for (const request of requests) {
        if (showPatientLocation && request.patientLat && request.patientLng) {
          try {
            const address = await getAddressFromCoordinates(request.patientLat, request.patientLng);
            newMarkers.push({
              id: `patient-${request.id}`,
              lat: request.patientLat,
              lng: request.patientLng,
              type: 'patient',
              request,
              address,
            });
          } catch (error) {
            // Fallback to coordinates if address lookup fails
            newMarkers.push({
              id: `patient-${request.id}`,
              lat: request.patientLat,
              lng: request.patientLng,
              type: 'patient',
              request,
              address: `${request.patientLat.toFixed(4)}, ${request.patientLng.toFixed(4)}`,
            });
          }
        }

        if (showParamedicLocation && request.paramedicLat && request.paramedicLng) {
          try {
            const address = await getAddressFromCoordinates(request.paramedicLat, request.paramedicLng);
            newMarkers.push({
              id: `paramedic-${request.id}`,
              lat: request.paramedicLat,
              lng: request.paramedicLng,
              type: 'paramedic',
              request,
              address,
            });
          } catch (error) {
            newMarkers.push({
              id: `paramedic-${request.id}`,
              lat: request.paramedicLat,
              lng: request.paramedicLng,
              type: 'paramedic',
              request,
              address: `${request.paramedicLat.toFixed(4)}, ${request.paramedicLng.toFixed(4)}`,
            });
          }
        }
      }

      setMarkers(newMarkers);
    };

    createMarkersWithAddresses();
  }, [requests, showPatientLocation, showParamedicLocation]);

  // Force map re-render when markers change significantly
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [requests.length]);

  // Reset map to default view
  const handleResetView = () => {
    setMapKey(prev => prev + 1); // This will trigger a re-render with default center
  };

  // Get the initial center based on data
  const getInitialCenter = (): [number, number] => {
    // If there's a selected request with patient location, center on it
    if (selectedRequest?.patientLat && selectedRequest?.patientLng) {
      return [selectedRequest.patientLat, selectedRequest.patientLng];
    }
    
    // If there are markers, center on the first patient location
    const firstPatientMarker = markers.find(m => m.type === 'patient');
    if (firstPatientMarker) {
      return [firstPatientMarker.lat, firstPatientMarker.lng];
    }
    
    // Fall back to default center
    return defaultCenter;
  };

  const getInitialZoom = (): number => {
    // If there's a selected request or single marker, zoom in more
    if (selectedRequest || markers.length === 1) {
      return 15;
    }
    
    // If multiple markers, use default zoom (fitBounds will override this)
    return zoom;
  };

  return (
    <div className={`relative ${className}`}>
      <Card className="h-full min-h-[400px] overflow-hidden">
        <div className="relative w-full h-full">
          <MapContainer
            key={mapKey}
            center={getInitialCenter()}
            zoom={getInitialZoom()}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            zoomControl={false}
          >
            {/* OpenStreetMap Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Auto pan to locations */}
            <AutoPanToLocations 
              markers={markers}
              selectedRequest={selectedRequest}
              defaultCenter={defaultCenter}
              defaultZoom={zoom}
            />

            {/* Updated markers with address display */}
            {markers.map((marker) => {
              const isSelected = selectedRequest?.id === marker.request.id;
              const icon = createCustomIcon(marker.type, marker.request.priority, isSelected);

              return (
                <Marker
                  key={marker.id}
                  position={[marker.lat, marker.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onRequestSelect?.(marker.request),
                  }}
                >
                  <Popup
                    closeButton={false}
                    className="custom-popup"
                    maxWidth={320}
                  >
                    <div className="p-2 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <Badge className={STATUS_CONFIG[marker.request.status].color}>
                          {STATUS_CONFIG[marker.request.status].label}
                        </Badge>
                        <Badge className={PRIORITY_CONFIG[marker.request.priority].color}>
                          {PRIORITY_CONFIG[marker.request.priority].label}
                        </Badge>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-sm">
                            {marker.type === 'patient' ? 'Patient Location' : 'Paramedic Location'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {marker.type === 'patient' 
                              ? `${marker.request.patient.firstName} ${marker.request.patient.lastName}`
                              : marker.request.paramedic
                                ? `${marker.request.paramedic.firstName} ${marker.request.paramedic.lastName}`
                                : 'Not assigned'
                            }
                          </p>
                        </div>

                        {/* Display address instead of coordinates */}
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                            {marker.address || `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Emergency Type</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {marker.request.emergencyType.replace('_', ' ')}
                          </p>
                        </div>

                        {marker.request.description && (
                          <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {marker.request.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {new Date(marker.request.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        {marker.request.contactNumber && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${marker.request.contactNumber}`);
                            }}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Call {marker.request.contactNumber}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Custom Controls */}
            <MapControls onReset={handleResetView} />
          </MapContainer>

          {/* Legend */}
          <MapLegend />

          {/* Loading overlay when no requests */}
          {requests.length === 0 && (
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 bg-opacity-50 flex items-center justify-center z-[1000]">
              <Card className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No emergency requests to display</p>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}