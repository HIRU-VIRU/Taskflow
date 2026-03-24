import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenUtils } from '../utils/token';

// Create axios instance with base URL
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors and normalize responses
apiClient.interceptors.response.use(
  (response) => {
    // API returns { success: true, data: {...} }
    // Transform to just return data
    if (response.data?.success === false) {
      return Promise.reject(response.data.error);
    }
    return response.data?.data ?? response.data;
  },
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Token expired or invalid
      tokenUtils.clearAll();
      // Redirect to login handled by app context
      const event = new CustomEvent('authError', { detail: { code: 'UNAUTHORIZED' } });
      window.dispatchEvent(event);
    }

    // Extract error message from API response
    const errorData = error.response?.data as any;
    const errorMessage = errorData?.error?.message || error.message || 'An error occurred';
    const errorCode = errorData?.error?.code || 'UNKNOWN_ERROR';

    return Promise.reject({
      code: errorCode,
      message: errorMessage,
      status: error.response?.status,
    });
  }
);

export default apiClient;
