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
};
