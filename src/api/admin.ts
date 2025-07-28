import { apiClient } from './apiClient';

export interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    successfulPayments: number;
    paymentSuccessRate: number;
  };
  appointments: {
    total: number;
    completed: number;
    completionRate: number;
  };
  emergency: {
    total: number;
    active: number;
  };
  userBreakdown: Record<string, number>;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  icon: string;
}

export interface SystemAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  type: string;
}

export interface UserGrowthData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }>;
  summary: {
    totalNewUsers: number;
    period: string;
  };
}

export interface RevenueAnalytics {
  periods: string[];
  revenue: number[];
  successful_payments: number[];
  total_payments: number[];
  summary: {
    totalRevenue: number;
    totalPayments: number;
    period: string;
  };
}

export const adminAPI = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch dashboard statistics');
    }
  },

  getRecentActivities: async (limit?: number): Promise<Activity[]> => {
    try {
      const response = await apiClient.get(`/admin/recent-activities${limit ? `?limit=${limit}` : ''}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch recent activities');
    }
  },

  getSystemAlerts: async (): Promise<SystemAlert[]> => {
    try {
      const response = await apiClient.get('/admin/system-alerts');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch system alerts');
    }
  },

  getUserGrowth: async (period?: string): Promise<UserGrowthData> => {
    try {
      const response = await apiClient.get(`/admin/user-growth${period ? `?period=${period}` : ''}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user growth data');
    }
  },

  getRevenueAnalytics: async (period?: string): Promise<RevenueAnalytics> => {
    try {
      const response = await apiClient.get(`/admin/revenue-analytics${period ? `?period=${period}` : ''}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch revenue analytics');
    }
  },
};