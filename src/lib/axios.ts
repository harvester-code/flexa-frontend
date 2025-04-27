import axios from 'axios';
import { createClient } from '@/utils/supabase/browser';

export const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

const instanceWithAuth = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

let _token: string = '';

instanceWithAuth.interceptors.request.use(
  async (config) => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (token) {
      _token = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getLastAccessToken = () => _token;

export { instanceWithAuth, getLastAccessToken };
