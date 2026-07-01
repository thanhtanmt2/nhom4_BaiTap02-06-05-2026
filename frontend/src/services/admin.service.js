import axiosClient from './axiosClient';

export const adminService = {
  getUsers: async (params) => {
    const response = await axiosClient.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await axiosClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await axiosClient.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axiosClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  updateUserDepartment: async (userId, departmentId) => {
    const response = await axiosClient.put(`/admin/users/${userId}/department`, { department_id: departmentId });
    return response.data;
  },

  createUser: async (data) => {
    const response = await axiosClient.post('/admin/users', data);
    return response.data;
  },

  resetUserPassword: async (userId) => {
    const response = await axiosClient.put(`/admin/users/${userId}/reset-password`);
    return response.data;
  },

  getActivityLogs: async (params) => {
    const response = await axiosClient.get('/admin/activity-logs', { params });
    return response.data;
  },

  // ---- Department APIs ----
  getDepartments: async (params) => {
    const response = await axiosClient.get('/admin/departments', { params });
    return response.data;
  },

  createDepartment: async (data) => {
    const response = await axiosClient.post('/admin/departments', data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await axiosClient.put(`/admin/departments/${id}`, data);
    return response.data;
  },

  updateDepartmentStatus: async (id, status) => {
    const response = await axiosClient.put(`/admin/departments/${id}/status`, { status });
    return response.data;
  },

  // ---- Account Requests APIs ----
  getPendingAccountRequests: async () => {
    const response = await axiosClient.get('/admin/account-requests/pending');
    return response.data;
  },

  approveAccountRequest: async (id) => {
    const response = await axiosClient.put(`/admin/account-requests/${id}/approve`);
    return response.data;
  },

  rejectAccountRequest: async (id) => {
    const response = await axiosClient.put(`/admin/account-requests/${id}/reject`);
    return response.data;
  },
};
