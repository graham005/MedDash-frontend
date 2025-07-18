// src/hooks/useHealthBot.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../api/url';


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
  handleEmergency: (situation: string) => Promise<BotResponse>;
  getHealthStatus: () => Promise<HealthCheckResponse>;
  isLoading: boolean;
  error: string | null;
}

export const useHealthBot = (): UseHealthBotReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseURL = API_URL;

  const askQuestion = useCallback(async (question: string): Promise<BotResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<BotControllerResponse>(
        `${baseURL}/api/health-bot/ask`,
        { question },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000000000,
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
  }, [baseURL]);

  const handleEmergency = useCallback(async (situation: string): Promise<BotResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<BotControllerResponse>(
        `${baseURL}/api/health-bot/emergency`,
        { situation },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 1000000000,
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
  }, [baseURL]);

  const getHealthStatus = useCallback(async (): Promise<HealthCheckResponse> => {
    try {
      const response = await axios.get<HealthCheckResponse>(
        `${baseURL}/api/health-bot/health`,
        { timeout: 50000000 }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get health status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [baseURL]);

  return {
    askQuestion,
    handleEmergency,
    getHealthStatus,
    isLoading,
    error,
  };
};