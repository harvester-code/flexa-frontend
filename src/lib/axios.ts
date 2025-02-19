import axios from 'axios';

export const baseURL = process.env.NEXT_PUBLIC_FAST_API_URL_V1;

const api = axios.create({
    baseURL,
});

export default api;