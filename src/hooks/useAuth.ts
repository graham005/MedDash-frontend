import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  loginUser, 
  logoutUser, 
  signupUser, 
  getCurrentUser, 
  refreshAuthToken,
  createDoctorProfile,
  createPatientProfile,
  createPharmacistProfile,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  isAuthenticated,
  getUserRole,
  clearAuthTokens,
  getUserIdFromToken
} from '@/api/auth';
import type { TSignIn, TSignUp, TDoctorProfile, TPatientProfile, TPharmacistProfile } from '@/types/types';

// Get current user
export function useCurrentUser() {
  const navigate = useNavigate();
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
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

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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