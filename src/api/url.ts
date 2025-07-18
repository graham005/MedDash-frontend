import axios from 'axios';

export const API_URL = 'http://localhost:7000/api'

export const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);