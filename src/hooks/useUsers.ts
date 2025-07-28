import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userAPI, type User, type CreateUserDto, type UpdateUserDto } from '@/api/user';
import { toast } from 'sonner';
import { UserRole } from '@/types/enums';
import { apiClient } from '@/api/apiClient';

// Hook to get all users
export function useUsers(userRole?: UserRole) {
  return useQuery({
    queryKey: ['users', userRole],
    queryFn: () => userAPI.getAllUsers(userRole),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userAPI.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a new user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => userAPI.createUser(userData),
    onSuccess: (newUser) => {
      // Invalidate users queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${newUser.firstName} ${newUser.lastName} created successfully!`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user';
      toast.error(errorMessage);
    },
  });
}

// Hook to update a user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserDto }) => 
      userAPI.updateUser(id, userData),
    onSuccess: (updatedUser, { id }) => {
      // Update the user in cache
      queryClient.setQueryData(['user', id], updatedUser);
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${updatedUser.firstName} ${updatedUser.lastName} updated successfully!`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user';
      toast.error(errorMessage);
    },
  });
}

// Hook to delete a user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userAPI.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: ['user', deletedId] });
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      toast.error(errorMessage);
    },
  });
}

// Hook to get users by role with better naming
export function usePatients() {
  return useUsers(UserRole.PATIENT);
}

export function useDoctors() {
  return useUsers(UserRole.DOCTOR);
}

export function usePharmacists() {
  return useUsers(UserRole.PHARMACIST);
}

export function useAdmins() {
  return useUsers(UserRole.ADMIN);
}

// Hook to get all users with their profiles
export function useAllProfiles() {
  return useQuery({
    queryKey: ['users', 'profiles'],
    queryFn: () => userAPI.getAllProfiles(),
    staleTime: 5 * 60 * 1000,
  });
}

// Utility hook for user management operations
export function useUserOperations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiClient.post('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    createUser,
    updateUser,
    deleteUser,
  };
}