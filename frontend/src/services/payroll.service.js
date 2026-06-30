import axiosClient from './axiosClient';

const payrollService = {
  getPayrolls: (month) => {
    return axiosClient.get('/payrolls', { params: { month } });
  },
  calculatePayroll: (month) => {
    return axiosClient.post('/payrolls/calculate', { month });
  },
  getMyPayrolls: () => {
    return axiosClient.get('/payrolls/my-payrolls');
  },
  approvePayroll: (month) => {
    return axiosClient.put('/payrolls/approve', { month });
  },
  payPayroll: (month) => {
    return axiosClient.put('/payrolls/pay', { month });
  },
};

export default payrollService;
