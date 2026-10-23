import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to inject JWT token into outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('legal_hub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('legal_hub_token');
      localStorage.removeItem('legal_hub_user');
      window.dispatchEvent(new Event('auth_unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
