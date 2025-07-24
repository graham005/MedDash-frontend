import { useParams, useNavigate } from '@tanstack/react-router';
import { usePrescriptionById } from '@/hooks/usePrescriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useMedicines } from '@/hooks/usePharmacy';

export default function PrescriptionDetails() {
  const params = useParams({ strict: false });
  const prescriptionId = params.prescriptionId as string;
  const { data: prescription, isLoading, error } = usePrescriptionById(prescriptionId);
  const { data: medicines = [] } = useMedicines();
  const navigate = useNavigate();

  // Helper to get medicine name by ID
  const getMedicineName = (medicineId: string) => {
    const medicine = medicines.find(med => med.id === medicineId);
    return medicine?.name || 'Unknown Medicine';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-md p-8">
          <CardContent className="text-center">
            <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Prescription not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The prescription you are looking for does not exist or could not be loaded.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard/doctor/prescriptions' })}
              className="mt-2"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Prescriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors px-2 py-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-300"
          onClick={() => navigate({ to: '/dashboard/doctor/prescriptions' })}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </Button>
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              {prescription.name}
            </CardTitle>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                Prescribed: {format(new Date(prescription.date), 'MMM d, yyyy')}
              </Badge>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                Valid Until: {format(new Date(prescription.validityDate), 'MMM d, yyyy')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Patient</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <span className="text-gray-700 dark:text-gray-300">
                  {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  DOB: {format(new Date(prescription.patient.dateOfBirth), 'MMM d, yyyy')}
                </span>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  Blood Type: {prescription.patient.bloodType}
                </Badge>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Prescribed By</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <span className="text-gray-700 dark:text-gray-300">
                  Dr. {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {prescription.prescribedBy.specialization}
                </span>
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  License: {prescription.prescribedBy.licenseNumber}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Medications</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                  <thead>
                    <tr className="text-left text-indigo-700 dark:text-indigo-200">
                      <th className="py-2 px-4">Medicine Name</th>
                      <th className="py-2 px-4">Dosage</th>
                      <th className="py-2 px-4">Frequency</th>
                      <th className="py-2 px-4">Duration</th>
                      <th className="py-2 px-4">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medications.map((med, idx) => (
                      <tr key={idx} className="border-t border-indigo-200 dark:border-indigo-800">
                        <td className="py-2 px-4 font-medium text-indigo-700 dark:text-indigo-200">
                          {getMedicineName(med.medicineId)}
                        </td>
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{med.dosage}</td>
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{med.frequency}</td>
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{med.duration}</td>
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{med.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {prescription.orders && prescription.orders.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Orders</h3>
                <div className="flex flex-col gap-2">
                  {prescription.orders.map(order => (
                    <Badge
                      key={order.id}
                      className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      Order #{order.id} - {order.status} ({format(new Date(order.createdAt), 'MMM d, yyyy')})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}