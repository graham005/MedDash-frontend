import { useParams, useNavigate } from '@tanstack/react-router';
import {
  usePharmacyOrderById,
  useConfirmOrder,
  useStartProcessingOrder,
  useMarkReadyOrder,
  useCompleteOrder,
  useCancelPharmacyOrder,
} from '@/hooks/usePharmacy';
import { OrderStatus } from '@/api/pharmacy-order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, PackageCheck, Truck } from 'lucide-react';
import { useMedicines } from '@/hooks/usePharmacy';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.READY]: 'Ready',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-[#8491D9] text-[#010626]',
  [OrderStatus.CONFIRMED]: 'bg-[#021373] text-white',
  [OrderStatus.PROCESSING]: 'bg-[#020F59] text-white',
  [OrderStatus.READY]: 'bg-green-600 text-white',
  [OrderStatus.COMPLETED]: 'bg-[#010626] text-white',
  [OrderStatus.CANCELLED]: 'bg-red-600 text-white',
};

const statusActions: Partial<Record<OrderStatus, Array<{ label: string; action: string; icon: any; color: string }>>> = {
  [OrderStatus.PENDING]: [
    { label: 'Confirm', action: 'confirm', icon: CheckCircle, color: 'bg-[#021373] text-white' },
    { label: 'Cancel', action: 'cancel', icon: XCircle, color: 'bg-red-600 text-white' },
  ],
  [OrderStatus.CONFIRMED]: [
    { label: 'Start Processing', action: 'process', icon: Clock, color: 'bg-[#020F59] text-white' },
    { label: 'Cancel', action: 'cancel', icon: XCircle, color: 'bg-red-600 text-white' },
  ],
  [OrderStatus.PROCESSING]: [
    { label: 'Mark Ready', action: 'ready', icon: PackageCheck, color: 'bg-green-600 text-white' },
    { label: 'Cancel', action: 'cancel', icon: XCircle, color: 'bg-red-600 text-white' },
  ],
  [OrderStatus.READY]: [
    { label: 'Complete', action: 'complete', icon: Truck, color: 'bg-[#010626] text-white' },
    { label: 'Cancel', action: 'cancel', icon: XCircle, color: 'bg-red-600 text-white' },
  ],
};

type OrderDetailsProps = {
  orderId: string;
};

export default function OrderDetails({ orderId: propOrderId }: OrderDetailsProps) {
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = propOrderId ?? params.orderId;
  const navigate = useNavigate();
  const { data: order, isLoading, error, refetch } = usePharmacyOrderById(orderId);

  const confirmOrder = useConfirmOrder();
  const startProcessing = useStartProcessingOrder();
  const markReady = useMarkReadyOrder();
  const completeOrder = useCompleteOrder();
  const cancelOrder = useCancelPharmacyOrder();
  const { data: medicines = [] } = useMedicines();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create a map for quick lookup
  const medicineMap = medicines.reduce((acc, med) => {
    acc[med.id] = med.name;
    return acc;
  }, {} as Record<string, string>);

  const handleStatusChange = async (action: string) => {
    setActionLoading(action);
    try {
      if (!order) return;
      if (action === 'confirm') {
        await confirmOrder.mutateAsync(order.id);
        toast.success('Order confirmed!');
      } else if (action === 'process') {
        await startProcessing.mutateAsync(order.id);
        toast.success('Order processing started!');
      } else if (action === 'ready') {
        await markReady.mutateAsync(order.id);
        toast.success('Order marked as ready!');
      } else if (action === 'complete') {
        await completeOrder.mutateAsync(order.id);
        toast.success('Order completed!');
      } else if (action === 'cancel') {
        await cancelOrder.mutateAsync(order.id);
        toast.success('Order cancelled!');
      }
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-[#021373] dark:text-[#8491D9] flex items-center gap-2"
          onClick={() => navigate({ to: '/dashboard/pharmacist/orders' })}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#8491D9]" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            Failed to load order details.
          </div>
        ) : !order ? (
          <div className="text-center text-gray-200 dark:text-gray-400 py-8">
            Order not found.
          </div>
        ) : (
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
            <CardContent className="p-6">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#021373] dark:text-white mb-1">
                    Pharmacy Order Details
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    Ksh {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Prescription Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#021373] dark:text-white mb-2">Prescription</h3>
                <div className="bg-[#8491D9]/10 dark:bg-[#8491D9]/20 rounded-lg p-4">
                  <div className="font-bold text-[#021373] dark:text-white">
                    {order.prescription?.name ?? <span className="text-red-500">Prescription missing</span>}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Prescribed by:{' '}
                    {order.prescription?.prescribedBy?.user
                      ? `Dr. ${order.prescription.prescribedBy.user.firstName} ${order.prescription.prescribedBy.user.lastName}`
                      : <span className="text-red-500">Doctor info missing</span>
                    }
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Date: {order.prescription?.date ? formatDate(order.prescription.date) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#021373] dark:text-white mb-2">Patient</h3>
                <div className="bg-[#8491D9]/10 dark:bg-[#8491D9]/20 rounded-lg p-4">
                  {order.prescription?.patient?.user
                    ? (
                      <>
                        <div className="font-bold text-[#021373] dark:text-white">
                          {order.prescription.patient.user.firstName} {order.prescription.patient.user.lastName}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {order.prescription.patient.user.email}
                        </div>
                      </>
                    )
                    : <span className="text-red-500">Patient info missing</span>
                  }
                </div>
              </div>

              {/* Medications */}
              <div className="mb-8">
                <h3 className="font-semibold text-[#021373] dark:text-[#8491D9] mb-2">Medications</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#8491D9] dark:divide-[#8491D9]">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Medicine Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Dosage</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Frequency</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.prescription?.medications?.length ? (
                        order.prescription.medications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-[#8491D9]/10 dark:hover:bg-[#8491D9]/20">
                            <td className="px-4 py-2 font-mono text-xs">
                              {medicineMap[med.medicineId] || med.medicineId}
                            </td>
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

              {/* Status Actions */}
              {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                <div className="flex flex-wrap gap-3 justify-end">
                  {statusActions[order.status]?.map(({ label, action, icon: Icon, color }) => (
                    <Button
                      key={action}
                      className={`${color} flex items-center gap-2`}
                      disabled={actionLoading !== null}
                      onClick={() => handleStatusChange(action)}
                    >
                      {actionLoading === action ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}