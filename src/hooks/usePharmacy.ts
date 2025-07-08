import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  medicineApi,
  pharmacyOrderApi,
  type UpdateMedicineDto,
  type UpdatePharmacyOrderDto
} from '@/api/pharmacy';

// Medicines

export function useMedicines() {
  return useQuery({
    queryKey: ['medicines'],
    queryFn: medicineApi.getAllMedicines,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMedicineById(id: string) {
  return useQuery({
    queryKey: ['medicines', id],
    queryFn: () => medicineApi.getMedicineById(id),
    enabled: !!id,
  });
}

export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: medicineApi.createMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicineDto }) =>
      medicineApi.updateMedicine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export function useDeleteMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: medicineApi.deleteMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

// Pharmacy Orders

export function usePharmacyOrders() {
  return useQuery({
    queryKey: ['pharmacy-orders'],
    queryFn: pharmacyOrderApi.getAllPharmacyOrders,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePharmacyOrderById(id: string) {
  return useQuery({
    queryKey: ['pharmacy-orders', id],
    queryFn: () => pharmacyOrderApi.getPharmacyOrderById(id),
    enabled: !!id,
  });
}

export function useCreatePharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.createPharmacyOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

export function useUpdatePharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePharmacyOrderDto }) =>
      pharmacyOrderApi.updatePharmacyOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

export function useCancelPharmacyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.cancelPharmacyOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

// Order Status Mutations

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.confirmOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

export function useStartProcessingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.startProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

export function useMarkReadyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.markReady,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pharmacyOrderApi.completeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] });
    },
  });
}