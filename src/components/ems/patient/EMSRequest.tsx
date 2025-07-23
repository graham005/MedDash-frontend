import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { useCreateEMSRequest } from '@/hooks/useEMS';
import { useGeolocation } from '@/hooks/useGeolocation';
import { EMERGENCY_TYPE_CONFIG, PRIORITY_CONFIG } from '@/api/ems';
import { EmergencyType, Priority} from '../../../types/enums'
import { toast } from 'sonner';

export default function EMSRequest() {
  const navigate = useNavigate();
  const createRequest = useCreateEMSRequest();
  
  const [formData, setFormData] = useState({
    emergencyType: '' as EmergencyType,
    priority: Priority.MEDIUM,
    description: '',
    contactNumber: '',
  });

  const [step, setStep] = useState<'location' | 'details' | 'confirm'>('location');

  const {
    latitude,
    longitude,
    accuracy,
    error: locationError,
    loading: locationLoading,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
  });

  const handleEmergencyTypeSelect = (type: EmergencyType) => {
    setFormData(prev => ({ ...prev, emergencyType: type }));
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!latitude || !longitude) {
      toast.error('Location is required for emergency requests');
      return;
    }

    if (!formData.emergencyType) {
      toast.error('Please select an emergency type');
      return;
    }

    try {
      await createRequest.mutateAsync({
        lat: latitude,
        lng: longitude,
        emergencyType: formData.emergencyType,
        priority: formData.priority,
        description: formData.description || undefined,
        contactNumber: formData.contactNumber || undefined,
      });

      navigate({ to: '/dashboard/patient/ems' });
    } catch (error) {
      console.error('Failed to create EMS request:', error);
    }
  };

  if (step === 'location') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Emergency Request
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                We need your location to dispatch help
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {locationError ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 font-medium">Location Error</p>
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">{locationError}</p>
                  </div>
                  
                  <Button
                    onClick={getCurrentPosition}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : locationLoading ? (
                <div className="text-center space-y-4">
                  <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
                </div>
              ) : latitude && longitude ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Location obtained successfully</span>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p><strong>Latitude:</strong> {latitude.toFixed(6)}</p>
                      <p><strong>Longitude:</strong> {longitude.toFixed(6)}</p>
                      <p><strong>Accuracy:</strong> ±{accuracy?.toFixed(0)}m</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep('details')}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    Continue to Emergency Details
                  </Button>
                </div>
              ) : null}
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Your location will be shared with emergency responders only</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Emergency Type
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Select the type of emergency to help us dispatch the right help
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(EmergencyType).map((type) => {
                  const config = EMERGENCY_TYPE_CONFIG[type];
                  const isSelected = formData.emergencyType === type;
                  
                  return (
                    <Card
                      key={type}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'ring-2 ring-red-500 border-red-200'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => handleEmergencyTypeSelect(type)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">{config.icon}</div>
                        <h3 className="font-medium text-sm">{config.label}</h3>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Priority) =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Priority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${PRIORITY_CONFIG[priority].badgeColor}`}
                            />
                            {PRIORITY_CONFIG[priority].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, contactNumber: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide any additional details about the emergency..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('location')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={!formData.emergencyType}
                  >
                    Review Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Confirm Emergency Request
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Emergency Type:</span>
                <Badge variant="destructive">
                  {EMERGENCY_TYPE_CONFIG[formData.emergencyType].label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Priority:</span>
                <Badge className={PRIORITY_CONFIG[formData.priority].color}>
                  {PRIORITY_CONFIG[formData.priority].label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Location:</span>
                <span className="text-sm">
                  {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                </span>
              </div>

              {formData.contactNumber && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Contact:</span>
                  <span className="text-sm">{formData.contactNumber}</span>
                </div>
              )}

              {formData.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                What happens next:
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Your request will be immediately dispatched</li>
                <li>• A paramedic will be assigned to your case</li>
                <li>• You'll receive real-time updates on their arrival</li>
                <li>• Emergency services may contact you directly</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Dispatching Help...
                  </>
                ) : (
                  'Send Emergency Request'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}