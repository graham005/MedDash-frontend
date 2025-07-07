import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  availabilityApi,
  type UpdateAvailabilityDto
} from '@/api/availability';

export const useAvailability = () => {
  const queryClient = useQueryClient();

  // Get doctor availability slots
  const {
    data: availabilitySlots,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useQuery({
    queryKey: ['availability'],
    queryFn: availabilityApi.getDoctorAvailabilitySlots,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create availability slot mutation
  const createAvailabilitySlotMutation = useMutation({
    mutationFn: availabilityApi.createAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  // Update availability slot mutation
  const updateAvailabilitySlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAvailabilityDto }) =>
      availabilityApi.updateAvailabilitySlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  // Delete availability slot mutation
  const deleteAvailabilitySlotMutation = useMutation({
    mutationFn: availabilityApi.deleteAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  // Get available slots for a doctor
  const useAvailableSlotsForDoctor = (doctorId: string) => {
    return useQuery({
      queryKey: ['availability', 'doctor', doctorId],
      queryFn: () => availabilityApi.getAvailableSlotsForDoctor(doctorId),
      enabled: !!doctorId,
    });
  };

  // Get available slots by date range
  const useAvailableSlotsByDateRange = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['availability', 'range', startDate, endDate],
      queryFn: () => availabilityApi.getAvailableSlotsByDateRange(startDate, endDate),
      enabled: !!startDate && !!endDate,
    });
  };

  return {
    // Data
    availabilitySlots,
    
    // Loading states
    isLoadingAvailability,
    
    // Errors
    availabilityError,
    
    // Mutations
    createAvailabilitySlot: createAvailabilitySlotMutation.mutate,
    updateAvailabilitySlot: updateAvailabilitySlotMutation.mutate,
    deleteAvailabilitySlot: deleteAvailabilitySlotMutation.mutate,
    
    // Mutation states
    isCreatingSlot: createAvailabilitySlotMutation.isPending,
    isUpdatingSlot: updateAvailabilitySlotMutation.isPending,
    isDeletingSlot: deleteAvailabilitySlotMutation.isPending,
    
    // Mutation errors
    createSlotError: createAvailabilitySlotMutation.error,
    updateSlotError: updateAvailabilitySlotMutation.error,
    deleteSlotError: deleteAvailabilitySlotMutation.error,
    
    // Utilities
    useAvailableSlotsForDoctor,
    useAvailableSlotsByDateRange,
  };
};