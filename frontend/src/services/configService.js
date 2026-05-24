import axiosClient from './axiosClient';

const configService = {
  getTaxInsuranceConfig: () => {
    return axiosClient.get('/config/tax-insurance');
  },
  updateTaxInsuranceConfig: (data) => {
    return axiosClient.put('/config/tax-insurance', data);
  }
};

export default configService;
