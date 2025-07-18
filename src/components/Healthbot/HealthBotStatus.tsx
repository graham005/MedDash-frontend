// src/components/HealthBot/HealthBotStatus.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, AlertCircle } from 'lucide-react';
import { useHealthBot } from '../../hooks/useHealthBot';

export const HealthBotStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getHealthStatus } = useHealthBot();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const healthStatus = await getHealthStatus();
        setStatus(healthStatus);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [getHealthStatus]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Bot Status</h3>
      
      {status ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.status)}
              <span className="font-medium">Service Status</span>
            </div>
            <span className={`font-semibold ${getStatusColor(status.status)}`}>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Knowledge Base</span>
            </div>
            <span className="text-gray-600">{status.knowledgeBaseSize} documents</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Last Updated</span>
            </div>
            <span className="text-gray-600">
              {new Date(status.lastUpdate).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to fetch status</p>
        </div>
      )}
    </div>
  );
};