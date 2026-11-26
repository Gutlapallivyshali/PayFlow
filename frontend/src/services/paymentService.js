import api from './api';

export const paymentService = {
  create: async (data, idempotencyKey) => {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await api.post('/api/payments', data, { headers });
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/api/payments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  },

  getDetail: async (id) => {
    const response = await api.get(`/api/payments/${id}/detail`);
    return response.data;
  },

  retry: async (id) => {
    const response = await api.post(`/api/payments/${id}/retry`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/api/payments/${id}/cancel`);
    return response.data;
  },

  getHistory: async (id) => {
    const response = await api.get(`/api/payments/${id}/history`);
    return response.data;
  }
};
