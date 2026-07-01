import axiosClient from './axiosClient';

export const recruitmentService = {
  // Lấy toàn bộ ứng viên, nhóm theo stage
  getBoard: (params) =>
    axiosClient.get('/recruitment/candidates', { params }).then((r) => r.data),

  // Thống kê
  getStats: () =>
    axiosClient.get('/recruitment/stats').then((r) => r.data),

  // Danh sách vị trí đang tuyển
  getPositions: () =>
    axiosClient.get('/recruitment/positions').then((r) => r.data),

  // Tạo ứng viên mới
  createCandidate: (data) =>
    axiosClient.post('/recruitment/candidates', data).then((r) => r.data),

  // Cập nhật thông tin
  updateCandidate: (id, data) =>
    axiosClient.put(`/recruitment/candidates/${id}`, data).then((r) => r.data),

  // Di chuyển stage (drag-drop)
  moveStage: (id, stage) =>
    axiosClient.put(`/recruitment/candidates/${id}/stage`, { stage }).then((r) => r.data),

  // Xoá ứng viên
  deleteCandidate: (id) =>
    axiosClient.delete(`/recruitment/candidates/${id}`).then((r) => r.data),

  // 🤖 AI: Phân tích CV và chấm điểm Match Score
  analyzeCV: (id, file) => {
    const formData = new FormData();
    if (file) {
      formData.append('cv', file);
    }
    return axiosClient.post(`/recruitment/candidates/${id}/analyze-cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
