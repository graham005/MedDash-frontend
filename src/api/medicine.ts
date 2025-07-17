import axios from 'axios';
import { API_URL } from './url';

export interface CreateMedicineDto {
  name: string;
  dosage: string;
  price: number;
  stock: number;
  manufacturer: string;
  expirationDate: Date
}

export interface UpdateMedicineDto {
  name?: string;
  dosage?: string;
  price?: number;
  stock?: number;
  manufacturer?: string;
  expirationDate?: Date
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  price: number;
  stock: number;
  manufacturer: string;
  expirationDate: Date
  addedBy: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    pharmacyName: string;
    licenseNumber: string;
  };
}

export const medicineApi = {
  // Create medicine (Pharmacist only)
  createMedicine: async (medicineData: CreateMedicineDto): Promise<Medicine> => {
    try {
      const response = await axios.post(`${API_URL}/medicine`, medicineData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating medicine:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid medicine data. Please check your information.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Only pharmacists can create medicines.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error('Failed to create medicine. Please try again.');
    }
  },

  // Get all medicines for logged-in pharmacist
  getAllMedicines: async (): Promise<Medicine[]> => {
    try {
      const response = await axios.get(`${API_URL}/medicine`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching medicines:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error('Failed to fetch medicines.');
    }
  },

  // Get medicine by ID
  getMedicineById: async (id: string): Promise<Medicine> => {
    try {
      const response = await axios.get(`${API_URL}/medicine/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching medicine:', error);
      if (error.response?.status === 404) {
        throw new Error('Medicine not found.');
      }
      throw new Error('Failed to fetch medicine.');
    }
  },

  // Update medicine
  updateMedicine: async (id: string, updateData: UpdateMedicineDto): Promise<Medicine> => {
    try {
      const response = await axios.patch(`${API_URL}/medicine/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating medicine:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid medicine data.');
      } else if (error.response?.status === 404) {
        throw new Error('Medicine not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only update your own medicines.');
      }
      throw new Error('Failed to update medicine.');
    }
  },

  // Delete medicine
  deleteMedicine: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/medicine/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    } catch (error: any) {
      console.error('Error deleting medicine:', error);
      if (error.response?.status === 404) {
        throw new Error('Medicine not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only delete your own medicines.');
      }
      throw new Error('Failed to delete medicine.');
    }
  },
};