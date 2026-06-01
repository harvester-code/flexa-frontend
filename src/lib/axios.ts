import axios, { type AxiosRequestConfig } from 'axios';
import { createClient } from '@/lib/auth/client';
import type { AxiosRetryConfig } from '@/types/simulationTypes';

const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

let _supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createClient();
  }
  return _supabaseClient;
};

const instanceWithAuth = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 180 * 1000,
});

instanceWithAuth.interceptors.request.use(
  async (config) => {
    try {
      const supabase = getSupabaseClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      const token = session?.access_token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      return config;
    } catch {
      return config;
    }
  },
  (error) => Promise.reject(error)
);

instanceWithAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const supabase = getSupabaseClient();
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } else if (error.config && !(error.config as AxiosRetryConfig)._retry) {
          (error.config as AxiosRetryConfig)._retry = true;
          return instanceWithAuth(error.config);
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const createAPIService = (domain: string) => {
  const serviceBaseURL = `/api/v1/${domain}`;

  return {
    get: <T = unknown>(endpoint: string, config?: AxiosRequestConfig) =>
      instanceWithAuth.get<T>(`${serviceBaseURL}${endpoint}`, config),

    post: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
      instanceWithAuth.post<T>(`${serviceBaseURL}${endpoint}`, data, config),

    put: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
      instanceWithAuth.put<T>(`${serviceBaseURL}${endpoint}`, data, config),

    patch: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
      instanceWithAuth.patch<T>(`${serviceBaseURL}${endpoint}`, data, config),

    delete: <T = unknown>(endpoint: string, config?: AxiosRequestConfig) =>
      instanceWithAuth.delete<T>(`${serviceBaseURL}${endpoint}`, config),

    withScenario: (scenarioId: string) => ({
      get: <T = unknown>(endpoint: string, config?: AxiosRequestConfig) =>
        instanceWithAuth.get<T>(`${serviceBaseURL}/${scenarioId}${endpoint}`, config),

      post: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
        instanceWithAuth.post<T>(`${serviceBaseURL}/${scenarioId}${endpoint}`, data, config),

      put: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
        instanceWithAuth.put<T>(`${serviceBaseURL}/${scenarioId}${endpoint}`, data, config),

      patch: <T = unknown>(endpoint: string, data?: unknown, config?: AxiosRequestConfig) =>
        instanceWithAuth.patch<T>(`${serviceBaseURL}/${scenarioId}${endpoint}`, data, config),

      delete: <T = unknown>(endpoint: string, config?: AxiosRequestConfig) =>
        instanceWithAuth.delete<T>(`${serviceBaseURL}/${scenarioId}${endpoint}`, config),
    }),
  };
};
