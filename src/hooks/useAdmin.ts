import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/api/admin';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: adminAPI.getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useRecentActivities = (limit?: number) => {
  return useQuery({
    queryKey: ['admin', 'recent-activities', limit],
    queryFn: () => adminAPI.getRecentActivities(limit),
    refetchInterval: 15000, // Refetch every 15 seconds for real-time feel
  });
};

export const useSystemAlerts = () => {
  return useQuery({
    queryKey: ['admin', 'system-alerts'],
    queryFn: adminAPI.getSystemAlerts,
    refetchInterval: 10000, // Refetch every 10 seconds for alerts
  });
};

export const useUserGrowth = (period?: string) => {
  return useQuery({
    queryKey: ['admin', 'user-growth', period],
    queryFn: () => adminAPI.getUserGrowth(period),
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useRevenueAnalytics = (period?: string) => {
  return useQuery({
    queryKey: ['admin', 'revenue-analytics', period],
    queryFn: () => adminAPI.getRevenueAnalytics(period),
    refetchInterval: 60000, // Refetch every minute
  });
};