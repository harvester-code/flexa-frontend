import axios from 'axios';
import { createClient } from '@/lib/auth/client';

export const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

const instanceWithAuth = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 180 * 1000,
});

instanceWithAuth.interceptors.request.use(
  async (config) => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * API 서비스를 위한 공통 유틸리티
 * 각 도메인별 서비스에서 재사용할 수 있는 기본 함수들을 제공
 */
export const createAPIService = (domain: string) => {
  const baseURL = `/api/v1/${domain}`;

  return {
    // Basic CRUD operations
    get: <T = any>(endpoint: string, config?: any) => instanceWithAuth.get<T>(`${baseURL}${endpoint}`, config),

    post: <T = any>(endpoint: string, data?: any, config?: any) =>
      instanceWithAuth.post<T>(`${baseURL}${endpoint}`, data, config),

    put: <T = any>(endpoint: string, data?: any, config?: any) =>
      instanceWithAuth.put<T>(`${baseURL}${endpoint}`, data, config),

    patch: <T = any>(endpoint: string, data?: any, config?: any) =>
      instanceWithAuth.patch<T>(`${baseURL}${endpoint}`, data, config),

    delete: <T = any>(endpoint: string, config?: any) => instanceWithAuth.delete<T>(`${baseURL}${endpoint}`, config),

    // Helper for scenario-specific endpoints
    withScenario: (scenarioId: string) => ({
      get: <T = any>(endpoint: string, config?: any) =>
        instanceWithAuth.get<T>(`${baseURL}/${scenarioId}${endpoint}`, config),

      post: <T = any>(endpoint: string, data?: any, config?: any) =>
        instanceWithAuth.post<T>(`${baseURL}/${scenarioId}${endpoint}`, data, config),

      put: <T = any>(endpoint: string, data?: any, config?: any) =>
        instanceWithAuth.put<T>(`${baseURL}/${scenarioId}${endpoint}`, data, config),

      patch: <T = any>(endpoint: string, data?: any, config?: any) =>
        instanceWithAuth.patch<T>(`${baseURL}/${scenarioId}${endpoint}`, data, config),

      delete: <T = any>(endpoint: string, config?: any) =>
        instanceWithAuth.delete<T>(`${baseURL}/${scenarioId}${endpoint}`, config),
    }),
  };
};

export { instanceWithAuth };
