import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Assuming v1 based on backend routes
  headers: {
    // 'Content-Type': 'application/json', // Removed to allow axios to set correct content-type for FormData
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
