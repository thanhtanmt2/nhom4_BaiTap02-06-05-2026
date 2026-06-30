import axiosClient from './axiosClient';

// Lấy stats tổng quan (số đơn theo trạng thái, tổng tiền tháng)
export const getAdvanceStats = () =>
  axiosClient.get('/advances/stats');

// Lấy danh sách đơn theo trạng thái
// params: { status, search }
export const getAdvances = (params = {}) =>
  axiosClient.get('/advances', { params });

// Lấy chi tiết 1 đơn
export const getAdvanceById = (id) =>
  axiosClient.get(`/advances/${id}`);

// Lấy danh sách nhân viên để tạo đơn hộ
export const getAdvanceEmployees = () =>
  axiosClient.get('/advances/employees');

// Tạo đơn mới (kế toán tạo hộ hoặc nhân viên tự nộp)
// body: { user_id, amount, reason, urgent, monthly_salary }
export const createAdvance = (data) =>
  axiosClient.post('/advances', data);

// Duyệt đơn
// body: { disburse_date, deduct_method, deduct_months }
export const approveAdvance = (id, data) =>
  axiosClient.post(`/advances/${id}/approve`, data);

// Từ chối đơn
// body: { reject_reason }
export const rejectAdvance = (id, data) =>
  axiosClient.post(`/advances/${id}/reject`, data);

// Đánh dấu đã chi tiền
export const disburseAdvance = (id) =>
  axiosClient.post(`/advances/${id}/disburse`);

// Nhân viên tự tạo đơn
export const requestAdvance = (data) =>
  axiosClient.post('/advances/request', data);

// Nhân viên xem danh sách đơn của mình
export const getMyAdvances = () =>
  axiosClient.get('/advances/my-requests');
