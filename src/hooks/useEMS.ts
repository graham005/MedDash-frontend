import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Update the import path below to the correct location where emsAPI is exported.
// For example, if emsAPI is exported from '../api/emsAPI', use that path.
import { 
  type CreateEmsRequestDto,
  type UpdateLocationDto,
  type UpdateStatusDto,
} from '../types/types';
import { emsAPI } from '../api/ems';
import { toast } from 'sonner';

// Create EMS request
export function useCreateEMSRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestData: CreateEmsRequestDto) => emsAPI.createRequest(requestData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-ems-requests'] });
      toast.success('Emergency request created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create emergency request');
    },
  });
}

// Update paramedic location
export function useUpdateParamedicLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, locationData }: { requestId: string; locationData: UpdateLocationDto }) =>
      emsAPI.updateParamedicLocation(requestId, locationData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ems-request', data.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update location');
    },
  });
}

// Update EMS status
export function useUpdateEMSStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, statusData }: { requestId: string; statusData: UpdateStatusDto }) =>
      emsAPI.updateStatus(requestId, statusData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ems-request', data.id] });
      toast.success('Status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

// Assign paramedic
export function useAssignParamedic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, paramedicId }: { requestId: string; paramedicId: string }) =>
      emsAPI.assignParamedic(requestId, paramedicId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ems-request', data.id] });
      toast.success('Paramedic assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign paramedic');
    },
  });
}

// Get active EMS requests
export function useActiveEMSRequests() {
  return useQuery({
    queryKey: ['ems-requests', 'active'],
    queryFn: emsAPI.getActiveRequests,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000,
  });
}

// Get user's EMS requests
export function useMyEMSRequests() {
  return useQuery({
    queryKey: ['my-ems-requests'],
    queryFn: emsAPI.getMyRequests,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 10000,
  });
}

// Get EMS request by ID
export function useEMSRequest(requestId: string) {
  return useQuery({
    queryKey: ['ems-request', requestId],
    queryFn: () => emsAPI.getRequestById(requestId),
    enabled: !!requestId,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time tracking
    staleTime: 2000,
  });
}