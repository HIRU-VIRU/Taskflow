import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { PlatformStats, RevenueDataPoint } from '../types';

// The platform token is stored separately from the tenant token
export const platformTokenUtils = {
  getToken: () => localStorage.getItem('platform_token'),
  setToken: (token: string) => localStorage.setItem('platform_token', token),
  clearToken: () => localStorage.removeItem('platform_token'),
};

const platformApiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

platformApiClient.interceptors.request.use(
  (config) => {
    const token = platformTokenUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

platformApiClient.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(response.data.error);
    }
    return response.data?.data ?? response.data;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      platformTokenUtils.clearToken();
      window.dispatchEvent(new CustomEvent('platformAuthError', { detail: { code: 'UNAUTHORIZED' } }));
    }
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

export const platformApi = {
  login: async (email: string, password: string) => {
    return platformApiClient.post('/platform/auth/login', { email, password });
  },

  getMe: async () => {
    return platformApiClient.get('/platform/me') as any;
  },

  getStats: async (): Promise<PlatformStats> => {
    return platformApiClient.get('/platform/stats') as any;
  },

  getRevenueHistory: async (months = 12): Promise<RevenueDataPoint[]> => {
    return platformApiClient.get(`/platform/revenue-history?months=${months}`) as any;
  },

  getTenants: async (params: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; search?: string; plan?: string }) => {
    return platformApiClient.get('/platform/tenants', { params }) as any;
  },

  getTenantDetail: async (tenantId: string) => {
    return platformApiClient.get(`/platform/tenants/${tenantId}`) as any;
  },
};
