import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, Building2, ClipboardList, UserSearch, Settings,
  UserCircle, FileText, CheckSquare, BarChart2, CalendarDays, LogOut,
  Home, Clock, Wallet, Star, TrendingUp, PlusCircle, List, Banknote
} from 'lucide-react';
import { logout } from '../../redux/authSlice';
import Avatar from '../ui/Avatar';

const NAV_CONFIG = {
  admin: {
    roleLabel: 'Admin',
    sections: [
      {
        title: 'Tổng quan',
        items: [
          { label: 'Dashboard',          path: '/admin/dashboard',   icon: LayoutDashboard },
        ],
      },
      {
        title: 'Quản lý',
        items: [
          { label: 'Tài khoản',          path: '/admin/users',        icon: Users },
          { label: 'Phòng ban',          path: '/admin/departments',  icon: Building2 },
          { label: 'Nhật ký hệ thống',   path: '/admin/activity-logs', icon: List },
          { label: 'Cấu hình',           path: '/admin/config',       icon: Settings },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Hồ sơ tôi',          path: '/admin/profile',      icon: UserCircle },
        ],
      },
    ],
  },
  hr: {
    roleLabel: 'HR',
    sections: [
      {
        title: 'Tổng quan',
        items: [
          { label: 'Dashboard HR',       path: '/hr/dashboard',       icon: LayoutDashboard },
        ],
      },
      {
        title: 'Nhân sự',
        items: [
          { label: 'Hồ sơ nhân viên',    path: '/hr/employees',       icon: Users },
          { label: 'Hợp đồng lao động',  path: '/hr/contracts',       icon: FileText },
          { label: 'Đề xuất thăng tiến', path: '/hr/promotions',      icon: TrendingUp },
        ],
      },
      {
        title: 'Tuyển dụng',
        items: [
          { label: 'Ứng viên',           path: '/hr/recruitment',     icon: UserSearch },
          { label: 'Lịch phỏng vấn',     path: '/hr/interviews',      icon: CalendarDays },
          { label: 'Báo cáo chấm công',  path: '/hr/reports',         icon: BarChart2 },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Chấm công',          path: '/user/attendance',    icon: Clock },
          { label: 'Hồ sơ tôi',          path: '/user/profile',       icon: UserCircle },
          { label: 'Đơn của tôi',        path: '/user/leaves',        icon: ClipboardList },
          { label: 'Ứng lương',          path: '/user/advances',      icon: Banknote },
        ],
      },
    ],
  },
  manager: {
    roleLabel: 'Manager',
    sections: [
      {
        title: 'Tổng quan',
        items: [
          { label: 'Dashboard',          path: '/manager/dashboard',  icon: LayoutDashboard },
        ],
      },
      {
        title: 'Phê duyệt',
        items: [
          { label: 'Đơn chờ duyệt',      path: '/manager/leave-approvals', icon: CheckSquare, badge: true },
          { label: 'Lịch sử phê duyệt',  path: '/manager/approval-history', icon: Clock },
        ],
      },
      {
        title: 'Quản lý đội',
        items: [
          { label: 'Task team',          path: '/manager/tasks',      icon: ClipboardList },
          { label: 'Lịch team',          path: '/manager/team-schedule', icon: CalendarDays },
          { label: 'Đánh giá KPI',       path: '/manager/kpi',        icon: Star },
          { label: 'Đề xuất thăng tiến', path: '/manager/promotions', icon: TrendingUp },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Chấm công',          path: '/user/attendance',    icon: Clock },
          { label: 'Hồ sơ tôi',          path: '/user/profile',       icon: UserCircle },
          { label: 'Ứng lương',          path: '/user/advances',      icon: Banknote },
        ],
      },
    ],
  },
  accountant: {
    roleLabel: 'Kế toán',
    sections: [
      {
        title: 'Tổng quan',
        items: [
          { label: 'Dashboard',          path: '/accountant/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        title: 'Lương & Chi phí',
        items: [
          { label: 'Tính lương tháng',    path: '/accountant/payroll',      icon: Wallet },
          { label: 'Gửi phiếu lương',   path: '/accountant/payroll-send', icon: FileText },
          { label: 'Khoản thu nhập',    path: '/accountant/adjustments',  icon: PlusCircle },
          { label: 'Tạm ứng',          path: '/accountant/advances',     icon: FileText },
          { label: 'Cấu hình thuế',    path: '/accountant/tax-config',   icon: Settings },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Chấm công',          path: '/user/attendance',    icon: Clock },
          { label: 'Hồ sơ tôi',          path: '/user/profile',         icon: UserCircle },
          { label: 'Đơn của tôi',        path: '/user/leaves',          icon: ClipboardList },
        ],
      },
    ],
  },
  employee: {
    roleLabel: 'Nhân viên',
    sections: [
      {
        title: 'Trang chủ',
        items: [
          { label: 'Hôm nay',            path: '/user/today',         icon: Home },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Chấm công',          path: '/user/attendance',    icon: Clock },
          { label: 'Đơn từ',             path: '/user/leaves',        icon: FileText },
          { label: 'Phiếu lương',        path: '/user/payslip',       icon: Wallet },
          { label: 'Task của tôi',       path: '/user/tasks',         icon: ClipboardList },
          { label: 'Hiệu quả làm việc',  path: '/user/performance',   icon: BarChart2 },
          { label: 'Ứng lương',          path: '/user/advances',      icon: Banknote },
          { label: 'Hồ sơ tôi',          path: '/user/profile',       icon: UserCircle },
        ],
      },
    ],
  },
  user: {
    roleLabel: 'Nhân viên',
    sections: [
      {
        title: 'Trang chủ',
        items: [
          { label: 'Hôm nay',            path: '/user/today',         icon: Home },
        ],
      },
      {
        title: 'Cá nhân',
        items: [
          { label: 'Chấm công',          path: '/user/attendance',    icon: Clock },
          { label: 'Đơn từ',             path: '/user/leaves',        icon: FileText },
          { label: 'Phiếu lương',        path: '/user/payslip',       icon: Wallet },
          { label: 'Task của tôi',       path: '/user/tasks',         icon: ClipboardList },
          { label: 'Hiệu quả làm việc',  path: '/user/performance',   icon: BarChart2 },
          { label: 'Ứng lương',          path: '/user/advances',      icon: Banknote },
          { label: 'Hồ sơ tôi',          path: '/user/profile',       icon: UserCircle },
        ],
      },
    ],
  },
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const role = user?.role || 'user';
  const config = NAV_CONFIG[role] || NAV_CONFIG.user;
  const displayName = user?.name || user?.email || 'Người dùng';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-navy-950 flex flex-col overflow-hidden">
      {/* Logo block */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[.06] shrink-0">
        <div className="w-7 h-7 bg-navy-700 rounded-md flex items-center justify-center text-[13px] font-bold text-white shrink-0">
          A
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-none">ATRIA</div>
          <div className="text-[9px] font-semibold text-accent-500 uppercase tracking-[.06em] mt-[3px]">
            {config.roleLabel}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {config.sections.map((section) => (
          <div key={section.title}>
            <p className="px-5 pt-3.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[.06em] text-white/[.28]">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center h-[38px] px-5 gap-2.5 text-[13px] font-medium border-l-[3px] transition-colors ${
                      isActive
                        ? 'bg-navy-700 border-accent-500 text-white'
                        : 'border-transparent text-white/[.65] hover:bg-white/[.04] hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[.06] px-4 py-2.5 flex items-center gap-2 shrink-0">
        <Avatar
          name={displayName}
          src={user?.avatar_url ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${user.avatar_url}` : null}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-white truncate">{displayName}</div>
          <div className="text-[10px] text-white/40 mt-0.5">{config.roleLabel}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          <LogOut size={14} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
