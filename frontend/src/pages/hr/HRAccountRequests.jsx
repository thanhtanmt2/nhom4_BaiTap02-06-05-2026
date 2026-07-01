import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import hrService from '../../services/hr.service';
import { adminService } from '../../services/admin.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const HRAccountRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'employee',
    department_id: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await hrService.getMyAccountRequests();
      if (res.data?.success) setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await adminService.getDepartments();
      if (res.success) setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null
      };
      await hrService.createAccountRequest(payload);
      setMessage({ text: 'Gửi yêu cầu thành công!', type: 'success' });
      setShowModal(false);
      setFormData({ full_name: '', email: '', role: 'employee', department_id: '' });
      fetchRequests();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Có lỗi xảy ra', 
        type: 'error' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" className="flex items-center gap-1"><Clock size={12}/> Chờ duyệt</Badge>;
      case 'approved': return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 size={12}/> Đã duyệt</Badge>;
      case 'rejected': return <Badge variant="danger" className="flex items-center gap-1"><XCircle size={12}/> Bị từ chối</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Yêu cầu cấp tài khoản</h1>
          <p className="text-[13px] text-gray-500 mt-1">Danh sách các yêu cầu cấp tài khoản nhân viên mới bạn đã gửi cho Admin</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-navy-600 hover:bg-navy-700 text-white text-[13px] font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} /> Tạo yêu cầu mới
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-[13px] border-l-4 ${message.type === 'success' ? 'bg-success-50 text-success-700 border-success-500' : 'bg-danger-50 text-danger-700 border-danger-500'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-[13px]">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Nhân viên</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Chức vụ & Phòng ban</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Thời gian tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-[13px] text-gray-500">Chưa có yêu cầu nào.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={req.full_name} size="sm" />
                        <div>
                          <p className="text-[13px] font-medium text-gray-900">{req.full_name}</p>
                          <p className="text-[12px] text-gray-500">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-medium text-gray-900 capitalize">{req.role}</p>
                      <p className="text-[12px] text-gray-500">Phòng ban ID: {req.department_id || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">
                      {new Date(req.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-[16px] font-semibold text-gray-900">Tạo yêu cầu cấp tài khoản</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Họ và tên <span className="text-danger-500">*</span></label>
                <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                  className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-100 focus:border-navy-600 transition-colors"
                  placeholder="Nguyễn Văn A" />
              </div>
              
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Email <span className="text-danger-500">*</span></label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-100 focus:border-navy-600 transition-colors"
                  placeholder="nguyenvana@example.com" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Vai trò đề xuất</label>
                <select name="role" value={formData.role} onChange={handleChange}
                  className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-100 focus:border-navy-600 transition-colors">
                  <option value="employee">Nhân viên (Employee)</option>
                  <option value="manager">Quản lý (Manager)</option>
                  <option value="accountant">Kế toán (Accountant)</option>
                  <option value="hr">Nhân sự (HR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">Phòng ban đề xuất</label>
                <select name="department_id" value={formData.department_id} onChange={handleChange}
                  className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-100 focus:border-navy-600 transition-colors">
                  <option value="">-- Không chọn --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 h-10 px-4 border border-gray-200 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={submitLoading}
                  className="flex-1 h-10 px-4 bg-navy-600 hover:bg-navy-700 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-70">
                  {submitLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAccountRequests;
