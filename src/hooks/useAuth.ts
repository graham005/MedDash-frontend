import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAuthToken,
  isAuthenticated,
  getUserRole,
  clearAuthTokens,
  getUserIdFromToken,
  createDoctorProfile,
  createPatientProfile,
  createPharmacistProfile,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  createAdminProfile,
  getProfile,
  signupUser,
} from '@/api/auth';
import { useTokenRefresh } from './useTokenRefresh';
import type { TDoctorProfile, TPatientProfile, TPharmacistProfile } from '@/types/types';

// Enhanced current user hook with token refresh
export function useCurrentUser() {
  const navigate = useNavigate();
  const { checkAndRefreshToken } = useTokenRefresh();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // Check and refresh token before making the request
      await checkAndRefreshToken();
      return getCurrentUser();
    },
    enabled: isAuthenticated() && !!getUserIdFromToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        clearAuthTokens();
        navigate({ to: '/login' });
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Token refresh mutation
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshAuthToken,
    onSuccess: (newToken) => {
      localStorage.setItem('accessToken', newToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error) => {
      console.error('Token refresh failed:', error);
      clearAuthTokens();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const userId = getUserIdFromToken(data.accessToken);
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.prefetchQuery({
          queryKey: ['currentUser'],
          queryFn: getCurrentUser,
          staleTime: 5 * 60 * 1000,
        });
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
      clearAuthTokens();
      navigate({ to: '/login' });
    },
  });
}

// Signup mutation
export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

// Create doctor profile mutation
export function useCreateDoctorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: TDoctorProfile) => createDoctorProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Create patient profile mutation
export function useCreatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: TPatientProfile) => createPatientProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Create pharmacist profile mutation
export function useCreatePharmacistProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: TPharmacistProfile) => createPharmacistProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Update password mutation
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      updatePassword(currentPassword, newPassword),
  });
}

// Request password reset mutation
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      resetPassword(token, newPassword),
  });
}

// Update patient profile mutation
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, profileData }: { id: string; profileData: any }) =>
      updateProfile('patient', id, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Update doctor profile mutation
export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, profileData }: { id: string; profileData: any }) =>
      updateProfile('doctor', id, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Update pharmacist profile mutation
export function useUpdatePharmacistProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, profileData }: { id: string; profileData: any }) =>
      updateProfile('pharmacist', id, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Create admin profile mutation
export function useCreateAdminProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: { department: string }) => createAdminProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Update admin profile mutation
export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, profileData }: { id: string; profileData: any }) =>
      updateProfile('admin', id, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// Profile query
export function useProfile() {
  const navigate = useNavigate();
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated() && !!getUserIdFromToken(),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        clearAuthTokens();
        navigate({ to: '/login' });
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Utility hooks for auth state
export function useIsAuthenticated() {
  return isAuthenticated();
}

export function useUserRole() {
  return getUserRole();
}

export function useUserId() {
  return getUserIdFromToken();
}