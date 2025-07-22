import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { 
    useMedicines, 
    useCreatePharmacyOrder, 
    useConfirmOrder, 
    useUpdateMedicine 
} from '@/hooks/usePharmacy';
import { useInitializePayment, useVerifyPayment } from '@/hooks/usePayments';
import { useCurrentUser } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, FileText, Search, PlusCircle, CreditCard } from 'lucide-react';
import { OrderStatus } from '@/api/pharmacy-order';
import { useQueryClient } from '@tanstack/react-query';
import type { Medicine } from '@/api/pharmacy';

// Paystack payment modal
function PaystackPaymentModal({
    open,
    amount,
    onSuccess,
    onCancel,
    authorizationUrl,
    reference
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
            console.log('Payment verification:', verification);

            if (verification.status === 'success') {
                onSuccess();
                toast.success('Payment verified successfully!');
            } else {
                toast.error('Payment verification failed');
            }
        } catch (error) {
            console.error('Payment verification failed:', error);
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

        // Open Paystack payment page in new window
        const paymentWindow = window.open(
            authorizationUrl,
            '_blank',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!paymentWindow) {
            toast.error('Please allow popups to complete payment');
            return;
        }

        // Listen for payment completion
        const checkClosed = setInterval(() => {
            if (paymentWindow?.closed) {
                clearInterval(checkClosed);
                // Give user a moment to complete the payment before verifying
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

export default function NewOrder() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: prescriptions = [], isLoading, error } = usePrescriptions();
    const { data: medicines = [] } = useMedicines();
    const { data: currentUser } = useCurrentUser();
    const createOrder = useCreatePharmacyOrder();
    const initializePayment = useInitializePayment();
    const confirmOrder = useConfirmOrder();
    const updateMedicine = useUpdateMedicine();

    const [search, setSearch] = useState('');
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<{
        authorizationUrl: string;
        reference: string;
    } | null>(null);

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

    // Function to update medicine stock in both frontend and backend
    const updateMedicineStock = async (prescriptionId: string) => {
        const prescription = prescriptions.find(p => p.id === prescriptionId);
        if (!prescription) {
            console.warn('Prescription not found for stock update', prescriptionId);
            return;
        }

        console.log('Updating stock for prescription:', prescription.name);

        // Update medicines cache with reduced stock
        queryClient.setQueryData(['medicines'], (oldMedicines: Medicine[] | undefined) => {
            if (!oldMedicines || !Array.isArray(oldMedicines)) {
                console.warn('No medicines found in cache or invalid data');
                return oldMedicines;
            }

            console.log('Original medicines in cache:', oldMedicines.length);
            
            const updatedMedicines = oldMedicines.map((medicine) => {
                const prescriptionMed = prescription.medications.find(
                    med => med.medicineId === medicine.id
                );
                
                if (prescriptionMed && prescriptionMed.quantity) {
                    console.log(
                        `Updating medicine ${medicine.name} stock: ${medicine.stock} - ${prescriptionMed.quantity} = ${Math.max(0, medicine.stock - prescriptionMed.quantity)}`
                    );
                    
                    return {
                        ...medicine,
                        stock: Math.max(0, medicine.stock - prescriptionMed.quantity)
                    };
                }
                
                return medicine;
            });
            
            console.log('Updated medicines cache');
            return updatedMedicines;
        });

        // Also update the backend database for each medicine
        try {
            const medicationUpdates = prescription.medications.map(async (med) => {
                const medicine = medicines.find(m => m.id === med.medicineId);
                if (medicine && medicine.stock && med.quantity) {
                    const newStock = Math.max(0, medicine.stock - med.quantity);
                    console.log(`Updating medicine ${medicine.name} in backend: ${medicine.stock} -> ${newStock}`);
                    
                    return updateMedicine.mutateAsync({
                        id: medicine.id,
                        data: { stock: newStock }
                    });
                }
            });
            
            await Promise.all(medicationUpdates.filter(Boolean));
            console.log('Backend medicine stock updates completed');
        } catch (error) {
            console.error('Error updating medicine stock in backend:', error);
            toast.error('Failed to update medicine stock in database');
        }
    };

    // Handle order creation and payment initialization
    const handleCreateOrder = async () => {
        if (!selectedPrescriptionId || !currentUser) {
            toast.error('Please select a prescription to order.');
            return;
        }
        if (!totalAmount || totalAmount <= 0) {
            toast.error('Unable to calculate total amount. Please check prescription medicines and quantities.');
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Create the order
            const order = await createOrder.mutateAsync({
                prescriptionId: selectedPrescriptionId,
                totalAmount: Number(totalAmount),
                status: OrderStatus.PENDING
            });
            setPendingOrderId(order.id);

            // Step 2: Initialize payment
            const paymentResponse = await initializePayment.mutateAsync({
                fullName: `${currentUser.profile?.user?.firstName} ${currentUser.profile?.user?.lastName}`,
                email: currentUser.profile?.user?.email ?? '',
                phoneNumber: currentUser.profile?.user?.phoneNumber || '',
                amount: totalAmount,
                type: 'pharmacy_order',
                pharmacyOrderId: order.id,
                notes: `Payment for pharmacy order ${order.id}`
            });

            // Step 3: Show payment modal with Paystack URL
            setPaymentData({
                authorizationUrl: paymentResponse.paystack_data.authorization_url,
                reference: paymentResponse.paystack_data.reference
            });
            setShowPaymentModal(true);

            // Step 4: Confirm the order status after payment initialization
            await confirmOrder.mutateAsync(order.id);

        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle successful payment
    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        setPaymentData(null);
        
        // Update medicine stock quantities in frontend and backend
        if (selectedPrescriptionId) {
            await updateMedicineStock(selectedPrescriptionId);
        }
        
        toast.success('Payment successful!');

        if (pendingOrderId) {
            navigate({ to: `/dashboard/patient/orders/${pendingOrderId}` });
        }
    };

    // Handle payment cancellation
    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setPaymentData(null);
        setPendingOrderId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#010626] transition-colors">
            <PaystackPaymentModal
                open={showPaymentModal}
                amount={totalAmount}
                authorizationUrl={paymentData?.authorizationUrl}
                reference={paymentData?.reference}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
            />

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
                                className={`transition border-2 cursor-pointer ${selectedPrescriptionId === prescription.id
                                    ? 'border-[#8491D9] ring-2 ring-[#8491D9]'
                                    : 'border-transparent'
                                    } hover:border-[#8491D9]`}
                                onClick={() => setSelectedPrescriptionId(prescription.id)}
                            >
                                <CardContent className="flex items-center gap-4 py-4">
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
                        className="mr-4 bg-gray-200 hover:bg-gray-300 text-[#021373] dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-[#8491D9] px-8 py-3 text-lg font-semibold rounded-lg flex items-center gap-2"
                        disabled={!selectedPrescriptionId || submitting}
                        variant="outline"
                        onClick={async () => {
                            if (!selectedPrescriptionId || !currentUser) {
                                toast.error('Please select a prescription to order.');
                                return;
                            }
                            if (!totalAmount || totalAmount <= 0) {
                                toast.error('Unable to calculate total amount. Please check prescription medicines and quantities.');
                                return;
                            }
                            setSubmitting(true);
                            try {
                                const order = await createOrder.mutateAsync({
                                    prescriptionId: selectedPrescriptionId,
                                    totalAmount: Number(totalAmount),
                                    status: OrderStatus.PENDING
                                });
                                
                                // Confirm the order
                                await confirmOrder.mutateAsync(order.id);
                                
                                // Update medicine stock quantities in frontend and backend
                                await updateMedicineStock(selectedPrescriptionId);
                                
                                toast.success('Order created successfully!');
                                navigate({ to: `/dashboard/patient/orders/${order.id}` });
                            } catch (error: any) {
                                toast.error(error?.response?.data?.message || 'Failed to create order');
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-5 h-5 mr-2" />
                                Create Order Only
                            </>
                        )}
                    </Button>
                    <Button
                        className="bg-[#021373] hover:bg-[#8491D9] text-white px-8 py-3 text-lg font-semibold rounded-lg flex items-center gap-2"
                        disabled={!selectedPrescriptionId || submitting}
                        onClick={handleCreateOrder}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Create & Pay
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}