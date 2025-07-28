import axios from 'axios';
import { API_URL } from './url';

export interface CreatePrescriptionDto {
  name: string;
  patientId: string;
  date: string; // ISO 8601 format
  medications: MedicationDto[];
}

export interface UpdatePrescriptionDto {
  name?: string;
  patientId?: string;
  date?: string;
  medications?: MedicationDto[];
}

export interface MedicationDto {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  name: string;
  date: string;
  medications: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  prescribedBy: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    specialization: string;
    licenseNumber: string;
  };
  patient: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    dateOfBirth: string;
    bloodType: string;
  };
  orders?: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export const prescriptionApi = {
  // Create prescription (Doctor only)
  createPrescription: async (prescriptionData: CreatePrescriptionDto): Promise<Prescription> => {
    try {
      const response = await axios.post(`${API_URL}/prescription`, prescriptionData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid prescription data. Please check your information.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Only doctors can create prescriptions.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error('Failed to create prescription. Please try again.');
    }
  },

  // Get all prescriptions for logged-in doctor
  getAllPrescriptions: async (): Promise<Prescription[]> => {
    try {
      const response = await axios.get(`${API_URL}/prescription`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error('Failed to fetch prescriptions.');
    }
  },

  // Get prescription by ID
  getPrescriptionById: async (id: string): Promise<Prescription> => {
    try {
      const response = await axios.get(`${API_URL}/prescription/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching prescription:', error);
      if (error.response?.status === 404) {
        throw new Error('Prescription not found.');
      }
      throw new Error('Failed to fetch prescription.');
    }
  },

  // Update prescription
  updatePrescription: async (id: string, updateData: UpdatePrescriptionDto): Promise<Prescription> => {
    try {
      const response = await axios.patch(`${API_URL}/prescription/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid prescription data.');
      } else if (error.response?.status === 404) {
        throw new Error('Prescription not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only update your own prescriptions.');
      }
      throw new Error('Failed to update prescription.');
    }
  },

  // Delete prescription
  deletePrescription: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/prescription/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      if (error.response?.status === 404) {
        throw new Error('Prescription not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only delete your own prescriptions.');
      }
      throw new Error('Failed to delete prescription.');
    }
  },
};