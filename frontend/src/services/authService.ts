import axios from 'axios';
import api from './api';

export const authService = {
  /**
   * Swap the one-time code from the Google redirect for real tokens.
   * Uses plain axios so the 401 interceptor in api.ts (refresh + hard
   * redirect to /login) does not fire on an expired code.
   */
  async exchangeCode(code: string): Promise<{ token: string; refreshToken: string }> {
    const response = await axios.post(`${api.defaults.baseURL}/auth/exchange`, { code });
    return response.data;
  },

  async register(data: { username: string; email: string; password: string }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async verifyOtp(data: { email: string; otp: string }) {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  async resendOtp(email: string) {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user; // Backend returns { user: { ... } }
  }
};
