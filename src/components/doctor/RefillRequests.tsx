import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Clock, 
  User, 
  Pill, 
  Check, 
  X, 
  FileText,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useRefillRequests, useApproveRefill, useDenyRefill } from '@/hooks/usePrescriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Prescription } from '@/api/prescription';

export default function RefillRequests() {
  const navigate = useNavigate();
  const { data: refillRequests = [], isLoading, error } = useRefillRequests();
  const approveRefillMutation = useApproveRefill();
  const denyRefillMutation = useDenyRefill();
  
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Prescription | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDenialModalOpen, setIsDenialModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [additionalRefills, setAdditionalRefills] = useState(0);
  const [denialReason, setDenialReason] = useState('');

  // Filter refill requests based on search
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return refillRequests;
    return refillRequests.filter(request =>
      request.name.toLowerCase().includes(search.toLowerCase()) ||
      request.patient.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      request.patient.user.lastName.toLowerCase().includes(search.toLowerCase())
    );
  }, [refillRequests, search]);

  const handleApproveRefill = async () => {
    if (!selectedRequest) return;

    try {
      await approveRefillMutation.mutateAsync({
        id: selectedRequest.id,
        approvalData: {
          additionalRefills: additionalRefills > 0 ? additionalRefills : undefined,
          notes: approvalNotes.trim() || undefined
        }
      });

      toast.success('Refill request approved successfully');
      setIsApprovalModalOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setAdditionalRefills(0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve refill request');
    }
  };

  const handleDenyRefill = async () => {
    if (!selectedRequest || !denialReason.trim()) return;

    try {
      await denyRefillMutation.mutateAsync({
        id: selectedRequest.id,
        reason: denialReason.trim()
      });

      toast.success('Refill request denied');
      setIsDenialModalOpen(false);
      setSelectedRequest(null);
      setDenialReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to deny refill request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Refill Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and manage prescription refill requests from your patients.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {filteredRequests.length} pending requests
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by patient name or prescription..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center text-red-500 py-20">
            Failed to load refill requests. Please try again.
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No refill requests
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {search ? 'No requests match your search.' : 'No pending refill requests at this time.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map(request => (
              <Card key={request.id} className="bg-white dark:bg-slate-800 border-0 shadow-md hover:shadow-lg transition">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.name}
                    </CardTitle>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.patient.user.firstName} {request.patient.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.patient.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(request.refillRequestedAt!)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Refills used:</span>
                      <span className="text-gray-900 dark:text-white">
                        {request.refillsUsed} / {request.refillsAllowed}
                      </span>
                    </div>
                    {request.refillRequestNotes && (
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Patient notes:</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          "{request.refillRequestNotes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Medications */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Medications ({request.medications.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {request.medications.slice(0, 3).map((med, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Pill className="w-3 h-3 mr-1" />
                          {med.dosage}
                        </Badge>
                      ))}
                      {request.medications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{request.medications.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsApprovalModalOpen(true);
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDenialModalOpen(true);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate({ to: `/dashboard/doctor/prescriptions/${request.id}` })}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approval Modal */}
        <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Approve Refill Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Approving refill for <strong>{selectedRequest?.name}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Refills (Optional)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={additionalRefills}
                  onChange={(e) => setAdditionalRefills(Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Grant additional refills beyond the current request
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Any additional instructions or notes for the patient..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsApprovalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApproveRefill}
                  disabled={approveRefillMutation.isPending}
                >
                  {approveRefillMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Approve Refill
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Denial Modal */}
        <Dialog open={isDenialModalOpen} onOpenChange={setIsDenialModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Deny Refill Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Denying refill for <strong>{selectedRequest?.name}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Denial <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="Please provide a clear reason for denying this refill request..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDenialModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDenyRefill}
                  disabled={!denialReason.trim() || denyRefillMutation.isPending}
                >
                  {denyRefillMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Deny Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}