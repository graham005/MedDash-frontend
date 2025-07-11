import { useParams, useNavigate } from '@tanstack/react-router';
import { usePharmacyOrderById, useCancelPharmacyOrder } from '@/hooks/usePharmacy';
import { useMedicines } from '@/hooks/usePharmacy';
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircleIcon } from '@heroicons/react/24/outline';

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

export default function PatientOrderDetails() {
  const params = useParams({ strict: false }) as { orderId?: string };
  const orderId = params.orderId!;
  const navigate = useNavigate();
  const { data: order, isLoading, error, refetch } = usePharmacyOrderById(orderId);
  const cancelOrder = useCancelPharmacyOrder();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: medicines = [] } = useMedicines();
  const medicineMap = medicines.reduce((acc, med) => {
    acc[med.id] = med.name;
    return acc;
  }, {} as Record<string, string>);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelOrder.mutateAsync(orderId);
      refetch();
    } catch (err) {
      // Optionally show error
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
    </div>
  );
}