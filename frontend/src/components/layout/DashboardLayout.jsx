import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HelpCircle, Bell, ChevronDown } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import Sidebar from './Sidebar';
import Avatar from '../ui/Avatar';

const PATH_LABELS = {
  'admin/dashboard': ['Admin', 'Dashboard'],
  'admin/users': ['Admin', 'Tài khoản'],
  'admin/departments': ['Admin', 'Phòng ban'],
  'admin/tasks': ['Admin', 'Giao việc'],
  'admin/recruitment': ['Admin', 'Tuyển dụng'],
  'admin/job-postings': ['Admin', 'Tin tuyển dụng'],
  'admin/config': ['Admin', 'Cấu hình'],
  'admin/profile': ['Admin', 'Hồ sơ'],
  'admin/activity-logs': ['Admin', 'Nhật ký hệ thống'],
  'hr/dashboard': ['HR', 'Dashboard'],
  'hr/employees': ['HR', 'Hồ sơ nhân viên'],
  'hr/contracts': ['HR', 'Hợp đồng'],
  'hr/recruitment': ['HR', 'Tuyển dụng'],
  'hr/job-postings': ['HR', 'Tin tuyển dụng'],
  'hr/interviews': ['HR', 'Lịch phỏng vấn'],
  'hr/reports': ['HR', 'Báo cáo chấm công'],
  'hr/promotions': ['HR', 'Đề xuất thăng chức'],
  'hr/evaluation': ['HR', 'Đánh giá KPI'],
  'manager/dashboard': ['Manager', 'Dashboard'],
  'manager/leave-approvals': ['Manager', 'Đơn chờ duyệt'],
  'manager/approval-history': ['Manager', 'Lịch sử phê duyệt'],
  'manager/tasks': ['Manager', 'Task team'],
  'manager/team-schedule': ['Manager', 'Lịch team'],
  'manager/kpi': ['Manager', 'Đánh giá KPI'],
  'manager/evaluation': ['Manager', 'Đánh giá KPI'],
  'manager/promotions': ['Manager', 'Đề xuất thăng chức'],
  'accountant/dashboard': ['Kế toán', 'Dashboard'],
  'accountant/payroll': ['Kế toán', 'Tính lương tháng'],
  'accountant/payroll-send': ['Kế toán', 'Gửi phiếu lương'],
  'accountant/tax-config': ['Kế toán', 'Cấu hình thuế'],
  'accountant/adjustments': ['Kế toán', 'Khoản thu nhập'],
  'accountant/advances': ['Kế toán', 'Tạm ứng'],
  'user/today': ['Cá nhân', 'Hôm nay'],
  'user/profile': ['Cá nhân', 'Hồ sơ tôi'],
  'user/attendance': ['Cá nhân', 'Chấm công'],
  'user/leaves': ['Cá nhân', 'Đơn từ'],
  'user/payslip': ['Cá nhân', 'Phiếu lương'],
  'user/tasks': ['Cá nhân', 'Task của tôi'],
  'user/performance': ['Cá nhân', 'Hiệu quả làm việc'],
};

function buildBreadcrumb(pathname) {
  const stripped = pathname.replace(/^\/preview\//, '/').replace(/^\//, '');
  if (PATH_LABELS[stripped]) return PATH_LABELS[stripped];
  const parts = stripped.split('/');
  return [parts[0] || '', parts[1] || ''];
}

const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);

  const breadcrumb = buildBreadcrumb(location.pathname);
  const displayName = user?.name || user?.email || 'Người dùng';

  // Fetch unread count khi mount để hiện red dot ngay
  useEffect(() => {
    axiosClient.get('/profile/activity?limit=1')
      .then((res) => {
        const payload = res.data.data || {};
        setUnreadCount(payload.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    setLoadingNotif(true);
    axiosClient.get('/profile/activity?limit=10')
      .then((res) => {
        const payload = res.data.data || {};
        setLogs(payload.logs || []);
        setUnreadCount(payload.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingNotif(false));
  }, [notifOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--gray-50)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 gap-4 shrink-0 sticky top-0 z-30">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {breadcrumb.map((seg, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {seg}
                </span>
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors">
              <HelpCircle size={18} strokeWidth={1.75} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-8 h-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-600" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-navy-600 hover:underline"
                        onClick={async () => {
                          await axiosClient.post('/profile/activity/read').catch(() => {});
                          setUnreadCount(0);
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {loadingNotif && (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">Đang tải...</p>
                    )}
                    {!loadingNotif && logs.length === 0 && (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">Chưa có thông báo</p>
                    )}
                    {logs.map((item) => (
                      <div key={item.id} className={`px-4 py-3 ${!item.is_read ? 'bg-navy-50' : ''}`}>
                        <p className="text-[13px] text-gray-700">{item.detail || item.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-8 py-6 pb-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
