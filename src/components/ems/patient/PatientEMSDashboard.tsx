import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Phone, 
  Navigation,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useMyEMSRequests } from '@/hooks/useEMS';
import EMSMap from '../EMSMap';
import { STATUS_CONFIG, PRIORITY_CONFIG, EMERGENCY_TYPE_CONFIG } from '@/api/ems';
import type { EMSRequest } from '../../../types/types'; 
import { toast } from 'react-toastify';

export default function PatientEMSDashboard() {
  const navigate = useNavigate();
  const { data: requests = [], isLoading, refetch } = useMyEMSRequests();
  const [selectedRequest, setSelectedRequest] = useState<EMSRequest | null>(null);

  const activeRequests = requests.filter(req => 
    ['pending', 'enroute', 'arrived'].includes(req.status)
  );
  const completedRequests = requests.filter(req => 
    ['completed', 'cancelled'].includes(req.status)
  ).slice(0, 5);

  // Check if user has active request
  const hasActiveRequest = activeRequests.length > 0;

  // Function to handle emergency request navigation
  const handleEmergencyRequest = () => {
    if (hasActiveRequest) {
      toast.error('You already have an active emergency request. Please wait for it to be completed or cancelled before creating a new one.');
      return;
    }
    navigate({ to: '/dashboard/patient/ems/request' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your emergency requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Emergency Services
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your emergency requests and track help
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleEmergencyRequest}
              className={`${hasActiveRequest 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'}`}
              disabled={hasActiveRequest}
            >
              <Plus className="w-4 h-4 mr-2" />
              {hasActiveRequest ? 'Request Active' : 'Emergency Request'}
            </Button>
          </div>
        </div>

        {/* Emergency Alert */}
        {activeRequests.length > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    Active Emergency Request
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    You have {activeRequests.length} active emergency request{activeRequests.length !== 1 ? 's' : ''}. 
                    Help is on the way. You cannot create new requests until this is completed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Requests
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {activeRequests.length}
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
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {requests.length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Active Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRequests.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No active emergency requests
                  </p>
                  <Button
                    onClick={() => navigate({ to: '/dashboard/patient/ems/request' })}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Emergency Help
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((request) => (
                    <Card 
                      key={request.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
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
                                ID: {request.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={STATUS_CONFIG[request.status].color}>
                              {STATUS_CONFIG[request.status].label}
                            </Badge>
                            <Badge className={PRIORITY_CONFIG[request.priority].color}>
                              {PRIORITY_CONFIG[request.priority].label}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                              Requested: {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          
                          {request.paramedic ? (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Navigation className="w-4 h-4" />
                              <span>
                                Paramedic: {request.paramedic.firstName} {request.paramedic.lastName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                              <Clock className="w-4 h-4" />
                              <span>Awaiting paramedic assignment</span>
                            </div>
                          )}

                          {request.contactNumber && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${request.contactNumber}`);
                              }}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call Emergency Contact
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

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EMSMap
                requests={activeRequests}
                selectedRequest={selectedRequest}
                onRequestSelect={setSelectedRequest}
                className="h-[400px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {completedRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400">
                  No previous emergency requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {EMERGENCY_TYPE_CONFIG[request.emergencyType].icon}
                      </span>
                      <div>
                        <p className="font-medium">
                          {EMERGENCY_TYPE_CONFIG[request.emergencyType].label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(request.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={STATUS_CONFIG[request.status].color}>
                        {STATUS_CONFIG[request.status].label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: `/dashboard/patient/ems/${request.id}` })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}