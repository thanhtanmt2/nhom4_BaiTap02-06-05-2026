import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UserPlus, X } from 'lucide-react';
import axios from 'axios';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Callout from '../../components/ui/Callout';

const BACKEND_URL = 'http://localhost:3000';

const PIPELINE_STAGES = [
  { label: 'Mới nộp',           key: 'new',       color: 'bg-navy-700' },
  { label: 'Sàng lọc CV',       key: 'screening', color: 'bg-navy-600' },
  { label: 'Phỏng vấn vòng 1',  key: 'pv1',       color: 'bg-navy-500' },
  { label: 'Phỏng vấn V2 / Test', key: 'pv2',     color: 'bg-navy-300' },
  { label: 'Offer',             key: 'offer',      color: 'bg-accent-500' },
];


const HRDashboard = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'employee', department_id: '' });
  const [activeEventTab, setActiveEventTab] = useState('anniversary');
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [dashboardInterviews, setDashboardInterviews] = useState([]);
  const [stats, setStats] = useState({ totalEmployees: 0, newEmployeesThisMonth: 0, expiringContracts: 0, totalPipeline: 0 });
  const [pipelineData, setPipelineData] = useState([0, 0, 0, 0, 0]);

  const fetchData = async () => {
    try {
      const [reqRes, depRes, dashRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/hr/account-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/admin/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BACKEND_URL}/api/hr/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reqRes.data.success) setRequests(reqRes.data.data);
      if (depRes.data.success) setDepartments(depRes.data.data.filter((d) => d.status === 'active'));
      if (dashRes.data.success) {
        setDashboardEvents(dashRes.data.data.events || []);
        setDashboardInterviews(dashRes.data.data.interviews || []);
        if (dashRes.data.data.stats) setStats(dashRes.data.data.stats);
        if (dashRes.data.data.pipelineData) setPipelineData(dashRes.data.data.pipelineData);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/hr/account-requests`,
        { ...formData, department_id: formData.department_id || null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        setShowModal(false);
        setFormData({ email: '', full_name: '', role: 'employee', department_id: '' });
        fetchData();
        alert('Đã gửi yêu cầu tạo tài khoản thành công!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const maxPipeline = Math.max(...pipelineData, 1);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Dashboard HR</h1>
          <p className="text-sm text-gray-500 mt-0.75">Tổng quan nhân sự & tuyển dụng · cập nhật real-time</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none">
            <option>Tháng này</option>
            <option>Quý này</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors active:scale-[.98]"
          >
            <UserPlus size={15} strokeWidth={2} />
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Callout nếu có HĐ sắp hết hạn */}
      {pending.length > 0 && (
        <Callout variant="warning">
          <strong>{pending.length} yêu cầu tạo tài khoản</strong> đang chờ Admin phê duyệt.
        </Callout>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Tổng nhân viên" value={stats.totalEmployees.toString()} trend={`+${stats.newEmployeesThisMonth}`} trendUp trendLabel="tháng này" />
        <StatCard label="Tuyển mới tháng" value={stats.newEmployeesThisMonth.toString()} trend="+0%" trendUp trendLabel="vs. tháng trước" accentValue />
        <StatCard label="HĐ sắp hết hạn (60 ngày)" value={stats.expiringContracts.toString()} />
        <StatCard label="Ứng viên trong pipeline" value={stats.totalPipeline.toString()} trendLabel="Tất cả vị trí đang mở" />
      </div>

      {/* 2 col: pipeline + events */}
      <div className="grid grid-cols-7 gap-4">
        {/* Pipeline tuyển dụng */}
        <div className="col-span-4 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-gray-900">Pipeline tuyển dụng</h2>
            <select className="h-7 px-2.5 text-[12px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none">
              <option>Tất cả vị trí</option>
            </select>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const count = pipelineData[i];
              const pct = pipelineData[0] > 0 ? Math.round((count / pipelineData[0]) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-gray-700">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      {i > 0 && (
                        <span className="text-[11px] text-gray-400">{pct}% ↓</span>
                      )}
                      <span className="text-[13px] font-mono tabular-nums font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color}`}
                      style={{ width: `${(count / maxPipeline) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/hr/recruitment')}
            className="mt-5 text-[13px] font-medium text-accent-600 hover:underline"
          >
            Mở pipeline đầy đủ →
          </button>
        </div>

        {/* Sự kiện tuần này */}
        <div className="col-span-3 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Sự kiện tuần này</h2>
            <Badge variant="accent">{dashboardEvents.length} sự kiện</Badge>
          </div>
          {/* Tabs pill */}
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md w-fit mb-4">
            {[{ key: 'anniversary', label: `Kỷ niệm (${dashboardEvents.length})` }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveEventTab(tab.key)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-sm transition-colors ${
                  activeEventTab === tab.key ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {dashboardEvents.length > 0 ? dashboardEvents.map((person) => (
              <div key={person.name} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <Avatar name={person.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">{person.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{person.date}</p>
                </div>
                <Badge variant="neutral" size="sm">
                  {person.daysLeft === 0 ? 'Hôm nay' : `Còn ${person.daysLeft} ngày`}
                </Badge>
              </div>
            )) : (
              <div className="text-center py-4 text-[13px] text-gray-400">Không có sự kiện nào tuần này.</div>
            )}
          </div>
          <button className="mt-4 w-full h-8 text-[13px] text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            Gửi lời chúc tự động
          </button>
        </div>
      </div>

      {/* Phỏng vấn hôm nay + requests table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-gray-900">Phỏng vấn hôm nay</h2>
            <Badge variant="brand">{dashboardInterviews.length} lịch</Badge>
          </div>
          <button onClick={() => navigate('/hr/interviews')} className="text-[13px] text-accent-600 hover:underline">
            Xem lịch tuần →
          </button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Giờ', 'Ứng viên', 'Vòng', 'Người phỏng vấn', 'Hình thức'].map((col) => (
                <th key={col} className="h-11 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-400">Đang tải...</td></tr>
            ) : dashboardInterviews.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-400">Không có lịch phỏng vấn nào hôm nay.</td></tr>
            ) : (
              dashboardInterviews.map((row, idx) => (
                <tr key={idx} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 font-mono tabular-nums text-[13px] text-gray-700">{row.time}</td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={row.name} size="sm" />
                      <span className="text-[13px] font-medium text-gray-700">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4"><Badge variant="brand">{row.round}</Badge></td>
                  <td className="px-4 text-[13px] text-gray-700">{row.interviewer}</td>
                  <td className="px-4"><Badge variant={row.mode === 'Online' ? 'info' : 'neutral'}>{row.mode}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal tạo yêu cầu */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,.5)]">
          <div
            className="bg-white w-full max-w-140 rounded-xl shadow-xl overflow-hidden"
            style={{ animation: 'modalIn 200ms cubic-bezier(0.16,1,0.3,1)' }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h3 className="text-[17px] font-semibold text-gray-900">Tạo yêu cầu cấp tài khoản</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Họ & tên <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text" required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:outline-none focus:border-navy-600"
                  placeholder="Nguyễn Văn An"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Email <span className="text-danger-600">*</span>
                </label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:outline-none focus:border-navy-600"
                  placeholder="nva@congty.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-10 px-3 text-[14px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-600"
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="manager">Quản lý</option>
                    <option value="accountant">Kế toán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Phòng ban</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full h-10 px-3 text-[14px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-600"
                  >
                    <option value="">-- Tùy chọn --</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 text-[14px] font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 text-[14px] font-semibold bg-navy-700 hover:bg-navy-800 text-white rounded-md transition-colors"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default HRDashboard;
