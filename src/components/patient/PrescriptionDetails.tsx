import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { 
  ArrowLeft, 
  Calendar, 
  User,  
  FileText, 
  Star,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Download,
  Clock,
  Ban
} from 'lucide-react';
import { usePrescriptionById, useRequestRefill } from '@/hooks/usePrescriptions';
import { useMedicines } from '@/hooks/usePharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { generatePrescriptionPDF } from '@/utils/pdfGenerator';
import { PrescriptionStatus } from '@/api/prescription';

export default function PrescriptionDetails() {
  const navigate = useNavigate();
  const { prescriptionId } = useParams({ strict: false });
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [refillNotes, setRefillNotes] = useState('');
  
  const { data: prescription, isLoading, error } = usePrescriptionById(prescriptionId as string);
  const { data: medicines = [] } = useMedicines();
  const requestRefillMutation = useRequestRefill();

  // Helper function to get medicine details with pharmacy info
  const getMedicineWithPharmacy = (medicineId: string) => {
    return medicines.find(med => med.id === medicineId);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format short date
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get prescription status badge
  const getStatusBadge = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case PrescriptionStatus.FULFILLED:
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Fulfilled</Badge>;
      case PrescriptionStatus.REFILL_REQUESTED:
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Refill Requested
        </Badge>;
      case PrescriptionStatus.REFILL_APPROVED:
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Refill Approved
        </Badge>;
      case PrescriptionStatus.EXPIRED:
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
          <Ban className="w-3 h-3 mr-1" />
          Expired
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Unknown</Badge>;
    }
  };

  // Helper function to get prescription status display
  const getPrescriptionStatus = () => {
    if (!prescription) return 'Unknown Status';
    
    switch (prescription.status) {
      case PrescriptionStatus.ACTIVE:
        return 'Active Prescription';
      case PrescriptionStatus.FULFILLED:
        return 'Prescription Fulfilled';
      case PrescriptionStatus.REFILL_REQUESTED:
        return 'Refill Requested';
      case PrescriptionStatus.REFILL_APPROVED:
        return 'Refill Approved';
      case PrescriptionStatus.EXPIRED:
        return 'Prescription Expired';
      default:
        return 'Unknown Status';
    }
  };

  // Get pharmacy information from the first medicine
  const getPharmacyInfo = () => {
    if (!prescription?.medications.length) return null;
    
    const firstMedicine = getMedicineWithPharmacy(prescription.medications[0].medicineId);
    return firstMedicine?.addedBy || null;
  };

  // Check if refill can be requested
  const canRequestRefill = () => {
    if (!prescription) return false;
    
    return prescription.canBeRefilled && 
           prescription.status !== PrescriptionStatus.REFILL_REQUESTED &&
           prescription.status !== PrescriptionStatus.EXPIRED;
  };

  // Handle request refill confirmation
  const handleRequestRefillConfirm = async () => {
    if (!prescription) return;
    
    setIsRequesting(true);
    try {
      await requestRefillMutation.mutateAsync({
        id: prescription.id,
        requestData: { notes: refillNotes }
      });
      
      toast.success('Refill request submitted successfully!');
      setShowRefillDialog(false);
      setRefillNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit refill request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle request refill button click
  const handleRequestRefill = () => {
    if (!canRequestRefill()) {
      toast.error('This prescription cannot be refilled at this time.');
      return;
    }
    setShowRefillDialog(true);
  };

  // Add download function
  const handleDownloadPDF = async () => {
    if (!prescription) return;
    
    setIsDownloading(true);
    try {
      const doc = generatePrescriptionPDF(prescription, medicines);
      doc.save(`Prescription_${prescription.id}.pdf`);
      toast.success("Prescription PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download prescription. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8491D9]"></div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Prescription not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The prescription you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button 
            onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
            className="bg-[#8491D9] hover:bg-[#7380C8]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Prescriptions
          </Button>
        </div>
      </div>
    );
  }

  const pharmacyInfo = getPharmacyInfo();
  const status = getPrescriptionStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-[#8491D9] rounded-lg p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleDownloadPDF}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 ml-auto"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{prescription.name}</h1>
                <p className="text-white/90 text-sm">
                  {status} • Valid until {formatShortDate(prescription.validityDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(prescription.status)}
              {prescription.status === PrescriptionStatus.REFILL_REQUESTED && prescription.refillRequestedAt && (
                <p className="text-white/80 text-xs">
                  Requested on {formatShortDate(prescription.refillRequestedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prescribed Medications */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Prescribed Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescription.medications.map((medication, idx) => {
                    const medicine = getMedicineWithPharmacy(medication.medicineId);
                    return (
                      <div key={idx} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-[#010626] dark:text-white text-lg">
                              {medicine?.name || 'Unknown Medicine'}
                            </h3>
                            {medicine && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-[#8491D9] text-white text-xs">
                                  {medicine.dosage}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {medicine.manufacturer}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {medication.quantity || 'N/A'} tablets
                            </p>
                            {prescription.refillsAllowed > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {prescription.refillsAllowed - prescription.refillsUsed} refills remaining
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions:</h4>
                          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Take {medication.dosage} {medication.frequency}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Duration: {medication.duration}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span>Follow prescribed dosage exactly</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Refill Request Information */}
            {prescription.status === PrescriptionStatus.REFILL_REQUESTED && prescription.refillRequestNotes && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Refill Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                    Your refill request is pending doctor approval.
                  </p>
                  {prescription.refillRequestNotes && (
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Your notes:</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 italic">
                        "{prescription.refillRequestNotes}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Prescribing Physician */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Prescribing Physician
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8491D9] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#010626] dark:text-white">
                      Dr. {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}, MD
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {prescription.prescribedBy.specialization}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">4.9/5</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Prescribed on</p>
                    <p className="font-medium text-[#010626] dark:text-white">
                      {formatShortDate(prescription.date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pharmacy Information */}
            {pharmacyInfo && (
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Pharmacy Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {pharmacyInfo.pharmacyName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#010626] dark:text-white">
                          {pharmacyInfo.pharmacyName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          License: {pharmacyInfo.licenseNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {pharmacyInfo.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Prescription
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleRequestRefill}
                  disabled={!canRequestRefill() || isRequesting}
                  className={`w-full mb-3 ${
                    canRequestRefill() 
                      ? 'bg-[#8491D9] hover:bg-[#7380C8] text-white' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isRequesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Request Refill
                    </>
                  )}
                </Button>

                {!canRequestRefill() && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {prescription.status === PrescriptionStatus.REFILL_REQUESTED 
                      ? 'Refill request already pending'
                      : prescription.status === PrescriptionStatus.EXPIRED
                      ? 'Prescription has expired'
                      : prescription.refillsUsed >= prescription.refillsAllowed
                      ? 'No refills remaining'
                      : 'Refill not available'
                    }
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Refill Information */}
            {prescription.refillsAllowed > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Refill Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Refills Allowed:</span>
                    <p className="text-gray-600 dark:text-gray-400">{prescription.refillsAllowed}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Refills Used:</span>
                    <p className="text-gray-600 dark:text-gray-400">{prescription.refillsUsed}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Remaining Refills:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {prescription.refillsAllowed - prescription.refillsUsed}
                    </p>
                  </div>

                  {prescription.lastRefillDate && (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Last Refill:</span>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(prescription.lastRefillDate)}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Important Reminders */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Important Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      • Take medications as prescribed, even if you feel better
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      • Contact your doctor if you experience any unusual symptoms
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      • Keep medications in a cool, dry place away from children
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      • Do not share medications with others
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Info */}
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Prescription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Prescription Name:</span>
                  <p className="text-gray-600 dark:text-gray-400">{prescription.name}</p>
                </div>
                
                <Separator />
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Date Issued:</span>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(prescription.date)}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Medications:</span>
                  <p className="text-gray-600 dark:text-gray-400">{prescription.medications.length}</p>
                </div>
                
                <Separator />
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Patient:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order History */}
            {prescription.orders && prescription.orders.length > 0 && (
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prescription.orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                        <div>
                          <Badge className={`text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                            order.status === 'ready' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatShortDate(order.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Refill Request Dialog */}
      <Dialog open={showRefillDialog} onOpenChange={setShowRefillDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Prescription Refill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to request a refill for "{prescription.name}"? 
              Your doctor will review this request and notify you of their decision.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <Textarea
                value={refillNotes}
                onChange={(e) => setRefillNotes(e.target.value)}
                placeholder="Any additional information for your doctor..."
                className="w-full"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Remaining refills:</strong> {prescription.refillsAllowed - prescription.refillsUsed}
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRefillDialog(false)}
              disabled={isRequesting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRefillConfirm}
              disabled={isRequesting}
              className="bg-[#8491D9] hover:bg-[#7380C8]"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Requesting...
                </>
              ) : (
                'Request Refill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}