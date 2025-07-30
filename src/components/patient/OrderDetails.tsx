import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { usePharmacyOrderById, useCancelPharmacyOrder, useConfirmOrder } from '@/hooks/usePharmacy';
import { useMedicines } from '@/hooks/usePharmacy';
import { useCurrentUser } from '@/hooks/useAuth';
import { useInitializePayment, usePayments, useVerifyPayment } from '@/hooks/usePayments';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function PaystackPaymentModal({
  open,
  amount,
  onSuccess,
  onCancel,
  authorizationUrl,
  reference,
}: {
  open: boolean;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  authorizationUrl?: string;
  reference?: string;
}) {
  const verifyPayment = useVerifyPayment();
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePaystackSuccess = async () => {
    if (!reference) {
      toast.error('Payment reference not found');
      return;
    }
    setIsVerifying(true);
    try {
      const verification = await verifyPayment.mutateAsync(reference);
      if (verification.status === 'success') {
        onSuccess();
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      toast.error('Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const openPaystackPage = () => {
    if (!authorizationUrl) {
      toast.error('Payment URL not available');
      return;
    }
    const paymentWindow = window.open(
      authorizationUrl,
      '_blank',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    if (!paymentWindow) {
      toast.error('Please allow popups to complete payment');
      return;
    }
    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
        clearInterval(checkClosed);
        setTimeout(() => {
          handlePaystackSuccess();
        }, 2000);
      }
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
        <CreditCard className="w-10 h-10 text-[#8491D9] mb-4" />
        <div className="text-lg font-bold mb-2 text-indigo-900 dark:text-white">Payment</div>
        <div className="mb-4 text-gray-700 dark:text-gray-300 text-center">
          Amount to pay: <span className="font-bold text-green-700 dark:text-green-400">
            Ksh.{amount.toLocaleString()}
          </span>
        </div>
        <Button
          className="w-full mb-2 bg-[#021373] hover:bg-[#8491D9] text-white"
          onClick={openPaystackPage}
          disabled={!authorizationUrl || isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Pay with Paystack'
          )}
        </Button>
        <Button className="w-full" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function PatientOrderDetails() {
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = params.orderId!;
  const navigate = useNavigate();
  const { data: order, isLoading, error, refetch } = usePharmacyOrderById(orderId);
  const cancelOrder = useCancelPharmacyOrder();
  const confirmOrder = useConfirmOrder();
  const { data: currentUser } = useCurrentUser();
  const initializePayment = useInitializePayment();
  const { data: medicines = [] } = useMedicines();
  const { data: payments = [] } = usePayments();

  const [actionLoading, setActionLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | undefined>();
  const [paystackRef, setPaystackRef] = useState<string | undefined>();
  const [isPaying, setIsPaying] = useState(false);

  // Map medicineId to name for display
  const medicineMap = medicines.reduce((acc, med) => {
    acc[med.id] = med.name;
    return acc;
  }, {} as Record<string, string>);

  // Find latest payment for this order (by pharmacyOrderId)
  const latestPayment = payments
    .filter((p) => p.type === 'pharmacy_order' && p.pharmacyOrder?.id === order?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Show Pay Now if order is pending and no successful payment
  const shouldShowPayNow =
    order?.status === 'pending' &&
    (!latestPayment || latestPayment.status !== 'success');

  // Payment handler
  const handlePayNow = async () => {
    if (!currentUser || !order) return;
    setIsPaying(true);
    try {
      const paymentData = {
        fullName: `${currentUser.profile?.user?.firstName} ${currentUser.profile?.user?.lastName}`,
        email: currentUser.profile?.user?.email ?? '',
        phoneNumber: currentUser.profile?.user?.phoneNumber ?? '',
        amount: order.totalAmount,
        type: 'pharmacy_order' as 'pharmacy_order',
        pharmacyOrderId: order.id,
      };
      const resp = await initializePayment.mutateAsync(paymentData);
      setPaystackUrl(resp.paystack_data.authorization_url);
      setPaystackRef(resp.paystack_data.reference);
      setPayModalOpen(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setIsPaying(false);
    }
  };

  // Confirm order after successful payment
  const handlePaymentSuccess = async () => {
    setPayModalOpen(false);
    try {
      await confirmOrder.mutateAsync(orderId);
      toast.success('Order payment successful! Status is now confirmed.');
      refetch();
    } catch (e: any) {
      toast.error('Payment succeeded but failed to confirm order.');
      refetch();
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelOrder.mutateAsync(orderId);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-600 dark:text-gray-300">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-red-600 dark:text-red-400">
        {error?.message || 'Order not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 px-2">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex flex-col gap-2">
              <span className="text-lg font-semibold">
                Pharmacy Order Details
              </span>
              <span className={`inline-block px-3 w-fit py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Info */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Order ID</div>
                <div className="font-mono text-xs text-gray-800 dark:text-gray-200">{order.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                <div className="text-xs text-gray-800 dark:text-gray-200">{format(new Date(order.createdAt), 'MMM d, yyyy')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-xs font-semibold text-green-700 dark:text-green-300">Ksh {order.totalAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Prescription Info */}
            <div>
              <div className="font-semibold text-[#021373] dark:text-[#8491D9] mb-1">Prescription</div>
              <div className="bg-[#8491D9]/10 dark:bg-[#8491D9]/20 rounded-lg p-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Name: <span className="font-medium">{order.prescription?.name}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Date: {order.prescription?.date ? format(new Date(order.prescription.date), 'MMM d, yyyy') : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Prescribed by: Dr. {order.prescription?.prescribedBy?.user?.firstName} {order.prescription?.prescribedBy?.user?.lastName}
                </div>
              </div>
            </div>

            {/* Medications */}
            <div>
              <div className="font-semibold text-[#021373] dark:text-[#8491D9] mb-1">Medications</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#8491D9] dark:divide-[#8491D9] text-xs">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold uppercase">Medicine Name</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase">Dosage</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase">Frequency</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.prescription?.medications?.length ? (
                      order.prescription.medications.map((med, idx) => (
                        <tr key={idx} className="hover:bg-[#8491D9]/10 dark:hover:bg-[#8491D9]/20">
                          <td className="px-4 py-2">{medicineMap[med.medicineId] || med.medicineId}</td>
                          <td className="px-4 py-2">{med.dosage}</td>
                          <td className="px-4 py-2">{med.frequency}</td>
                          <td className="px-4 py-2">{med.duration}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                          No medications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pay Now Button */}
            {shouldShowPayNow && (
              <div className="flex justify-end pt-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handlePayNow}
                  disabled={isPaying}
                >
                  {isPaying ? 'Initializing Payment...' : 'Pay Now'}
                </Button>
              </div>
            )}

            {/* Cancel Button */}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  <XCircleIcon className="w-5 h-5" />
                  {actionLoading ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => navigate({ to: '/dashboard/patient/orders' })}>
            Back to Orders
          </Button>
        </div>
      </div>
      {/* Paystack Modal */}
      <PaystackPaymentModal
        open={payModalOpen}
        amount={order.totalAmount}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setPayModalOpen(false)}
        authorizationUrl={paystackUrl}
        reference={paystackRef}
      />
    </div>
  );
}