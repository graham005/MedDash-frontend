import { apiClient } from './apiClient';
import { API_URL } from './url';

export interface CreatePharmacyOrderDto {
  prescriptionId: string;
  status?: OrderStatus;
  totalAmount: number;
}

export interface UpdatePharmacyOrderDto {
  prescriptionId?: string;
  status?: OrderStatus;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface PharmacyOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  prescription: {
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
    };
    patient: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  patient: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export const pharmacyOrderApi = {
  // Create pharmacy order (Pharmacist only)
  createPharmacyOrder: async (orderData: CreatePharmacyOrderDto): Promise<PharmacyOrder> => {
    try {
      const response = await apiClient.post(`${API_URL}/pharmacy-order`, orderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating pharmacy order:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid order data. Please check your information.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Only pharmacists can create orders.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error('Failed to create pharmacy order. Please try again.');
    }
  },

  // Get all pharmacy orders for logged-in pharmacist
  getAllPharmacyOrders: async (): Promise<PharmacyOrder[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/pharmacy-order`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pharmacy orders:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error('Failed to fetch pharmacy orders.');
    }
  },

  // Get pharmacy order by ID
  getPharmacyOrderById: async (id: string): Promise<PharmacyOrder> => {
    try {
      const response = await apiClient.get(`${API_URL}/pharmacy-order/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pharmacy order:', error);
      if (error.response?.status === 404) {
        throw new Error('Pharmacy order not found.');
      }
      throw new Error('Failed to fetch pharmacy order.');
    }
  },

  // Update pharmacy order status
  updatePharmacyOrder: async (id: string, updateData: UpdatePharmacyOrderDto): Promise<PharmacyOrder> => {
    try {
      const response = await apiClient.patch(`${API_URL}/pharmacy-order/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating pharmacy order:', error);
      if (error.response?.status === 400) {
        throw new Error('Invalid order data.');
      } else if (error.response?.status === 404) {
        throw new Error('Pharmacy order not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only update your own orders.');
      }
      throw new Error('Failed to update pharmacy order.');
    }
  },

  // Cancel pharmacy order (sets status to CANCELLED)
  cancelPharmacyOrder: async (id: string): Promise<PharmacyOrder> => {
    try {
      const response = await apiClient.delete(`${API_URL}/pharmacy-order/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error canceling pharmacy order:', error);
      if (error.response?.status === 404) {
        throw new Error('Pharmacy order not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You can only cancel your own orders.');
      }
      throw new Error('Failed to cancel pharmacy order.');
    }
  },

  // Helper methods for status updates
  confirmOrder: async (id: string): Promise<PharmacyOrder> => {
    return pharmacyOrderApi.updatePharmacyOrder(id, { status: OrderStatus.CONFIRMED });
  },

  startProcessing: async (id: string): Promise<PharmacyOrder> => {
    return pharmacyOrderApi.updatePharmacyOrder(id, { status: OrderStatus.PROCESSING });
  },

  markReady: async (id: string): Promise<PharmacyOrder> => {
    return pharmacyOrderApi.updatePharmacyOrder(id, { status: OrderStatus.READY });
  },

  completeOrder: async (id: string): Promise<PharmacyOrder> => {
    return pharmacyOrderApi.updatePharmacyOrder(id, { status: OrderStatus.COMPLETED });
  },
};