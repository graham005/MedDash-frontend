import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Calendar, User, Pill, FileText, Eye, Filter } from 'lucide-react';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useMedicines } from '@/hooks/usePharmacy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Prescription } from '@/api/prescription';

export default function PatientPrescriptions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'doctor'>('date');

  // Fetch prescriptions and medicines
  const { data: prescriptions = [], isLoading, error } = usePrescriptions();
  const { data: medicines = [] } = useMedicines();

  // Helper function to get medicine name by ID
  const getMedicineName = (medicineId: string) => {
    const medicine = medicines.find(med => med.id === medicineId);
    return medicine?.name || 'Unknown Medicine';
  };
  console.log("this is the prescription data", prescriptions)

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get prescription status based on orders
  const getPrescriptionStatus = (prescription: Prescription) => {
    if (!prescription.orders || prescription.orders.length === 0) {
      return 'pending';
    }
    
    const latestOrder = prescription.orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    return latestOrder.status;
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'ready':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Filter and sort prescriptions
  const filteredAndSortedPrescriptions = useMemo(() => {
    let filtered = prescriptions.filter(prescription => {
      const searchMatch = 
        prescription.name.toLowerCase().includes(search.toLowerCase()) ||
        prescription.prescribedBy.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        prescription.prescribedBy.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        prescription.medications.some(med => 
          getMedicineName(med.medicineId).toLowerCase().includes(search.toLowerCase())
        );

      const statusMatch = statusFilter === 'all' || getPrescriptionStatus(prescription) === statusFilter;

      return searchMatch && statusMatch;
    });

    // Sort prescriptions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'doctor':
          const doctorA = `${a.prescribedBy.user.firstName} ${a.prescribedBy.user.lastName}`;
          const doctorB = `${b.prescribedBy.user.firstName} ${b.prescribedBy.user.lastName}`;
          return doctorA.localeCompare(doctorB);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [prescriptions, search, statusFilter, sortBy, medicines]);

  // Handle prescription view
  const handleViewPrescription = (prescriptionId: string) => {
    navigate({ to: `/dashboard/patient/prescriptions/${prescriptionId}` });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-[#021373] rounded-lg p-6 text-white mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Prescriptions</h1>
              <p className="text-white/90 mt-1">
                View and manage your medical prescriptions
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{prescriptions.length} Total</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search prescriptions, doctors, or medications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-[#8491D9] border-gray-300 dark:border-slate-600 dark:bg-slate-700"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="focus:ring-2 focus:ring-[#8491D9] border-gray-300 dark:border-slate-600 dark:bg-slate-700">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'doctor') => setSortBy(value)}>
                <SelectTrigger className="focus:ring-2 focus:ring-[#8491D9] border-gray-300 dark:border-slate-600 dark:bg-slate-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="name">Prescription Name</SelectItem>
                  <SelectItem value="doctor">Doctor Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8491D9]"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-20">
            Failed to load prescriptions. Please try again.
          </div>
        ) : filteredAndSortedPrescriptions.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No prescriptions found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'You have no prescriptions yet. Visit a doctor to get prescriptions.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredAndSortedPrescriptions.map(prescription => {
              const status = getPrescriptionStatus(prescription);
              return (
                <Card
                  key={prescription.id}
                  className="bg-white dark:bg-slate-800 border-0 shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
                        {prescription.name}
                      </CardTitle>
                      <Badge className={`text-xs font-medium ml-2 ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(prescription.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Dr. {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Medications */}
                    <div className="space-y-3 mb-4">
                      <h4 className="font-medium text-[#010626] dark:text-white flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Medications ({prescription.medications.length})
                      </h4>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <Button
                        onClick={() => handleViewPrescription(prescription.id)}
                        className="flex-1 bg-[#8491D9] hover:bg-[#7380C8] text-white"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && !error && filteredAndSortedPrescriptions.length > 0 && (
          <div className="text-center mt-8 text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedPrescriptions.length} of {prescriptions.length} prescriptions
          </div>
        )}
      </div>
    </div>
  );
}