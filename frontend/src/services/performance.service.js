import axiosClient from './axiosClient';

const getDashboardData = (userId = '', params = {}) => {
  const url = userId ? `/performance/dashboard/${userId}` : `/performance/dashboard`;
  return axiosClient.get(url, { params });
};

const submitReview = (data) => {
  return axiosClient.post(`/performance/reviews`, data);
};

const getPromotions = () => {
  return axiosClient.get(`/performance/promotions`);
};

const createPromotion = (data) => {
  return axiosClient.post(`/performance/promotions`, data);
};

const updatePromotionStatus = (id, status) => {
  return axiosClient.patch(`/performance/promotions/${id}/status`, { status });
};

const getAllEmployees = (params = {}) => {
  return axiosClient.get(`/performance/employees`, { params });
};

export default {
  getDashboardData,
  submitReview,
  getPromotions,
  createPromotion,
  updatePromotionStatus,
  getAllEmployees
};
