import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  FileText,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_CONFIG, PRIORITY_CONFIG, EMERGENCY_TYPE_CONFIG } from '@/api/ems';
import type { EMSRequest } from '../../types/types'; 
import { useDistanceTracking } from '@/hooks/useRouteTracking';

interface EMSRequestDetailsProps {
  request: EMSRequest;
  onClose?: () => void;
  showActions?: boolean;
  userRole?: 'patient' | 'paramedic' | 'admin';
  paramedicLocation?: { lat: number; lng: number } | null;
}

export default function EMSRequestDetails({ 
  request, 
  onClose, 
  showActions = false,
  userRole = 'patient',
  paramedicLocation = null
}: EMSRequestDetailsProps) {
  const emergencyConfig = EMERGENCY_TYPE_CONFIG[request.emergencyType ];
  const priorityConfig = PRIORITY_CONFIG[request.priority];
  const statusConfig = STATUS_CONFIG[request.status];

  const { distance, isLoading } = useDistanceTracking(
    paramedicLocation,
    { lat: request.patientLat, lng: request.patientLng }
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-3xl">{emergencyConfig.icon}</span>
            <div>
              <h2 className="text-xl">{emergencyConfig.label}</h2>
              <p className="text-sm text-gray-500 font-normal">
                Request ID: {request.id}
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            <Badge className={priorityConfig.color}>
              {priorityConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Route Information for Paramedics */}
        {userRole === 'paramedic' && paramedicLocation && (
          <>
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Route Information
              </h3>
              
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating route...</span>
                </div>
              ) : distance ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="text-gray-500">Distance</p>
                    <p className="font-medium text-lg">{distance.distanceText}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                    <p className="text-gray-500">Estimated Time</p>
                    <p className="font-medium text-lg">{distance.durationText}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Unable to calculate route</p>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${request.patientLat},${request.patientLng}`;
                  window.open(url, '_blank');
                }}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span>Request Created</span>
              <span>{format(new Date(request.createdAt), 'MMM d, h:mm a')}</span>
            </div>
            
            {request.dispatchTime && (
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span>Paramedic Dispatched</span>
                <span>{format(new Date(request.dispatchTime), 'MMM d, h:mm a')}</span>
              </div>
            )}
            
            {request.arrivalTime && (
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span>Paramedic Arrived</span>
                <span>{format(new Date(request.arrivalTime), 'MMM d, h:mm a')}</span>
              </div>
            )}
            
            {request.completionTime && (
              <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                <span>Request Completed</span>
                <span>{format(new Date(request.completionTime), 'MMM d, h:mm a')}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Patient Information */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Patient Information
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium">
                {request.patient.firstName} {request.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{request.patient.email}</p>
            </div>
            {request.patient.phoneNumber && (
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{request.patient.phoneNumber}</p>
              </div>
            )}
            {request.contactNumber && (
              <div>
                <p className="text-gray-500">Emergency Contact</p>
                <p className="font-medium">{request.contactNumber}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Paramedic Information */}
        {request.paramedic && (
          <>
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Assigned Paramedic
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">
                    {request.paramedic.firstName} {request.paramedic.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="font-medium">{request.paramedic.email}</p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Location Information */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Information
          </h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-500">Patient Location</p>
              <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {request.patientLat.toFixed(6)}, {request.patientLng.toFixed(6)}
              </p>
            </div>
            
            {request.paramedicLat && request.paramedicLng && (
              <div>
                <p className="text-gray-500">Paramedic Location</p>
                <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {request.paramedicLat.toFixed(6)}, {request.paramedicLng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Description & Notes */}
        {(request.description || request.notes) && (
          <>
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Information
              </h3>
              
              {request.description && (
                <div>
                  <p className="text-gray-500 text-sm">Patient Description</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                    {request.description}
                  </p>
                </div>
              )}
              
              {request.notes && (
                <div>
                  <p className="text-gray-500 text-sm">Paramedic Notes</p>
                  <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1">
                    {request.notes}
                  </p>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3">
            {request.contactNumber && (
              <Button
                variant="outline"
                onClick={() => window.open(`tel:${request.contactNumber}`)}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Emergency Contact
              </Button>
            )}
            
            {userRole === 'admin' && (
              <Button
                variant="outline"
                onClick={() => {
                  // Open assignment modal
                  console.log('Assign paramedic');
                }}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                Assign Paramedic
              </Button>
            )}
            
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}