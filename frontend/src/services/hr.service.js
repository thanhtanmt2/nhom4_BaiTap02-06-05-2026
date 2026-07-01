import axiosClient from './axiosClient';

const hrService = {
  // [GET] Lấy tất cả hợp đồng trong hệ thống (có thể filter theo search)
  getAllContracts: (search = '') => {
    return axiosClient.get('/hr/contracts', { params: search ? { search } : {} });
  },

  // [GET] Lấy danh sách hợp đồng của một nhân viên
  getEmployeeContracts: (userId) => {
    return axiosClient.get(`/hr/contracts/${userId}`);
  },

  // [GET] Lấy danh sách tất cả nhân viên
  getAllEmployees: () => {
    return axiosClient.get('/hr/employees');
  },

  // [POST] Tạo hợp đồng mới (thử việc hoặc chính thức)
  createContract: (contractData) => {
    // contractData bao gồm: user_id, contract_number, contract_type, start_date, end_date, basic_salary
    return axiosClient.post('/hr/contracts', contractData);
  },

  // [PUT] Cập nhật, gia hạn hợp đồng (ví dụ: chuyển từ thử việc sang chính thức, đổi mức lương)
  extendContract: (contractId, updateData) => {
    return axiosClient.put(`/hr/contracts/${contractId}`, updateData);
  },

  // [DELETE] Xóa hợp đồng
  deleteContract: (contractId) => {
    return axiosClient.delete(`/hr/contracts/${contractId}`);
  },

  // ---- Yêu cầu cấp tài khoản ----
  createAccountRequest: (data) => {
    return axiosClient.post('/hr/account-requests', data);
  },
  
  getMyAccountRequests: () => {
    return axiosClient.get('/hr/account-requests/my');
  }
};

export default hrService;
