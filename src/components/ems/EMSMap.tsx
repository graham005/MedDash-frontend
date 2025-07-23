import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/api/ems';
import type { EMSRequest } from '../../types/types'; 

// Simple map implementation using OpenStreetMap
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

export default function EMSMap({
  requests,
  selectedRequest,
  onRequestSelect,
  showPatientLocation = true,
  showParamedicLocation = true,
  className = ''
}: EMSMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // Create markers from requests
  useEffect(() => {
    const newMarkers: MarkerData[] = [];

    requests.forEach(request => {
      if (showPatientLocation && request.patientLat && request.patientLng) {
        newMarkers.push({
          id: `patient-${request.id}`,
          lat: request.patientLat,
          lng: request.patientLng,
          type: 'patient',
          request,
        });
      }

      if (showParamedicLocation && request.paramedicLat && request.paramedicLng) {
        newMarkers.push({
          id: `paramedic-${request.id}`,
          lat: request.paramedicLat,
          lng: request.paramedicLng,
          type: 'paramedic',
          request,
        });
      }
    });

    setMarkers(newMarkers);
  }, [requests, showPatientLocation, showParamedicLocation]);

  return (
    <div className={`relative ${className}`}>
      <Card className="h-full min-h-[400px] overflow-hidden">
        {/* Map Container */}
        <div ref={mapRef} className="relative w-full h-full bg-gray-100 dark:bg-gray-800">
          {/* Simple grid background to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Markers */}
          <div className="absolute inset-0">
            {markers.map((marker, index) => {
              const isSelected = selectedRequest?.id === marker.request.id;
              const priorityConfig = PRIORITY_CONFIG[marker.request.priority];
              
              return (
                <div
                  key={marker.id}
                  className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                    isSelected ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${20 + (index * 15) % 60}%`,
                    top: `${20 + (index * 12) % 60}%`,
                  }}
                  onClick={() => onRequestSelect?.(marker.request)}
                >
                  {/* Marker */}
                  <div
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${
                      marker.type === 'patient'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    } ${isSelected ? 'ring-4 ring-yellow-400' : ''}`}
                  >
                    {marker.type === 'patient' ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </div>

                  {/* Priority indicator */}
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${priorityConfig.badgeColor}`}
                  />

                  {/* Tooltip */}
                  {isSelected && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
                      <Card className="p-3 shadow-lg border">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={STATUS_CONFIG[marker.request.status].color}>
                              {STATUS_CONFIG[marker.request.status].label}
                            </Badge>
                            <Badge className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                          </div>
                          
                          <div className="text-sm">
                            <p className="font-medium">
                              {marker.type === 'patient' ? 'Patient' : 'Paramedic'}: {' '}
                              {marker.type === 'patient' 
                                ? `${marker.request.patient.firstName} ${marker.request.patient.lastName}`
                                : marker.request.paramedic
                                  ? `${marker.request.paramedic.firstName} ${marker.request.paramedic.lastName}`
                                  : 'Not assigned'
                              }
                            </p>
                            
                            <p className="text-gray-600 dark:text-gray-400">
                              Emergency: {marker.request.emergencyType.replace('_', ' ')}
                            </p>
                            
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">
                                {new Date(marker.request.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

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
                              Call
                            </Button>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800 shadow"
              onClick={() => {
                // Simulate zoom in
                console.log('Zoom in');
              }}
            >
              +
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-gray-800 shadow"
              onClick={() => {
                // Simulate zoom out
                console.log('Zoom out');
              }}
            >
              -
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4">
            <Card className="p-3 space-y-2">
              <div className="text-xs font-medium">Legend</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Patient</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Paramedic</span>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}