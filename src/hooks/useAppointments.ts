import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelAppointment,
  createAppointment,
  getDoctorAppointmentById,
  getDoctorAppointments,
  getPatientAppointmentById,
  getPatientAppointments,
  updateAppointment,
  updateAppointmentStatus,
  type UpdateAppointmentDto
} from '@/api/appointments';

// Get patient appointments
export function usePatientAppointments() {
  return useQuery({
    queryKey: ['appointments', 'patient'],
    queryFn: getPatientAppointments,
    staleTime: 2 * 60 * 1000,
  });
}

// Get doctor appointments
export function useDoctorAppointments() {
  return useQuery({
    queryKey: ['appointments', 'doctor'],
    queryFn: getDoctorAppointments,
    staleTime: 2 * 60 * 1000,
  });
}

// Create appointment mutation
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Update appointment mutation
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Cancel appointment mutation
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Get single patient appointment by ID
export function useAppointmentById(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => getPatientAppointmentById(id),
    enabled: !!id,
  });
}

// Get single doctor appointment by ID
export function useDoctorAppointmentById(id: string) {
  return useQuery({
    queryKey: ['appointments', 'doctor', id],
    queryFn: () => getDoctorAppointmentById(id),
    enabled: !!id,
  });
}

// Update appointment status mutation
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'booked' | 'confirmed' | 'cancelled' | 'completed' }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}