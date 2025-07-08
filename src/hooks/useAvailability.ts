import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  availabilityApi,
  type UpdateAvailabilityDto
} from '@/api/availability';

// Get doctor availability slots
export function useDoctorAvailabilitySlots() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: availabilityApi.getDoctorAvailabilitySlots,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get all availability slots
export function useAllAvailabilitySlots() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: () => availabilityApi.getAllAvailabilitySlots(),
  });
}

// Get available slots for a doctor
export function useAvailableSlotsForDoctor(doctorId: string) {
  return useQuery({
    queryKey: ['availability', 'doctor', doctorId],
    queryFn: () => availabilityApi.getAvailableSlotsForDoctor(doctorId),
    enabled: !!doctorId,
  });
}

// Get available slots by date range
export function useAvailableSlotsByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['availability', 'range', startDate, endDate],
    queryFn: () => availabilityApi.getAvailableSlotsByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Create availability slot mutation
export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: availabilityApi.createAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Update availability slot mutation
export function useUpdateAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAvailabilityDto }) =>
      availabilityApi.updateAvailabilitySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Delete availability slot mutation
export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: availabilityApi.deleteAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}