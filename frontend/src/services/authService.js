import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('payflow_token', response.data.token);
      localStorage.setItem('payflow_user', JSON.stringify({
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      }));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.data && response.data.token) {
      localStorage.setItem('payflow_token', response.data.token);
      localStorage.setItem('payflow_user', JSON.stringify({
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      }));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('payflow_token');
    localStorage.removeItem('payflow_user');
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('payflow_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('payflow_token');
  }
};
