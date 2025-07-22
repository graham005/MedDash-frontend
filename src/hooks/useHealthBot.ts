// src/hooks/useHealthBot.ts
import { useState, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';
import { useCurrentUser } from '@/hooks/useAuth';
import type { CreateAppointmentDto } from '@/api/appointments';

interface BotResponse {
  answer: string;
  confidence: number;
  sources: string[];
  escalate: boolean;
  reasoning?: string;
}

interface BotControllerResponse {
  success: boolean;
  data: BotResponse;
  timestamp: string;
  requestId?: string;
}

interface HealthCheckResponse {
  status: string;
  knowledgeBaseSize: number;
  lastUpdate: Date;
  timestamp: string;
}

interface UseHealthBotReturn {
  askQuestion: (question: string) => Promise<BotResponse>;
  askQuestionAuthenticated: (question: string) => Promise<BotResponse>;
  handleEmergency: (situation: string) => Promise<BotResponse>;
  scheduleAppointment: (appointmentData: CreateAppointmentDto) => Promise<any>;
  getUserAppointments: () => Promise<any>;
  getHealthStatus: () => Promise<HealthCheckResponse>;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useHealthBot = (): UseHealthBotReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();
  const isAuthenticated = !!currentUser;

  const askQuestion = useCallback(async (question: string): Promise<BotResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<BotControllerResponse>(
        '/health-bot/ask',
        { question },
        {
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to get response from health bot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const askQuestionAuthenticated = useCallback(async (question: string): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for this feature');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<BotControllerResponse>(
        '/health-bot/ask-authenticated',
        { question },
        {
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to get response from health bot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleEmergency = useCallback(async (situation: string): Promise<BotResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<BotControllerResponse>(
        '/health-bot/emergency',
        { situation },
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to handle emergency request');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Emergency service unavailable';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleAppointment = useCallback(async (appointmentData: CreateAppointmentDto): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to schedule appointments');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        '/health-bot/schedule-appointment',
        appointmentData,
        {
          timeout: 10000,
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to schedule appointment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getUserAppointments = useCallback(async (): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to view appointments');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/health-bot/appointments', {
        timeout: 10000,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get appointments';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getHealthStatus = useCallback(async (): Promise<HealthCheckResponse> => {
    try {
      const response = await apiClient.get<HealthCheckResponse>(
        '/health-bot/health',
        { timeout: 5000 }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get health status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    askQuestion,
    askQuestionAuthenticated,
    handleEmergency,
    scheduleAppointment,
    getUserAppointments,
    getHealthStatus,
    isLoading,
    error,
    isAuthenticated,
  };
};