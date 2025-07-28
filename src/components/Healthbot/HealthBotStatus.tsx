// src/components/HealthBot/HealthBotStatus.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, AlertCircle, Pill, FileText, Search } from 'lucide-react';
import { useHealthBot } from '../../hooks/useHealthBot';

interface HealthBotStatusProps {
  onMyPrescriptions?: () => void;
  onMyMedicines?: () => void;
  onMedicineSearch?: () => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

export const HealthBotStatus: React.FC<HealthBotStatusProps> = ({
  onMyPrescriptions,
  onMyMedicines,
  onMedicineSearch,
  isAuthenticated = false,
  isLoading = false
}) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const { getHealthStatus } = useHealthBot();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const healthStatus = await getHealthStatus();
        setStatus(healthStatus);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [getHealthStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Activity className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Health Bot Status</h3>
      
      {/* Status Information */}
      {status ? (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.status)}
              <span className="font-medium text-gray-700 dark:text-gray-300">Service Status</span>
            </div>
            <span className={`font-semibold ${getStatusColor(status.status)}`}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Knowledge Base</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">{status.knowledgeBaseSize} documents</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {new Date(status.lastUpdate).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 mb-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to fetch status</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h4>
        
        {isAuthenticated ? (
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={onMyPrescriptions}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              <span>My Prescriptions</span>
            </button>
            
            <button
              onClick={onMyMedicines}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pill className="w-4 h-4" />
              <span>My Medicines</span>
            </button>
            
            <button
              onClick={onMedicineSearch}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              <span>Search Medicines</span>
            </button>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              🔒 Login required for medicine features
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Access your prescriptions, medicines, and search functionality after authentication
            </p>
          </div>
        )}
      </div>
    </div>
  );
};