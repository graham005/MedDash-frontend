import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  appointmentsApi,
  type UpdateAppointmentDto
} from '@/api/appointments';

export const useAppointments = () => {
  const queryClient = useQueryClient();

  // Get patient appointments
  const {
    data: patientAppointments,
    isLoading: isLoadingPatientAppointments,
    error: patientAppointmentsError,
  } = useQuery({
    queryKey: ['appointments', 'patient'],
    queryFn: appointmentsApi.getPatientAppointments,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get doctor appointments
  const {
    data: doctorAppointments,
    isLoading: isLoadingDoctorAppointments,
    error: doctorAppointmentsError,
  } = useQuery({
    queryKey: ['appointments', 'doctor'],
    queryFn: appointmentsApi.getDoctorAppointments,
    staleTime: 2 * 60 * 1000,
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      appointmentsApi.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: appointmentsApi.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  // Get single appointment
  const useAppointmentById = (id: string) => {
    return useQuery({
      queryKey: ['appointments', id],
      queryFn: () => appointmentsApi.getPatientAppointmentById(id),
      enabled: !!id,
    });
  };

  // Get single doctor appointment
  const useDoctorAppointmentById = (id: string) => {
    return useQuery({
      queryKey: ['appointments', 'doctor', id],
      queryFn: () => appointmentsApi.getDoctorAppointmentById(id),
      enabled: !!id,
    });
  };

  return {
    // Data
    patientAppointments,
    doctorAppointments,
    
    // Loading states
    isLoadingPatientAppointments,
    isLoadingDoctorAppointments,
    
    // Errors
    patientAppointmentsError,
    doctorAppointmentsError,
    
    // Mutations
    createAppointment: createAppointmentMutation.mutate,
    updateAppointment: updateAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    
    // Mutation states
    isCreatingAppointment: createAppointmentMutation.isPending,
    isUpdatingAppointment: updateAppointmentMutation.isPending,
    isCancellingAppointment: cancelAppointmentMutation.isPending,
    
    // Mutation errors
    createAppointmentError: createAppointmentMutation.error,
    updateAppointmentError: updateAppointmentMutation.error,
    cancelAppointmentError: cancelAppointmentMutation.error,
    
    // Utilities
    useAppointmentById,
    useDoctorAppointmentById,
  };
};