import { getUserInfo } from '@/store/zustand';
import axios from 'axios';

export const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getUserInfo().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
