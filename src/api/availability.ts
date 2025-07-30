import { apiClient } from './apiClient';
import { API_URL } from './url';

export interface CreateAvailabilitySlotDto {
  startTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  endTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
  type?: 'standard' | 'emergency' | 'consultation';
}

export interface UpdateAvailabilityDto {
  startTime?: string;
  endTime?: string;
  type?: 'standard' | 'emergency' | 'consultation';
  isBooked?: boolean;
}

export interface AvailabilitySlot {
  isBooked: boolean;
  id: string;
  startTime: string;
  endTime: string;
  type?: 'standard' | 'emergency' | 'consultation';
  doctor: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    specialization: string;
    qualification: string;
    licenseNumber: string;
    consultationFee: number;
  };
}

export const availabilityApi = {
  // Create availability slot (Doctor only)
  createAvailabilitySlot: async (slotData: CreateAvailabilitySlotDto): Promise<AvailabilitySlot> => {
    try {
      const response = await apiClient.post(`${API_URL}/availability`, slotData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid data provided');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 403) {
        throw new Error('Not authorized to create availability slots');
      }
      throw new Error(error.response?.data?.message || 'Failed to create availability slot');
    }
  },

  // Get all availability slots for the logged-in doctor
  getDoctorAvailabilitySlots: async (): Promise<AvailabilitySlot[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/availability`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch availability slots');
    }
  },

  getAllAvailabilitySlots: async (): Promise<AvailabilitySlot[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/availability/allDoctors`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch availability slots');
    }
  },

  // Get availability slot by ID
  getAvailabilitySlotById: async (id: string): Promise<AvailabilitySlot> => {
    try {
      const response = await apiClient.get(`${API_URL}/availability/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch availability slot');
    }
  },

  // Update availability slot
  updateAvailabilitySlot: async (id: string, updateData: UpdateAvailabilityDto): Promise<AvailabilitySlot> => {
    try {
      const response = await apiClient.patch(`${API_URL}/availability/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update availability slot');
    }
  },

  // Delete availability slot
  deleteAvailabilitySlot: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${API_URL}/availability/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete availability slot');
    }
  },

  // Get available slots for a specific doctor (for patients to book)
  getAvailableSlotsForDoctor: async (doctorId: string): Promise<AvailabilitySlot[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/availability/doctor/${doctorId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available slots');
    }
  },

  // Get available slots for a specific date range
  getAvailableSlotsByDateRange: async (startDate: string, endDate: string): Promise<AvailabilitySlot[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/availability/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available slots');
    }
  },
};

// Error handling utility
export const handleApiError = (error: any) => {
  if (error.response) {
    throw new Error(error.response.data.message || 'An error occurred');
  } else if (error.request) {
    throw new Error('Network error - please check your connection');
  } else {
    throw new Error('An unexpected error occurred');
  }
};