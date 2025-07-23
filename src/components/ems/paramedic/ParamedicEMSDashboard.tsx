import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  Car,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useActiveEMSRequests, useMyEMSRequests, useUpdateEMSStatus, useUpdateParamedicLocation, useAssignParamedic } from '@/hooks/useEMS';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useEMSWebSocket } from '@/hooks/useEMSWebSocket';
import EMSMap from '../EMSMap';
import { STATUS_CONFIG, PRIORITY_CONFIG, EMERGENCY_TYPE_CONFIG } from '@/api/ems';
import { toast } from 'sonner';
import type { EMSRequest } from '../../../types/types';
import { EMSStatus } from '../../../types/enums'
import { useCurrentUser } from '@/hooks/useAuth';

export default function ParamedicEMSDashboard() {
  const { data: requests = [], isLoading, refetch } = useActiveEMSRequests();
  const { data: allRequests = []} = useMyEMSRequests()
  const updateStatus = useUpdateEMSStatus();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const updateLocation = useUpdateParamedicLocation();
  const assignParamedic = useAssignParamedic();
  const [selectedRequest, setSelectedRequest] = useState<EMSRequest | null>(null);
  const [activeRequest, setActiveRequest] = useState<EMSRequest | null>(null);

  console.log("requests",allRequests)
  const {
    isConnected,
    joinEMSRoom,
    leaveEMSRoom,
    updateParamedicLocation: socketUpdateLocation,
    onNewEMSRequest,
  } = useEMSWebSocket();

  // Get current location and update it every 30 seconds when actively responding
  useGeolocation({
    watch: !!activeRequest,
    onUpdate: (position) => {
      if (activeRequest && activeRequest.status === EMSStatus.ENROUTE) {
        updateLocation.mutate({
          requestId: activeRequest.id,
          locationData: { lat: position.lat, lng: position.lng }
        });
        socketUpdateLocation(activeRequest.id, position.lat, position.lng);
      }
    },
  });

  // Listen for new emergency requests
  useEffect(() => {
    const unsubscribe = onNewEMSRequest((data) => {
      toast.error(`🚨 NEW EMERGENCY: ${data.message}`, {
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => {
            refetch();
            setSelectedRequest(data);
          },
        },
      });
    });

    // Return a cleanup function that calls unsubscribe
    return () => {
      unsubscribe?.();
    };
  }, [onNewEMSRequest, refetch]);

  // Filter requests assigned to this paramedic or unassigned
  const myRequests = requests.filter(req =>
    !req.paramedic || req.paramedic.id === currentUser?.profile?.user?.id // Replace with actual user ID
  );

  const unassignedRequests = requests.filter(req => !req.paramedic);
  const assignedToMe = requests.filter(req =>
    req.paramedic && req.paramedic.id === currentUser?.profile?.user?.id
  );

  const handleAcceptRequest = async (request: EMSRequest) => {
    try {
      // Assign paramedic to the request
      if (!currentUser?.profile?.user?.id) {
        toast.error('User ID not found. Cannot assign paramedic.');
        return;
      }
      await assignParamedic.mutateAsync({
        requestId: request.id,
        paramedicId: currentUser.profile.user.id,
      });
      // Then update status to ENROUTE
      await updateStatus.mutateAsync({
        requestId: request.id,
        statusData: { status: EMSStatus.ENROUTE }
      });
      setActiveRequest(request);
      joinEMSRoom(request.id);
      toast.success('Request accepted! En route to patient.');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleStatusUpdate = async (requestId: string, status: EMSStatus, notes?: string) => {
    try {
      await updateStatus.mutateAsync({
        requestId,
        statusData: { status, notes }
      });

      if (status === EMSStatus.COMPLETED || status === EMSStatus.CANCELLED) {
        setActiveRequest(null);
        leaveEMSRoom(requestId);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Paramedic Dashboard
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 dark:text-gray-400">
                Emergency Medical Services Operations
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Active Request Alert */}
        {activeRequest && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="w-6 h-6 text-blue-600 animate-pulse" />
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200">
                      Active Emergency Response
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {EMERGENCY_TYPE_CONFIG[activeRequest.emergencyType].label} •
                      {PRIORITY_CONFIG[activeRequest.priority].label} Priority
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(activeRequest.id, EMSStatus.ARRIVED)}
                    disabled={activeRequest.status === EMSStatus.ARRIVED}
                  >
                    Mark Arrived
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(activeRequest.id, EMSStatus.COMPLETED)}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Unassigned
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {unassignedRequests.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Assigned to Me
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {assignedToMe.length}
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {activeRequest ? 1 : 0}
                  </p>
                </div>
                <Car className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Response Time
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    8min
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Available Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No unassigned emergency requests
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Great job! All emergencies are being handled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {unassignedRequests
                    .sort((a, b) => {
                      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((request) => (
                      <Card
                        key={request.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                        onClick={() => setSelectedRequest(request)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {EMERGENCY_TYPE_CONFIG[request.emergencyType].icon}
                              </span>
                              <div>
                                <p className="font-medium">
                                  {EMERGENCY_TYPE_CONFIG[request.emergencyType].label}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Patient: {request.patient.firstName} {request.patient.lastName}
                                </p>
                              </div>
                            </div>
                            <Badge className={PRIORITY_CONFIG[request.priority].color}>
                              {PRIORITY_CONFIG[request.priority].label}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>
                                {format(new Date(request.createdAt), 'h:mm a')} •
                                {Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 60000)}min ago
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {request.patientLat.toFixed(4)}, {request.patientLng.toFixed(4)}
                              </span>
                            </div>

                            {request.description && (
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                "{request.description}"
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(request);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              disabled={updateStatus.isPending || assignParamedic.isPending || !!request.paramedic}
                            >
                              {assignParamedic.isPending || updateStatus.isPending ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Assigning...
                                </>
                              ) : request.paramedic ? (
                                <>
                                  <Car className="w-4 h-4 mr-2" />
                                  En Route
                                </>
                              ) : (
                                <>
                                  <Car className="w-4 h-4 mr-2" />
                                  Accept & Respond
                                </>
                              )}
                            </Button>

                            {request.contactNumber && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${request.contactNumber}`);
                                }}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Live Emergency Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EMSMap
                requests={requests}
                selectedRequest={selectedRequest}
                onRequestSelect={setSelectedRequest}
                showParamedicLocation={true}
                className="h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* My Active Assignments */}
        {assignedToMe.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                My Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedToMe.map((request) => (
                  <Card key={request.id} className="bg-blue-50 dark:bg-blue-900/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {EMERGENCY_TYPE_CONFIG[request.emergencyType].icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {EMERGENCY_TYPE_CONFIG[request.emergencyType].label}
                              </p>
                              <Badge className={STATUS_CONFIG[request.status].color}>
                                {STATUS_CONFIG[request.status].label}
                              </Badge>
                              <Badge className={PRIORITY_CONFIG[request.priority].color}>
                                {PRIORITY_CONFIG[request.priority].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Patient: {request.patient.firstName} {request.patient.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Started: {format(new Date(request.dispatchTime || request.createdAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {request.status === EMSStatus.ENROUTE && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(request.id, EMSStatus.ARRIVED)}
                            >
                              Mark Arrived
                            </Button>
                          )}

                          {request.status === EMSStatus.ARRIVED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(request.id, EMSStatus.COMPLETED)}
                            >
                              Complete
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <MapPin className="w-4 h-4" />
                          </Button>

                          {request.contactNumber && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`tel:${request.contactNumber}`)}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Completed Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              My Completed Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(allRequests ?? []).filter(
              req =>
                req.paramedic &&
                req.paramedic.id === currentUser?.profile?.user?.id &&
                req.status === EMSStatus.COMPLETED
            ).length == 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                <p className="text-gray-500 dark:text-gray-400">
                  No completed requests yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(allRequests ?? [])
                  .filter(
                    req =>
                      req.paramedic &&
                      req.paramedic.id === currentUser?.profile?.user?.id &&
                      req.status === EMSStatus.COMPLETED
                  )
                  .slice(0, 5)
                  .map(request => (
                    <Card key={request.id} className="bg-emerald-50 dark:bg-emerald-900/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {EMERGENCY_TYPE_CONFIG[request.emergencyType].icon}
                            </span>
                            <div>
                              <p className="font-medium">
                                {EMERGENCY_TYPE_CONFIG[request.emergencyType].label}
                              </p>
                              <p className="text-sm text-gray-500">
                                Patient: {request.patient.firstName} {request.patient.lastName}
                              </p>
                            </div>
                          </div>
                          <Badge className={STATUS_CONFIG[request.status].color}>
                            {STATUS_CONFIG[request.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>
                            Completed: {format(new Date(request.updatedAt || request.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}