import apiClient from './api';

export const authService = {
  register: async (email, password, fullName) => {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      fullName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (updates) => {
    const response = await apiClient.put('/api/auth/profile', updates);
    return response.data;
  },

  connectAvito: async (avitoToken) => {
    const response = await apiClient.post('/api/auth/avito-connect', {
      avitoToken,
    });
    return response.data;
  },
};
