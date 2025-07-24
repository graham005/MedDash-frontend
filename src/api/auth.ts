import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './url';
import { isTokenExpired, shouldRefreshToken } from '@/utils/tokenUtils';
import type { TDoctorProfile, TPatientProfile, TPharmacistProfile, TSignIn, TSignUp } from '@/types/types';
import { apiClient } from './apiClient';

// Enhanced response types based on backend
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface SignUpResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userRole: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userRole: string;
  profile?: TPatientProfile | TDoctorProfile | TPharmacistProfile;
}

// Profile response interfaces matching backend
interface ProfileResponse {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    userRole: string;
  };
  // Profile-specific fields will be added based on type
  dateOfBirth?: string;
  bloodType?: string;
  specialization?: string;
  qualification?: string;
  licenseNumber?: string;
  pharmacyName?: string;
  consultationFee: number;
}

// Create axios instance with enhanced token management
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

// Process failed queue after refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};


// Token refresh function - SINGLE DECLARATION
export const refreshAuthToken = async (): Promise<string> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const token = localStorage.getItem('accessToken');

    if (!refreshToken || !token) {
      throw new Error('No refresh token available');
    }

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      throw new Error('Invalid token format');
    }

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    // Use vanilla axios to avoid interceptor loops
    const response: AxiosResponse<AuthResponse> = await axios.get(
      `${API_URL}/auth/refresh?id=${userId}&refreshToken=${refreshToken}`,
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      }
    );

    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  } catch (error: any) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw new Error('Token refresh failed. Please login again.');
  }
};

// Enhanced request interceptor with token refresh

// ... (your refreshAuthToken function)

authApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');

    if (token && isTokenExpired(token)) { // Use isTokenExpired for interceptor
      console.log('Token expired, attempting refresh...');

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAuthToken();
          localStorage.setItem('accessToken', newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
        } catch (error) {
          processQueue(error, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw error;
        } finally {
          isRefreshing = false;
        }
      } else {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token: unknown) => {
          config.headers.Authorization = `Bearer ${token as string}`;
          return config;
        });
      }
    } else if (token) { // Ensure token is always set if available and not expired
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor looks generally fine for 401 handling
// but ensure it also checks isRefreshing
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) { // Crucial check
        isRefreshing = true;
        try {
          const newToken = await refreshAuthToken();
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return authApi(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue the request if already refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token: unknown) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`;
          return authApi(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions using authApi with automatic token refresh
export const loginUser = async (loginData: TSignIn): Promise<AuthResponse> => {
  try {
    const response: AxiosResponse<AuthResponse> = await axios.post(`${API_URL}/auth/signin`, loginData);
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid credentials. Please check your email and password.');
    } else if (error.response?.status === 403) {
      throw new Error('Account is disabled. Please contact support.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Login failed. Please check your credentials.');
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    const userId = getUserIdFromToken();
    if (userId) {
      await authApi.get(`/auth/signout/${userId}`);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (error: any) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw new Error('Logout failed. Please try again.');
  }
};

export const signupUser = async (signUpData: TSignUp): Promise<SignUpResponse> => {
  try {
    const response: AxiosResponse<SignUpResponse> = await axios.post(`${API_URL}/auth/signup`, signUpData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Email already exists. Please use a different email.');
    } else if (error.response?.status === 400) {
      console.log('Invalid data. Please check your information.', error)
      throw new Error('Invalid data. Please check your information.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Signup failed. Please try again.');
  }
};

// Profile creation functions using authApi with automatic token refresh
export const createDoctorProfile = async (profileData: TDoctorProfile): Promise<ProfileResponse> => {
  try {
    const response: AxiosResponse<ProfileResponse> = await authApi.post(`/auth/doctor/profile`, profileData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid profile data. Please check your information.');
    } else if (error.response?.status === 409) {
      throw new Error('Doctor profile already exists for this user.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Creating doctor profile failed. Please try again.');
  }
};

export const createPatientProfile = async (profileData: TPatientProfile): Promise<ProfileResponse> => {
  try {
    const response: AxiosResponse<ProfileResponse> = await authApi.post(`/auth/patient/profile`, profileData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid profile data. Please check your information.');
    } else if (error.response?.status === 409) {
      throw new Error('Patient profile already exists for this user.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Creating patient profile failed. Please try again.');
  }
};

export const createPharmacistProfile = async (profileData: TPharmacistProfile): Promise<ProfileResponse> => {
  try {
    const response: AxiosResponse<ProfileResponse> = await authApi.post(`/auth/pharmacist/profile`, profileData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid profile data. Please check your information.');
    } else if (error.response?.status === 409) {
      throw new Error('Pharmacist profile already exists for this user.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Creating pharmacist profile failed. Please try again.');
  }
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    const response: AxiosResponse<UserResponse> = await authApi.get(`/auth/me`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to get user information.');
  }
};

export const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await authApi.patch(`/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Current password is incorrect.');
    } else if (error.response?.status === 422) {
      throw new Error('New password does not meet requirements.');
    }
    throw new Error('Password update failed. Please try again.');
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/forgot-password`, { email });
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Email not found.');
    }
    throw new Error('Password reset request failed. Please try again.');
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword,
    });
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid or expired reset token.');
    }
    throw new Error('Password reset failed. Please try again.');
  }
};

export const updateProfile = async (
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin',
  id: string,
  profileData: any
): Promise<any> => {
  try {
    let endpoint = '';
    switch (role) {
      case 'patient':
        endpoint = `/auth/patient/profile/${id}`;
        break;
      case 'doctor':
        endpoint = `/auth/doctor/profile/${id}`;
        break;
      case 'pharmacist':
        endpoint = `/auth/pharmacist/profile/${id}`;
        break;
      case 'admin':
        endpoint = `/auth/admin/profile/${id}`;
        break;
      default:
        throw new Error('Invalid role');
    }
    const response: AxiosResponse<any> = await authApi.patch(endpoint, profileData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Profile update failed.');
  }
};

export const createAdminProfile = async (profileData: { department: string }): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await authApi.post(`/auth/admin/profile`, profileData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid profile data. Please check your information.');
    } else if (error.response?.status === 409) {
      throw new Error('Admin profile already exists for this user.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Creating admin profile failed. Please try again.');
  }
};

export const getProfile = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await authApi.get(`/auth/profile`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to get profile information.');
  }
};

// Auth state management helpers
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    const hasUserId = !!(payload.sub || payload.userId || payload.id);

    return !isExpired && hasUserId;
  } catch {
    return false;
  }
};

export const getUserRole = (): string | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getUserIdFromToken = (token?: string): string | null => {
  try {
    const accessToken = token || localStorage.getItem('accessToken');
    if (!accessToken) return null;

    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.userId || payload.id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};