import axios from 'axios';
import { createClient } from '@/lib/auth/client';

const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

// Supabase 클라이언트 싱글톤 (매 요청마다 새로 생성하지 않음)
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
      try {
        const supabase = getSupabaseClient();
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          // 리프레시 실패 시 로그인 페이지로 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } else if (error.config && !error.config._retry) {
          // 리프레시 성공 시 원래 요청 재시도 (1회만)
          error.config._retry = true;
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
