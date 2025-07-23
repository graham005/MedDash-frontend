import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Users,
  Activity,
  RefreshCw,
  UserCheck,
  Phone,
  MessageSquare
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { useActiveEMSRequests, useAssignParamedic } from '@/hooks/useEMS';
import { useUsers } from '@/hooks/useUsers';
import { useEMSWebSocket } from '@/hooks/useEMSWebSocket';
import EMSMap from '../EMSMap';
import { STATUS_CONFIG, PRIORITY_CONFIG, EMERGENCY_TYPE_CONFIG } from '@/api/ems';
import { UserRole } from '@/types/enums';
import type { EMSRequest } from '../../../types/types'; 
import { toast } from 'sonner';

export default function AdminEMSDashboard() {
  const { data: requests = [], isLoading, refetch } = useActiveEMSRequests();
  const { data: paramedics = [] } = useUsers(UserRole.PARAMEDIC);
  const assignParamedic = useAssignParamedic();
  const [selectedRequest, setSelectedRequest] = useState<EMSRequest | null>(null);
  const [timeFilter, setTimeFilter] = useState('today');

  const {
    isConnected,
    onNewEMSRequest,
    onStatusChanged,
  } = useEMSWebSocket();

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeNew = onNewEMSRequest((data) => {
      toast.error(`🚨 NEW EMERGENCY: ${data.message}`, {
        duration: 15000,
      });
      refetch();
    });

    const unsubscribeStatus = onStatusChanged((data) => {
      toast.info(`Status Update: Request ${data.requestId.slice(-8)} is now ${data.status}`);
      refetch();
    });

    return () => {
      unsubscribeNew();
      unsubscribeStatus();
    };
  }, []);

  // Filter requests by time
  const getFilteredRequests = () => {
    const now = new Date();
    let startDate = startOfDay(now);
    
    switch (timeFilter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      default:
        return requests;
    }

    return requests.filter(request => 
      new Date(request.createdAt) >= startDate
    );
  };

  const filteredRequests = getFilteredRequests();
  const unassignedRequests = filteredRequests.filter(req => !req.paramedic);
  const criticalRequests = filteredRequests.filter(req => req.priority === 'critical');
  const activeRequests = filteredRequests.filter(req => 
    ['pending', 'enroute', 'arrived'].includes(req.status)
  );

  const handleAssignParamedic = async (requestId: string, paramedicId: string) => {
    try {
      await assignParamedic.mutateAsync({ requestId, paramedicId });
      toast.success('Paramedic assigned successfully!');
    } catch (error) {
      toast.error('Failed to assign paramedic');
    }
  };

  // Calculate response time average
  const getAverageResponseTime = () => {
    const completedRequests = filteredRequests.filter(req => req.completionTime);
    if (completedRequests.length === 0) return 'N/A';
    
    const totalTime = completedRequests.reduce((acc, req) => {
      const start = new Date(req.createdAt);
      const end = new Date(req.completionTime!);
      return acc + (end.getTime() - start.getTime());
    }, 0);
    
    const avgMinutes = Math.round(totalTime / (completedRequests.length * 60000));
    return `${avgMinutes}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              EMS Control Center
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 dark:text-gray-400">
                Emergency Medical Services Administration
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live Updates Active' : 'Connection Lost'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalRequests.length > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    Critical Emergencies Requiring Attention
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {criticalRequests.length} critical request{criticalRequests.length !== 1 ? 's' : ''} need immediate dispatch
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Requests
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {activeRequests.length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

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
                    Critical
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {criticalRequests.length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Response
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {getAverageResponseTime()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Available Staff
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {paramedics.length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unassigned Requests - Priority Queue */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Unassigned Requests
                {unassignedRequests.length > 0 && (
                  <Badge variant="destructive">{unassignedRequests.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-green-300" />
                  <p className="text-gray-500 dark:text-gray-400">
                    All requests assigned
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Great work! All emergencies have paramedics assigned.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {unassignedRequests
                    .sort((a, b) => {
                      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
                    })
                    .map((request) => (
                    <Card 
                      key={request.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''
                      } ${request.priority === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {EMERGENCY_TYPE_CONFIG[request.emergencyType as keyof typeof EMERGENCY_TYPE_CONFIG].icon}
                              </span>
                              <div>
                                <p className="font-medium text-sm">
                                  {EMERGENCY_TYPE_CONFIG[request.emergencyType as keyof typeof EMERGENCY_TYPE_CONFIG].label}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {request.id.slice(-8)}
                                </p>
                              </div>
                            </div>
                            <Badge className={PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG].color}>
                              {PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG].label}
                            </Badge>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 60000)}min ago
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {request.patientLat.toFixed(3)}, {request.patientLng.toFixed(3)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <Select
                              onValueChange={(paramedicId) => 
                                handleAssignParamedic(request.id, paramedicId)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Assign Paramedic" />
                              </SelectTrigger>
                              <SelectContent>
                                {paramedics.map((paramedic) => (
                                  <SelectItem key={paramedic.id} value={paramedic.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      {paramedic.firstName} {paramedic.lastName}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Operations Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Live Operations Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EMSMap
                requests={activeRequests}
                selectedRequest={selectedRequest}
                onRequestSelect={setSelectedRequest}
                showPatientLocation={true}
                showParamedicLocation={true}
                className="h-[600px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Active Operations Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRequests.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400">
                  No active emergency operations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <Card key={request.id} className="bg-blue-50 dark:bg-blue-900/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">
                            {EMERGENCY_TYPE_CONFIG[request.emergencyType as keyof typeof EMERGENCY_TYPE_CONFIG].icon}
                          </span>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {EMERGENCY_TYPE_CONFIG[request.emergencyType as keyof typeof EMERGENCY_TYPE_CONFIG].label}
                              </p>
                              <Badge className={STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG].color}>
                                {STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG].label}
                              </Badge>
                              <Badge className={PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG].color}>
                                {PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG].label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                Patient: {request.patient.firstName} {request.patient.lastName}
                              </span>
                              {request.paramedic && (
                                <span>
                                  Paramedic: {request.paramedic.firstName} {request.paramedic.lastName}
                                </span>
                              )}
                              <span>
                                {format(new Date(request.createdAt), 'h:mm a')} • 
                                {Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 60000)}min
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            Track
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
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Open communication modal
                              toast.info('Communication feature coming soon!');
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
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