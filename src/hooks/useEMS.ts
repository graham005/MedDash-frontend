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

// Create EMS request with better error handling
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
      console.error('EMS Request Error:', error);
      
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message.includes('active EMS request')) {
        toast.error('You already have an active emergency request. Please wait for it to be completed before creating a new one.');
      } else {
        toast.error(error.message || 'Failed to create emergency request');
      }
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

// Enhanced assign paramedic hook
export function useAssignParamedic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, paramedicId }: { requestId: string; paramedicId: string }) =>
      emsAPI.assignParamedic(requestId, paramedicId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ems-request', data.id] });
      toast.success('Request accepted! En route to patient.');
    },
    onError: (error: any) => {
      console.error('Assign Paramedic Error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message.includes('already assigned')) {
        toast.error('This paramedic is already assigned to an active request.');
      } else {
        toast.error(error.message || 'Failed to accept request');
      }
    },
  });
}

// Enhanced assign paramedic hook with location support
export function useAssignParamedicWithLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      requestId, 
      paramedicId, 
      lat, 
      lng 
    }: { 
      requestId: string; 
      paramedicId: string; 
      lat: number; 
      lng: number; 
    }) =>
      emsAPI.assignParamedicWithLocation(requestId, paramedicId, lat, lng),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-ems-requests'] });
      queryClient.invalidateQueries({ queryKey: ['ems-request', data.id] });
      toast.success('Request accepted! Your location has been shared. En route to patient.');
    },
    onError: (error: any) => {
      console.error('Assign Paramedic With Location Error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message.includes('already assigned')) {
        toast.error('This paramedic is already assigned to an active request.');
      } else if (error.message.includes('location')) {
        toast.error('Failed to share location. Please check location permissions.');
      } else {
        toast.error(error.message || 'Failed to accept request with location');
      }
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