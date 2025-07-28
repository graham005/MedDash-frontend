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

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  manufacturer?: string;
  price?: number;
}

interface Prescription {
  id: string;
  name: string;
  prescribedBy: any;
  prescribedDate: Date;
  medicines: Medicine[];
}

interface UseHealthBotReturn {
  askQuestion: (question: string) => Promise<BotResponse>;
  askQuestionAuthenticated: (question: string) => Promise<BotResponse>;
  handleEmergency: (situation: string) => Promise<BotResponse>;
  scheduleAppointment: (appointmentData: CreateAppointmentDto) => Promise<any>;
  getUserAppointments: () => Promise<any>;
  getUserPrescriptions: () => Promise<Prescription[]>;
  getPrescriptions: () => Promise<BotResponse>;
  getMedicines: () => Promise<BotResponse>;
  getWhoPrescribed: (prescriptionName: string) => Promise<BotResponse>;
  getMedicineInfo: (medicineName: string) => Promise<BotResponse>;
  getMedicineSideEffects: (medicineName: string) => Promise<BotResponse>;
  getMedicineUsage: (medicineName: string) => Promise<BotResponse>;
  searchMedicines: (query: string) => Promise<Medicine[]>;
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
        { timeout: 30000 }
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
        { timeout: 30000 }
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
        { timeout: 10000 }
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
        { timeout: 10000 }
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

  // Medicine-specific methods
  const getUserPrescriptions = useCallback(async (): Promise<Prescription[]> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to view prescriptions');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await askQuestionAuthenticated('What medicines are in my prescription?');
      // Parse the response to extract prescription data
      // This is a simplified implementation - you might need to adjust based on your backend response format
      return [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get prescriptions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getPrescriptions = useCallback(async (): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to view prescriptions');
    }
    return await askQuestionAuthenticated('My prescriptions');
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getMedicines = useCallback(async (): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required to view medicines');
    }
    return await askQuestionAuthenticated('My medicines');
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getWhoPrescribed = useCallback(async (prescriptionName: string): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for prescription information');
    }
    return await askQuestionAuthenticated(`Who prescribed ${prescriptionName}?`);
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getMedicineInfo = useCallback(async (medicineName: string): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for medicine information');
    }

    return await askQuestionAuthenticated(`Tell me about ${medicineName}`);
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getMedicineSideEffects = useCallback(async (medicineName: string): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for medicine information');
    }

    return await askQuestionAuthenticated(`What are the side effects of ${medicineName}?`);
  }, [isAuthenticated, askQuestionAuthenticated]);

  const getMedicineUsage = useCallback(async (medicineName: string): Promise<BotResponse> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for medicine information');
    }

    return await askQuestionAuthenticated(`What does ${medicineName} do?`);
  }, [isAuthenticated, askQuestionAuthenticated]);

  const searchMedicines = useCallback(async (query: string): Promise<Medicine[]> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required for medicine search');
    }

    try {
      const response = await askQuestionAuthenticated(`Search for medicines: ${query}`);
      // Parse response for medicine suggestions
      // This is a simplified implementation
      return [];
    } catch (err) {
      return [];
    }
  }, [isAuthenticated, askQuestionAuthenticated]);

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
    getUserPrescriptions,
    getPrescriptions,
    getMedicines,
    getWhoPrescribed,
    getMedicineInfo,
    getMedicineSideEffects,
    getMedicineUsage,
    searchMedicines,
    getHealthStatus,
    isLoading,
    error,
    isAuthenticated,
  };
};