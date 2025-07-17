import axios, { type AxiosResponse } from 'axios';
import { API_URL } from './url';
import type { TDoctorProfile, TPatientProfile, TPharmacistProfile, TSignIn, TSignUp } from '@/types/types';

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

// Create axios instance with default config
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh - FIXED
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Get user ID from token or storage
        const token = localStorage.getItem('accessToken');
        let userId = null;

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub;
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        }

        if (refreshToken && userId) {
          // Backend expects user context, id, and refreshToken as query params
          const response = await axios.get(`${API_URL}/auth/refresh?id=${userId}&refreshToken=${refreshToken}`, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return authApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const loginUser = async (loginData: TSignIn): Promise<AuthResponse> => {
  try {
    // Direct axios POST instead of apiClient.publicRequest
    const response: AxiosResponse<AuthResponse> = await axios.post(`${API_URL}/auth/signin`, loginData);

    // Store tokens directly in localStorage
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
    // Get userId from token directly
    const userId = getUserIdFromToken();

    if (userId) {
      await axios.get(`${API_URL}/auth/signout/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    }

    // Clear tokens directly
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch (error: any) {
    // Clear tokens even if logout API fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw new Error('Logout failed. Please try again.');
  }
};

export const signupUser = async (signUpData: TSignUp): Promise<SignUpResponse> => {
  try {
    const response: AxiosResponse<SignUpResponse> = await axios.post(`${API_URL}/auth/signup`, signUpData);
    // Note: Signup doesn't return tokens, only user data
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('Email already exists. Please use a different email.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid data. Please check your information.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error('Signup failed. Please try again.');
  }
};

// Profile creation functions - FIXED to match backend
export const createDoctorProfile = async (profileData: TDoctorProfile): Promise<ProfileResponse> => {
  try {
    const response: AxiosResponse<ProfileResponse> = await axios.post(`${API_URL}/auth/doctor/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
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
    const response: AxiosResponse<ProfileResponse> = await axios.post(`${API_URL}/auth/patient/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
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
    const response: AxiosResponse<ProfileResponse> = await axios.post(`${API_URL}/auth/pharmacist/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
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

// Token refresh function - FIXED
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

export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    const response: AxiosResponse<UserResponse> = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to get user information.');
  }
};

// Password update function - FIXED
export const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    let userId = null;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        throw new Error('Invalid token format');
      }
    }

    if (!userId) {
      throw new Error('User ID not found');
    }

    await axios.patch(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
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

// These functions might not exist in backend - you may need to implement them
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
    // Backend uses 'role' in JWT payload
    return payload.role || null;
  } catch {
    return null;
  }
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Helper function to decode JWT and extract user ID
export const getUserIdFromToken = (token?: string): string | null => {
  try {
    const accessToken = token || localStorage.getItem('accessToken');
    if (!accessToken) return null;

    // Decode JWT payload (base64 decode the middle part)
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.userId || payload.id || null; // Common JWT user ID fields
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Update Profile (for patient, doctor, pharmacist, admin)
export const updateProfile = async (
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin',
  id: string,
  profileData: any // Use the correct DTO type for each role if available
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
    const response: AxiosResponse<any> = await axios.patch(
      `${API_URL}${endpoint}`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Profile update failed.');
  }
};

// Create Admin Profile
export const createAdminProfile = async (profileData: { department: string }): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axios.post(
      `${API_URL}/auth/admin/profile`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
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
    const response: AxiosResponse<any> = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    throw new Error('Failed to get profile information.');
  }
};