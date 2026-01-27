import api from './api';

export const authService = {
  async register(data: any) {
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

  async login(data: any) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user; // Backend returns { user: { ... } }
  }
};
