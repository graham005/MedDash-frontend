import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  medicineApi,
  pharmacyOrderApi,
  type UpdateMedicineDto,
  type UpdatePharmacyOrderDto
} from '@/api/pharmacy';

export const usePharmacy = () => {
  const queryClient = useQueryClient();

  // Medicine queries
  const {
    data: medicines,
    isLoading: isLoadingMedicines,
    error: medicinesError,
  } = useQuery({
    queryKey: ['medicines'],
    queryFn: medicineApi.getAllMedicines,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Pharmacy orders queries
  const {
    data: pharmacyOrders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: ['pharmacy-orders'],
    queryFn: pharmacyOrderApi.getAllPharmacyOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Medicine mutations
  const createMedicineMutation = useMutation({
    mutationFn: medicineApi.createMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicineDto }) =>
      medicineApi.updateMedicine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: medicineApi.deleteMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });

  // Pharmacy order mutations
  const createPharmacyOrderMutation = useMutation({
    mutationFn: pharmacyOrderApi.createPharmacyOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  const updatePharmacyOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePharmacyOrderDto }) =>
      pharmacyOrderApi.updatePharmacyOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  const cancelPharmacyOrderMutation = useMutation({
    mutationFn: pharmacyOrderApi.cancelPharmacyOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  // Order status update mutations
  const confirmOrderMutation = useMutation({
    mutationFn: pharmacyOrderApi.confirmOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: pharmacyOrderApi.startProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: pharmacyOrderApi.markReady,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: pharmacyOrderApi.completeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });

  // Get single medicine
  const useMedicineById = (id: string) => {
    return useQuery({
      queryKey: ['medicines', id],
      queryFn: () => medicineApi.getMedicineById(id),
      enabled: !!id,
    });
  };

  // Get single pharmacy order
  const usePharmacyOrderById = (id: string) => {
    return useQuery({
      queryKey: ['pharmacy-orders', id],
      queryFn: () => pharmacyOrderApi.getPharmacyOrderById(id),
      enabled: !!id,
    });
  };

  return {
    // Data
    medicines,
    pharmacyOrders,
    
    // Loading states
    isLoadingMedicines,
    isLoadingOrders,
    
    // Errors
    medicinesError,
    ordersError,
    
    // Medicine mutations
    createMedicine: createMedicineMutation.mutate,
    updateMedicine: updateMedicineMutation.mutate,
    deleteMedicine: deleteMedicineMutation.mutate,
    
    // Pharmacy order mutations
    createPharmacyOrder: createPharmacyOrderMutation.mutate,
    updatePharmacyOrder: updatePharmacyOrderMutation.mutate,
    cancelPharmacyOrder: cancelPharmacyOrderMutation.mutate,
    
    // Order status mutations
    confirmOrder: confirmOrderMutation.mutate,
    startProcessing: startProcessingMutation.mutate,
    markReady: markReadyMutation.mutate,
    completeOrder: completeOrderMutation.mutate,
    
    // Mutation states
    isCreatingMedicine: createMedicineMutation.isPending,
    isUpdatingMedicine: updateMedicineMutation.isPending,
    isDeletingMedicine: deleteMedicineMutation.isPending,
    isCreatingOrder: createPharmacyOrderMutation.isPending,
    isUpdatingOrder: updatePharmacyOrderMutation.isPending,
    isCancellingOrder: cancelPharmacyOrderMutation.isPending,
    
    // Mutation errors
    createMedicineError: createMedicineMutation.error,
    updateMedicineError: updateMedicineMutation.error,
    deleteMedicineError: deleteMedicineMutation.error,
    createOrderError: createPharmacyOrderMutation.error,
    updateOrderError: updatePharmacyOrderMutation.error,
    cancelOrderError: cancelPharmacyOrderMutation.error,
    
    // Utilities
    useMedicineById,
    usePharmacyOrderById,
  };
};