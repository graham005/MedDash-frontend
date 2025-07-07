import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  prescriptionApi,
  type UpdatePrescriptionDto
} from '@/api/prescription';

export const usePrescriptions = () => {
  const queryClient = useQueryClient();

  // Get all prescriptions
  const {
    data: prescriptions,
    isLoading: isLoadingPrescriptions,
    error: prescriptionsError,
  } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionApi.getAllPrescriptions,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Create prescription mutation
  const createPrescriptionMutation = useMutation({
    mutationFn: prescriptionApi.createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  // Update prescription mutation
  const updatePrescriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrescriptionDto }) =>
      prescriptionApi.updatePrescription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  // Delete prescription mutation
  const deletePrescriptionMutation = useMutation({
    mutationFn: prescriptionApi.deletePrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  // Get single prescription
  const usePrescriptionById = (id: string) => {
    return useQuery({
      queryKey: ['prescriptions', id],
      queryFn: () => prescriptionApi.getPrescriptionById(id),
      enabled: !!id,
    });
  };

  return {
    // Data
    prescriptions,
    
    // Loading states
    isLoadingPrescriptions,
    
    // Errors
    prescriptionsError,
    
    // Mutations
    createPrescription: createPrescriptionMutation.mutate,
    updatePrescription: updatePrescriptionMutation.mutate,
    deletePrescription: deletePrescriptionMutation.mutate,
    
    // Mutation states
    isCreatingPrescription: createPrescriptionMutation.isPending,
    isUpdatingPrescription: updatePrescriptionMutation.isPending,
    isDeletingPrescription: deletePrescriptionMutation.isPending,
    
    // Mutation errors
    createPrescriptionError: createPrescriptionMutation.error,
    updatePrescriptionError: updatePrescriptionMutation.error,
    deletePrescriptionError: deletePrescriptionMutation.error,
    
    // Utilities
    usePrescriptionById,
  };
};