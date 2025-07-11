import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useMedicines, useCreatePharmacyOrder } from '@/hooks/usePharmacy';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, FileText, Search, PlusCircle } from 'lucide-react';
import { OrderStatus } from '@/api/pharmacy-order';

export default function NewOrder() {
    const navigate = useNavigate();
    const { data: prescriptions = [], isLoading, error } = usePrescriptions();
    const { data: medicines = [] } = useMedicines();
    const createOrder = useCreatePharmacyOrder();

    const [search, setSearch] = useState('');
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Filter prescriptions by search
    const filteredPrescriptions = useMemo(() => {
        if (!search.trim()) return prescriptions;
        return prescriptions.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.prescribedBy.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
            p.prescribedBy.user.lastName.toLowerCase().includes(search.toLowerCase())
        );
    }, [prescriptions, search]);

    // Calculate totalAmount for the selected prescription
    const totalAmount = useMemo(() => {
        if (!selectedPrescriptionId) return 0;
        const prescription = prescriptions.find(p => p.id === selectedPrescriptionId);
        if (!prescription) return 0;
        let sum = 0;
        for (const med of prescription.medications) {
            const medicine = medicines.find(m => m.id === med.medicineId);
            if (medicine && medicine.price && med.quantity) {
                sum += medicine.price * med.quantity;
            }
        }
        return sum;
    }, [selectedPrescriptionId, prescriptions, medicines]);

    // Handle order creation
    const handleCreateOrder = async () => {
        if (!selectedPrescriptionId) {
            toast.error('Please select a prescription to order.');
            return;
        }
        if (!totalAmount || totalAmount <= 0) {
            toast.error('Unable to calculate total amount. Please check prescription medicines and quantities.');
            return;
        }
        setSubmitting(true);
        createOrder.mutate(
            { prescriptionId: selectedPrescriptionId, totalAmount: Number(totalAmount), status: OrderStatus.PENDING }, // <-- add status
            {
                onSuccess: (order) => {
                    toast.success('Order created successfully!');
                    navigate({ to: `/dashboard/patient/orders/${order.id}` });
                },
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to create order.');
                },
                onSettled: () => setSubmitting(false),
            }
        );
        console.log(createOrder)
        console.log({
            prescriptionId: selectedPrescriptionId,
            totalAmount,
            status: OrderStatus.PENDING,
            typeofTotalAmount: typeof totalAmount
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#010626] transition-colors">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#021373] dark:text-[#8491D9] flex items-center gap-2">
                        <PlusCircle className="w-6 h-6" />
                        New Pharmacy Order
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Select a prescription to send to the pharmacy for fulfillment.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search prescriptions by name or doctor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8491D9]"
                        />
                    </div>
                </div>

                {/* Prescription List */}
                <div className="space-y-4 mb-8">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#8491D9]" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">
                            Failed to load prescriptions.
                        </div>
                    ) : filteredPrescriptions.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No prescriptions found. Please visit your doctor to get a prescription.
                        </div>
                    ) : (
                        filteredPrescriptions.map(prescription => (
                            <Card
                                key={prescription.id}
                                className={`transition border-2 ${selectedPrescriptionId === prescription.id
                                        ? 'border-[#8491D9] ring-2 ring-[#8491D9]'
                                        : 'border-transparent'
                                    } hover:border-[#8491D9]`}
                                onClick={() => setSelectedPrescriptionId(prescription.id)}
                                tabIndex={0}
                                role="button"
                            >
                                <CardContent className="flex items-center gap-4 py-4 cursor-pointer">
                                    <div className="bg-[#8491D9] rounded-lg p-3">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-semibold text-[#021373] dark:text-[#8491D9]">
                                            {prescription.name}
                                        </h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Prescribed by Dr. {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(prescription.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <Button
                                            size="sm"
                                            variant={selectedPrescriptionId === prescription.id ? "default" : "outline"}
                                            className={selectedPrescriptionId === prescription.id
                                                ? "bg-[#8491D9] text-white"
                                                : "border-[#8491D9] text-[#8491D9]"}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedPrescriptionId(prescription.id);
                                            }}
                                        >
                                            {selectedPrescriptionId === prescription.id ? "Selected" : "Select"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Total Amount */}
                {selectedPrescriptionId && (
                    <div className="mb-6 flex justify-end">
                        <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-4 shadow text-right">
                            <span className="text-lg font-semibold text-[#021373] dark:text-[#8491D9]">
                                Total Amount:&nbsp;
                            </span>
                            <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                Ksh.{totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                    <Button
                        className="bg-[#021373] hover:bg-[#8491D9] text-white px-8 py-3 text-lg font-semibold rounded-lg"
                        disabled={!selectedPrescriptionId || submitting}
                        onClick={handleCreateOrder}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            <>Create Order</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}