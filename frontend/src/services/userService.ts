import api from './api';

export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(data: { username?: string; email?: string }) {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    const response = await api.put('/users/change-password', data);
    return response.data;
  }
};
