import { useState, useMemo } from 'react';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useMedicines } from '@/hooks/usePharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon, PlusIcon, ClipboardDocumentListIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';

type ViewMode = 'cards' | 'table';

export default function DoctorPrescriptions() {
  const { data: prescriptions = [], isLoading, error } = usePrescriptions();
  const { data: medicines = [] } = useMedicines();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const navigate = useNavigate();

  // Helper function to get medicine name by ID
  const getMedicineName = (medicineId: string) => {
    const medicine = medicines.find(med => med.id === medicineId);
    return medicine?.name || 'Unknown Medicine';
  };

  const filtered = useMemo(() => {
    return prescriptions.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.patient.user.lastName.toLowerCase().includes(search.toLowerCase())
    );
  }, [prescriptions, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              My Prescriptions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              All prescriptions you have issued to patients.
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            onClick={() => navigate({ to: '/dashboard/doctor/prescriptions/new' })}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Prescription
          </Button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by patient or prescription name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            />
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              className={`flex items-center gap-1 ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'}`}
              onClick={() => setViewMode('cards')}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Cards
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'outline'}
              className={`flex items-center gap-1 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'}`}
              onClick={() => setViewMode('table')}
            >
              <TableCellsIcon className="w-4 h-4" />
              Table
            </Button>
          </div>
        </div>

        {/* Card View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {isLoading ? (
              <div className="col-span-2 flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="col-span-2 text-center text-red-500 py-20">Failed to load prescriptions.</div>
            ) : filtered.length === 0 ? (
              <Card className="bg-white dark:bg-slate-800 border-0 shadow-md col-span-2">
                <CardContent className="py-16 text-center">
                  <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No prescriptions found</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {search ? 'Try a different search.' : 'You have not issued any prescriptions yet.'}
                  </p>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    onClick={() => navigate({ to: '/dashboard/doctor/prescriptions/new' })}
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Prescription
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filtered.map(prescription => (
                <Card
                  key={prescription.id}
                  className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {prescription.name}
                      </CardTitle>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs">
                        {format(new Date(prescription.date), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Patient: <span className="font-medium">{prescription.patient.user.firstName} {prescription.patient.user.lastName}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge
                        className="bg-indigo-500/10 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs px-3 py-1 font-semibold"
                      >
                        {prescription.medications.length} medication{prescription.medications.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-indigo-200 dark:border-indigo-700 bg-indigo-600 text-white dark:text-indigo-200"
                      onClick={() => navigate({ to: `/dashboard/doctor/prescriptions/${prescription.id}` })}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && filtered.length > 0 && (
          <div className="overflow-x-auto shadow-md rounded-t-2xl">
            <table className="min-w-full bg-white dark:bg-slate-800 rounded shadow">
              <thead className='bg-indigo-600'>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-white dark:text-gray-200">Prescription Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-white dark:text-gray-200">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-white dark:text-gray-200">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-white dark:text-gray-200">Medications</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(prescription => (
                  <tr key={prescription.id} className="border-b dark:border-slate-700">
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{prescription.name}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {prescription.patient.user.firstName} {prescription.patient.user.lastName}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {format(new Date(prescription.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      {prescription.medications.map((med, idx) => (
                        <span key={idx}>
                          {getMedicineName(med.medicineId)}
                          {idx < prescription.medications.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200"
                        onClick={() => navigate({ to: `/dashboard/doctor/prescriptions/${prescription.id}` })}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}