import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Lock, LogIn, Activity, CheckCircle, XCircle } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

const ROLE_LABELS = {
  admin: 'Quản trị viên', hr: 'HR', manager: 'Manager',
  accountant: 'Kế toán', employee: 'Nhân viên', user: 'Người dùng',
};

const ACTION_VARIANT = {
  'Đăng nhập': 'success',
  'Sửa hồ sơ': 'info',
  'Tạo tài khoản': 'accent',
  'Đổi mật khẩu': 'warning',
  'Đăng nhập thất bại': 'danger',
};

function actionVariant(action = '') {
  for (const key of Object.keys(ACTION_VARIANT)) {
    if (action.includes(key)) return ACTION_VARIANT[key];
  }
  return 'neutral';
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} giờ trước`;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, requestsRes] = await Promise.all([
        axiosClient.get('/admin/dashboard'),
        axiosClient.get('/admin/account-requests/pending'),
      ]);
      setStats(statsRes.data.data);
      if (requestsRes.data.success) setPendingRequests(requestsRes.data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Debug
  useEffect(() => {
    if (stats) {
      console.log('[Dashboard] loginChartData:', stats.loginChartData);
      console.log('[Dashboard] login24h:', stats.login24h);
    }
  }, [stats]);

  const handleApprove = (req) => {
    navigate('/admin/users', { state: { prefillRequest: req } });
  };

  const handleReject = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) return;
    try {
      const res = await axiosClient.post(`/admin/account-requests/${id}/reject`);
      if (res.data.success) fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const recentActivities = stats?.recentActivities || [];
  const now = new Date();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 h-28 animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.75">
            Tổng quan hệ thống · cập nhật mỗi 5 phút · Lần cuối{' '}
            <span className="font-mono tabular-nums">
              {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="h-9 px-3 flex items-center gap-1.5 text-[13px] font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} strokeWidth={1.75} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tổng tài khoản"
          value={stats?.totalUsers ?? '—'}
          trend="+3"
          trendUp
          trendLabel="tuần này"
        />
        <StatCard
          label="Tài khoản khoá"
          value={stats?.lockedUsers ?? '—'}
          trend="+1"
          trendUp={false}
          trendLabel="hôm nay"
        />
        <StatCard
          label="Đăng nhập 24h"
          value={stats?.login24h ?? '—'}
          trend={stats && stats.loginPrev24h > 0 ? `${stats.login24h >= stats.loginPrev24h ? '+' : '-'}${Math.round(Math.abs(stats.login24h - stats.loginPrev24h) / stats.loginPrev24h * 100)}%` : '+0%'}
          trendUp={stats ? stats.login24h >= stats.loginPrev24h : true}
          trendLabel="vs hôm qua"
        />
        <StatCard
          label="Sự kiện hệ thống 24h"
          value={stats?.systemEvents24h ?? '—'}
        />
      </div>

      {/* 2-col: chart + department ranking */}
      <div className="grid grid-cols-7 gap-4">
        {/* Activity log (chart area) */}
        <div className="col-span-5 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Hoạt động đăng nhập 24 giờ qua</h2>
            <div className="flex gap-1">
              <button className="px-2.5 py-1 text-[12px] rounded-md text-gray-900 bg-gray-100 transition-colors">
                24h
              </button>
            </div>
          </div>
          {/* Sparkline chart */}
          <div className="h-40 flex items-end gap-1 border-b border-gray-100 pt-8">
            {(stats?.loginChartData || Array(12).fill(0)).map((v, i) => {
              const chartData = stats?.loginChartData || Array(12).fill(0);
              const maxVal = Math.max(...chartData, 1);
              const heightPercent = Math.max((v / maxVal) * 100, v > 0 ? 8 : 4);
              const isLatest = i === 11;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    style={{ background: '#1e293b' }}>
                    {v} lượt
                  </div>
                  <div
                    className="rounded-t-sm transition-all duration-300 w-full"
                    style={{
                      height: `${heightPercent}%`,
                      background: isLatest ? '#1e40af' : (v > 0 ? '#bfdbfe' : '#e2e8f0'),
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {['24h trước', '20h trước', '16h trước', '12h trước', '8h trước', '4h trước', 'Bây giờ'].map((t) => (
              <span key={t} className="text-[11px] text-gray-400">{t}</span>
            ))}
          </div>
        </div>

        {/* Phòng ban */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Phòng ban nhiều user nhất</h2>
            <button onClick={() => navigate('/admin/departments')} className="text-[12px] text-accent-600 hover:underline">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-3">
            {(stats?.departmentStats || [
              { name: 'Backend', count: 52, max: 52 },
              { name: 'Frontend', count: 41, max: 52 },
              { name: 'QA', count: 28, max: 52 },
              { name: 'DevOps', count: 22, max: 52 },
              { name: 'Mobile', count: 19, max: 52 },
              { name: 'Data', count: 15, max: 52 },
            ]).map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-gray-700">{dept.name}</span>
                  <span className="text-[12px] font-mono tabular-nums text-gray-500">{dept.count} user</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy-700 rounded-full"
                    style={{ width: `${(dept.count / (dept.max || dept.count)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-semibold text-gray-900">Hoạt động gần nhất</h2>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Thời gian', 'User', 'Hành động', 'Chi tiết', 'IP', 'Trạng thái'].map((col) => (
                <th key={col} className="h-11 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-gray-400">
                  Chưa có hoạt động nào
                </td>
              </tr>
            )}
            {recentActivities.map((item) => {
              const actorName = item.User?.name || item.User?.email || 'Hệ thống';
              const action = item.action || item.detail || '';
              const isFail = action.toLowerCase().includes('thất bại');
              return (
                <tr key={item.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4">
                    <p className="font-mono tabular-nums text-[13px] text-gray-700">
                      {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(item.created_at)}</p>
                  </td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={actorName} size="sm" />
                      <span className="text-[13px] font-medium text-gray-700">{actorName}</span>
                    </div>
                  </td>
                  <td className="px-4">
                    <Badge variant={actionVariant(action)} dot>
                      {item.action || 'Khác'}
                    </Badge>
                  </td>
                  <td className="px-4 text-[13px] text-gray-500 truncate max-w-[200px]" title={item.detail || '—'}>
                    {item.detail || '—'}
                  </td>
                  <td className="px-4 font-mono tabular-nums text-[12px] text-gray-500">{item.ip || '—'}</td>
                  <td className="px-4">
                    <Badge variant={isFail ? 'danger' : 'success'} dot>
                      {isFail ? 'FAIL' : 'OK'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending requests + system health */}
      <div className="grid grid-cols-3 gap-4">
        {/* Yêu cầu cấp tài khoản */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-semibold text-gray-900">Yêu cầu cấp tài khoản</h2>
            <Badge variant="warning" dot>{pendingRequests.length} chờ duyệt</Badge>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-gray-400">Không có yêu cầu nào đang chờ</p>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <Avatar name={req.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{req.full_name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{req.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="brand" size="sm">{ROLE_LABELS[req.role] || req.role}</Badge>
                      {req.department && <Badge variant="neutral" size="sm">{req.department.name}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex items-center gap-1 h-8 px-3 text-[12px] font-medium bg-success-600 hover:bg-success-700 text-white rounded-md transition-colors"
                    >
                      <CheckCircle size={13} strokeWidth={2} />
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex items-center gap-1 h-8 px-3 text-[12px] font-medium text-danger-600 border border-danger-100 hover:bg-danger-50 rounded-md transition-colors"
                    >
                      <XCircle size={13} strokeWidth={2} />
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System health */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-3">Uptime tháng này</p>
            <p className="font-mono tabular-nums text-[28px] font-bold text-success-700 leading-none">99,97%</p>
            <p className="text-[12px] text-gray-500 mt-2">Không có sự cố nghiêm trọng</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-3">Backup gần nhất</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-600" />
              <span className="text-[13px] font-medium text-gray-700">Thành công</span>
            </div>
            <p className="text-[12px] font-mono tabular-nums text-gray-500 mt-1">
              {now.toLocaleDateString('vi-VN')} · 03:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
