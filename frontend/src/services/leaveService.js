import api from './api';

export const leaveService = {
  applyLeave: async (leaveData) => {
    const response = await api.post('/leaves/apply', leaveData);
    return response.data;
  },

  getMyLeaves: async (params = {}) => {
    const response = await api.get('/leaves/my-leaves', { params });
    return response.data.data;
  },

  getLeaveBalance: async () => {
    const response = await api.get('/leaves/balance');
    return response.data.data.balance;
  },

  approveRejectLeave: async (leaveId, status, comments) => {
    const response = await api.put(`/leaves/${leaveId}/approve`, {
      status,
      comments,
    });
    return response.data;
  },

  approveLeave: async (leaveId, comments = '') => {
    const response = await api.post(`/leaves/${leaveId}/approve`, { comments });
    return response.data;
  },

  rejectLeave: async (leaveId, comments = '') => {
    const response = await api.post(`/leaves/${leaveId}/reject`, { comments });
    return response.data;
  },

  getPendingApprovals: async (params = {}) => {
    const response = await api.get('/leaves/pending-approvals', { params });
    return response.data.data.leaves || [];
  },
};
