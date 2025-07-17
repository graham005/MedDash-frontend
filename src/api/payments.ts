import { API_URL } from './url';
import axios, { type AxiosRequestConfig } from 'axios';

const api = axios.create({ baseURL: API_URL });

// Helper to get auth headers - FIXED
const getAuthHeaders = (): AxiosRequestConfig['headers'] => {
    const token = localStorage.getItem('accessToken'); 
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface CreatePaymentDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    amount: number;
    type: 'appointment' | 'pharmacy_order';
    appointmentId?: string;
    pharmacyOrderId?: string;
    notes?: string;
}

export interface Payment {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
    type: 'appointment' | 'pharmacy_order';
    paystackReference: string;
    paystackAccessCode: string;
    paystackAuthorizationUrl: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentInitializeResponse {
    payment: Payment;
    paystack_data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export const paymentsAPI = {
    // Initialize payment
    initializePayment: async (paymentData: CreatePaymentDto): Promise<PaymentInitializeResponse> => {
        const response = await api.post('/payments/initialize', paymentData, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Verify payment
    verifyPayment: async (reference: string): Promise<any> => {
        const response = await api.post(`/payments/verify/${reference}`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Get all payments for user
    getPayments: async (): Promise<Payment[]> => {
        const response = await api.get('/payments', {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Get payment by ID
    getPaymentById: async (id: string): Promise<Payment> => {
        const response = await api.get(`/payments/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Cancel payment
    cancelPayment: async (id: string): Promise<Payment> => {
        const response = await api.patch(`/payments/${id}/cancel`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Refund payment (admin only)
    refundPayment: async (id: string): Promise<Payment> => {
        const response = await api.post(`/payments/${id}/refund`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Update payment
    updatePayment: async (id: string, updateData: Partial<CreatePaymentDto>): Promise<Payment> => {
        const response = await api.patch(`/payments/${id}`, updateData, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    // Delete payment
    deletePayment: async (id: string): Promise<void> => {
        await api.delete(`/payments/${id}`, {
            headers: getAuthHeaders(),
        });
    }
};