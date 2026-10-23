import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    localStorage.setItem('legal_hub_token', res.data.access_token);
    localStorage.setItem('legal_hub_user', JSON.stringify(res.data.user));
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('legal_hub_token', res.data.access_token);
    localStorage.setItem('legal_hub_user', JSON.stringify(res.data.user));
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    localStorage.setItem('legal_hub_user', JSON.stringify(res.data));
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('legal_hub_token');
    localStorage.removeItem('legal_hub_user');
  },

  getToken(): string | null {
    return localStorage.getItem('legal_hub_token');
  },

  getUser(): User | null {
    const saved = localStorage.getItem('legal_hub_user');
    return saved ? JSON.parse(saved) : null;
  }
};
