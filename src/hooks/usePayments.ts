import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsAPI, type CreatePaymentDto } from '@/api/payments';
import { toast } from 'sonner';

// Hook to get all payments
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsAPI.getPayments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get payment by ID
export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsAPI.getPaymentById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to initialize payment
export function useInitializePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentData: CreatePaymentDto) => paymentsAPI.initializePayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment initialized successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to initialize payment');
    },
  });
}

// Hook to verify payment
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reference: string) => paymentsAPI.verifyPayment(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment verified successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Payment verification failed');
    },
  });
}

// Hook to cancel payment
export function useCancelPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => paymentsAPI.cancelPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment cancelled successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel payment');
    },
  });
}

// Hook to refund payment
export function useRefundPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => paymentsAPI.refundPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment refunded successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to refund payment');
    },
  });
}

// Hook to update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: Partial<CreatePaymentDto> }) => 
      paymentsAPI.updatePayment(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update payment');
    },
  });
}

// Hook to delete payment
export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => paymentsAPI.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payment');
    },
  });
}