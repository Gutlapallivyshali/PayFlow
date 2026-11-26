import api from './api';

export const gatewayService = {
  getConfig: async () => {
    const response = await api.get('/api/gateway/config');
    return response.data;
  },

  toggleFailure: async (enabled) => {
    const params = enabled !== undefined ? { enabled } : {};
    const response = await api.post('/api/gateway/config/toggle-failure', null, { params });
    return response.data;
  }
};
