import { apiClient } from './apiClient';

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
        const response = await apiClient.post('/payments/initialize', paymentData);
        return response.data;
    },

    // Verify payment
    verifyPayment: async (reference: string): Promise<any> => {
        const response = await apiClient.post(`/payments/verify/${reference}`);
        return response.data;
    },

    // Get all payments for user
    getPayments: async (): Promise<Payment[]> => {
        const response = await apiClient.get('/payments');
        return response.data;
    },

    // Get payment by ID
    getPaymentById: async (id: string): Promise<Payment> => {
        const response = await apiClient.get(`/payments/${id}`);
        return response.data;
    },

    // Cancel payment
    cancelPayment: async (id: string): Promise<Payment> => {
        const response = await apiClient.patch(`/payments/${id}/cancel`);
        return response.data;
    },

    // Refund payment (admin only)
    refundPayment: async (id: string): Promise<Payment> => {
        const response = await apiClient.post(`/payments/${id}/refund`);
        return response.data;
    },

    // Update payment
    updatePayment: async (id: string, updateData: Partial<CreatePaymentDto>): Promise<Payment> => {
        const response = await apiClient.patch(`/payments/${id}`, updateData);
        return response.data;
    },

    // Delete payment
    deletePayment: async (id: string): Promise<void> => {
        await apiClient.delete(`/payments/${id}`);
    }
};