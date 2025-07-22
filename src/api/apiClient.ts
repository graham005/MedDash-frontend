import axios from 'axios';
import { API_URL } from './url';
import { refreshAuthToken } from './auth';
import { isTokenExpired } from '@/utils/tokenUtils';

// Create API client with automatic token refresh
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

// Process failed queue after refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Request interceptor with token refresh
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      if (isTokenExpired(token)) {
        console.log('Token expired, attempting refresh...');
        
        if (!isRefreshing) {
          isRefreshing = true;
          
          try {
            const newToken = await refreshAuthToken();
            localStorage.setItem('accessToken', newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
          } catch (error) {
            processQueue(error, null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            throw error;
          } finally {
            isRefreshing = false;
          }
        } else {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token: unknown) => {
            config.headers.Authorization = `Bearer ${token as string}`;
            return config;
          });
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const newToken = await refreshAuthToken();
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue the request if already refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token: unknown) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`;
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
    }

    return Promise.reject(error);
  }
);