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

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Login mutation - OPTIMIZED: Extract user ID from token and fetch user data
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // loginUser returns AuthResponse with tokens
      // Extract user ID from access token and fetch user data
      const userId = getUserIdFromToken(data.accessToken);
      if (userId) {
        // Invalidate current user query to trigger refetch with new token
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        // Optionally, you can also prefetch user data immediately
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

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear();
      clearAuthTokens();
      navigate({ to: '/login' });
    },
  });

  // Signup mutation - OPTIMIZED: Handle signup response appropriately
  const signupMutation = useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      // signupUser returns SignUpResponse with user data but no tokens
      // Store the user data temporarily until login
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  // Get current user query - OPTIMIZED: Enable based on token presence and user ID
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated() && !!getUserIdFromToken(), // Only fetch if authenticated and user ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if unauthorized
      if (error?.response?.status === 401) {
        // Clear tokens on 401 and redirect to login
        clearAuthTokens();
        navigate({ to: '/login' });
        return false;
      }
      return failureCount < 2;
    },
  });

  // Profile creation mutations - OPTIMIZED: No need for userId parameter
  const createDoctorProfileMutation = useMutation({
    mutationFn: (profileData: TDoctorProfile) => createDoctorProfile(profileData),
    onSuccess: () => {
      // Invalidate current user query to refetch updated profile
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const createPatientProfileMutation = useMutation({
    mutationFn: (profileData: TPatientProfile) => createPatientProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const createPharmacistProfileMutation = useMutation({
    mutationFn: (profileData: TPharmacistProfile) => createPharmacistProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // Password operations
  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      updatePassword(currentPassword, newPassword),
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      resetPassword(token, newPassword),
  });

  return {
    // State
    currentUser,
    isLoading,
    error,
    isAuthenticated: isAuthenticated(),
    userRole: getUserRole(),
    userId: getUserIdFromToken(), // Expose user ID from token
    
    // Mutations
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    createDoctorProfile: createDoctorProfileMutation.mutateAsync,
    createPatientProfile: createPatientProfileMutation.mutateAsync,
    createPharmacistProfile: createPharmacistProfileMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    
    // Mutation states
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isSignupPending: signupMutation.isPending,
    isCreateDoctorProfilePending: createDoctorProfileMutation.isPending,
    isCreatePatientProfilePending: createPatientProfileMutation.isPending,
    isCreatePharmacistProfilePending: createPharmacistProfileMutation.isPending,
    isUpdatePasswordPending: updatePasswordMutation.isPending,
    isRequestPasswordResetPending: requestPasswordResetMutation.isPending,
    isResetPasswordPending: resetPasswordMutation.isPending,
    
    // Mutation errors
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    signupError: signupMutation.error,
    createDoctorProfileError: createDoctorProfileMutation.error,
    createPatientProfileError: createPatientProfileMutation.error,
    createPharmacistProfileError: createPharmacistProfileMutation.error,
    updatePasswordError: updatePasswordMutation.error,
    requestPasswordResetError: requestPasswordResetMutation.error,
    resetPasswordError: resetPasswordMutation.error,
  };
};