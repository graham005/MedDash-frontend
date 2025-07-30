import axios from 'axios';
import { API_URL } from './url';

export interface CreatePrescriptionDto {
  name: string;
  patientId: string;
  date: string;
  validityDate: string;
  refillsAllowed?: number;
  medications: MedicationDto[];
}

export interface UpdatePrescriptionDto {
  name?: string;
  patientId?: string;
  date?: string;
  validityDate?: string;
  refillsAllowed?: number;
  medications?: MedicationDto[];
}

export interface RequestRefillDto {
  notes?: string;
}

export interface ApproveRefillDto {
  additionalRefills?: number;
  notes?: string;
}

export interface MedicationDto {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  FULFILLED = 'fulfilled',
  REFILL_REQUESTED = 'refill_requested',
  REFILL_APPROVED = 'refill_approved',
  EXPIRED = 'expired'
}

export interface Prescription {
  id: string;
  name: string;
  date: string;
  validityDate: string;
  status: PrescriptionStatus;
  refillsAllowed: number;
  refillsUsed: number;
  lastRefillDate: string | null;
  refillRequestedAt: string | null;
  refillRequestNotes: string | null;
  canBeRefilled: boolean;
  canBeOrdered: boolean;
  medications: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
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

  // Get all prescriptions for logged-in user
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

  // Get orderable prescriptions (Patient only)
  getOrderablePrescriptions: async (): Promise<Prescription[]> => {
    try {
      const response = await axios.get(`${API_URL}/prescription/orderable`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching orderable prescriptions:', error);
      throw new Error('Failed to fetch orderable prescriptions.');
    }
  },

  // Get refill requests (Doctor only)
  getRefillRequests: async (): Promise<Prescription[]> => {
    try {
      const response = await axios.get(`${API_URL}/prescription/pending-refills`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching refill requests:', error);
      throw new Error('Failed to fetch refill requests.');
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

  // Request refill (Patient only)
  requestRefill: async (id: string, requestData: RequestRefillDto): Promise<Prescription> => {
    try {
      const response = await axios.post(`${API_URL}/prescription/${id}/request-refill`, requestData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting refill:', error);
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Cannot request refill for this prescription.');
      }
      throw new Error('Failed to request refill.');
    }
  },

  // Approve refill (Doctor only)
  approveRefill: async (id: string, approvalData: ApproveRefillDto): Promise<Prescription> => {
    try {
      const response = await axios.post(`${API_URL}/prescription/${id}/approve-refill`, approvalData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error approving refill:', error);
      throw new Error('Failed to approve refill.');
    }
  },

  // Deny refill (Doctor only)
  denyRefill: async (id: string, reason: string): Promise<Prescription> => {
    try {
      const response = await axios.post(`${API_URL}/prescription/${id}/deny-refill`, { reason }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error denying refill:', error);
      throw new Error('Failed to deny refill.');
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