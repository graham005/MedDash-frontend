import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prescriptionApi,
  type UpdatePrescriptionDto
} from '@/api/prescription';

// Get all prescriptions
export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionApi.getAllPrescriptions,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Get single prescription by ID
export function usePrescriptionById(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => prescriptionApi.getPrescriptionById(id),
    enabled: !!id,
  });
}

// Create prescription mutation
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prescriptionApi.createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

// Update prescription mutation
export function useUpdatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrescriptionDto }) =>
      prescriptionApi.updatePrescription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

// Delete prescription mutation
export function useDeletePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prescriptionApi.deletePrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}