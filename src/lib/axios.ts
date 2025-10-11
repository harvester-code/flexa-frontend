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
    try {
      const supabase = createClient();

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
    } catch (error) {
      return config; // 토큰 없이 요청 진행
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
instanceWithAuth.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 여기서 토큰 리프레시 또는 로그인 리다이렉트를 할 수 있습니다
    }

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
