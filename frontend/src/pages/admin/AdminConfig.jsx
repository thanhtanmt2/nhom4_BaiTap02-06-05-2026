import React, { useState, useEffect } from 'react';
import configService from '../../services/configService';

const AdminConfig = () => {
  const [config, setConfig] = useState({
    social_insurance_rate: 8.0,
    health_insurance_rate: 1.5,
    unemployment_insurance_rate: 1.0,
    base_salary: 2340000,
    max_insurance_salary: 46800000,
    personal_deduction: 11000000,
    dependent_deduction: 4400000
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await configService.getTaxInsuranceConfig();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Lỗi lấy cấu hình:', error);
      setMessage({ type: 'error', text: 'Không thể tải cấu hình hiện tại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await configService.updateTaxInsuranceConfig(config);
      setMessage({ type: 'success', text: 'Cập nhật cấu hình thành công!' });
    } catch (error) {
      console.error('Lỗi cập nhật cấu hình:', error);
      setMessage({ type: 'error', text: 'Cập nhật cấu hình thất bại.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải cấu hình...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình Thuế & Bảo hiểm</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý các thông số dùng cho việc tính lương và khấu trừ thuế.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        
        {/* Nhóm tham số Bảo hiểm */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Tỷ lệ đóng bảo hiểm (%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BH Xã hội (BHXH)</label>
              <input
                type="number"
                step="0.1"
                name="social_insurance_rate"
                value={config.social_insurance_rate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BH Y tế (BHYT)</label>
              <input
                type="number"
                step="0.1"
                name="health_insurance_rate"
                value={config.health_insurance_rate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BH Thất nghiệp (BHTN)</label>
              <input
                type="number"
                step="0.1"
                name="unemployment_insurance_rate"
                value={config.unemployment_insurance_rate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Nhóm tham số Mức lương */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Quy định mức lương (VNĐ)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương cơ sở</label>
              <input
                type="number"
                name="base_salary"
                value={config.base_salary}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mức đóng bảo hiểm tối đa</label>
              <input
                type="number"
                name="max_insurance_salary"
                value={config.max_insurance_salary}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Nhóm tham số Thuế TNCN */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Giảm trừ gia cảnh - Thuế TNCN (VNĐ)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trừ bản thân</label>
              <input
                type="number"
                name="personal_deduction"
                value={config.personal_deduction}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trừ người phụ thuộc</label>
              <input
                type="number"
                name="dependent_deduction"
                value={config.dependent_deduction}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors`}
          >
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminConfig;
