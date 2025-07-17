import { UserRole, UserStatus } from "@/types/enums";
import { API_URL } from "./url";
import axios from 'axios';

// Types matching your backend
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userRole: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userRole?: UserRole;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
}

// Add type for profile response
export interface UserWithProfile extends User {
  profile?: any; // You can refine this type if you have TPatientProfile, TDoctorProfile, etc.
  profileRole?: string;
}

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User API functions
export const userAPI = {
  // Create a new user (Admin only)
  createUser: async (userData: CreateUserDto): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Get all users with optional role filter (Admin only)
  getAllUsers: async (userRole?: UserRole): Promise<User[]> => {
    const params = userRole ? { userRole } : {};
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID (Admin only)
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user (Admin only)
  updateUser: async (id: string, userData: UpdateUserDto): Promise<User> => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user (Admin only)
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get all users with their profiles (Admin only)
  getAllProfiles: async (): Promise<UserWithProfile[]> => {
    const response = await api.get('/users/getAllProfiles');
    return response.data;
  },
};

