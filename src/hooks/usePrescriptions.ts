import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  prescriptionApi,
  type CreatePrescriptionDto,
  type UpdatePrescriptionDto,
  type RequestRefillDto,
  type ApproveRefillDto
} from '@/api/prescription';

// Get all prescriptions
export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionApi.getAllPrescriptions,
    staleTime: 5 * 60 * 1000,
  });
}

// Get orderable prescriptions (Patient only)
export function useOrderablePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions', 'orderable'],
    queryFn: prescriptionApi.getOrderablePrescriptions,
    staleTime: 2 * 60 * 1000,
  });
}

// Get refill requests (Doctor only)
export function useRefillRequests() {
  return useQuery({
    queryKey: ['prescriptions', 'refill-requests'],
    queryFn: prescriptionApi.getRefillRequests,
    staleTime: 1 * 60 * 1000,
  });
}

// Get prescription by ID
export function usePrescriptionById(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => prescriptionApi.getPrescriptionById(id),
    enabled: !!id,
  });
}

// Create prescription
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prescriptionApi.createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

// Request refill
export function useRequestRefill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requestData }: { id: string; requestData: RequestRefillDto }) =>
      prescriptionApi.requestRefill(id, requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

// Approve refill
export function useApproveRefill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvalData }: { id: string; approvalData: ApproveRefillDto }) =>
      prescriptionApi.approveRefill(id, approvalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'refill-requests'] });
    },
  });
}

// Deny refill
export function useDenyRefill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      prescriptionApi.denyRefill(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'refill-requests'] });
    },
  });
}

// Update prescription
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

// Delete prescription
export function useDeletePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: prescriptionApi.deletePrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}