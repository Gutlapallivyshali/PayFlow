import api from './api';

export const customerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/customers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/customers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/customers/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/customers/${id}/status`, { status });
    return response.data;
  },

  getPayments: async (id, params = {}) => {
    const response = await api.get(`/api/customers/${id}/payments`, { params });
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/api/customers/${id}`);
    return response.data;
  }
};
