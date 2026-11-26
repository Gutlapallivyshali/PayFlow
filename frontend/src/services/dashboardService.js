import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  },

  getTrends: async (days = 7) => {
    const response = await api.get('/api/dashboard/payment-trends', { params: { days } });
    return response.data;
  },

  getRecent: async () => {
    const response = await api.get('/api/dashboard/recent-payments');
    return response.data;
  }
};
