import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ── Icon components ───────────────────────────────────────────────────────────
const IconUsers = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconLock = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const IconStar = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const IconClock = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconBuilding = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

// ── Cấu hình stat cards ───────────────────────────────────────────────────────
const getCards = (data) => [
  {
    id: 'total',
    label: 'Tổng tài khoản',
    value: data?.totalUsers ?? '—',
    icon: <IconUsers />,
    bg: 'from-indigo-400 to-indigo-500',
    link: '/admin/users',
    linkLabel: 'Xem tất cả →',
  },
  {
    id: 'active',
    label: 'Đang hoạt động',
    value: data?.activeUsers ?? '—',
    icon: <IconCheck />,
    bg: 'from-emerald-500 to-emerald-600',
    link: '/admin/users?status=active',
    linkLabel: 'Xem →',
  },
  {
    id: 'locked',
    label: 'Bị khóa',
    value: data?.lockedUsers ?? '—',
    icon: <IconLock />,
    bg: 'from-rose-500 to-rose-600',
    link: '/admin/users?status=inactive',
    linkLabel: 'Xử lý ngay →',
  },
  {
    id: 'new',
    label: 'Mới tháng này',
    value: data?.newUsersThisMonth ?? '—',
    icon: <IconStar />,
    bg: 'from-purple-500 to-purple-600',
    link: '/admin/users',
    linkLabel: 'Xem →',
  },
  {
    id: 'pending',
    label: 'Yêu cầu chờ duyệt',
    value: 0,
    icon: <IconClock />,
    bg: 'from-amber-400 to-orange-500',
    link: '/admin/users',
    linkLabel: 'Xem →',
    placeholder: true,
  },
  {
    id: 'departments',
    label: 'Phòng ban',
    value: 0,
    icon: <IconBuilding />,
    bg: 'from-teal-500 to-teal-600',
    link: '/admin/departments',
    linkLabel: 'Quản lý →',
    placeholder: true,
  },
];

// ── Badge trạng thái tài khoản ───────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        Hoạt động
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
      Bị khóa
    </span>
  );
};

// ── Badge vai trò ────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:      'bg-blue-100 text-blue-700',
    hr:         'bg-violet-100 text-violet-700',
    manager:    'bg-amber-100 text-amber-700',
    accountant: 'bg-teal-100 text-teal-700',
    employee:   'bg-gray-100 text-gray-600',
    user:       'bg-gray-100 text-gray-600',
  };
  const labels = {
    admin: 'Quản trị viên', hr: 'HR', manager: 'Manager',
    accountant: 'Kế toán', employee: 'Nhân viên', user: 'Người dùng',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[role] || map.user}`}>
      {labels[role] || role}
    </span>
  );
};

// ── Format ngày tháng ────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRoleDotColor = (role) => {
  const map = {
    admin: 'bg-blue-500',
    hr: 'bg-violet-500',
    manager: 'bg-amber-500',
    accountant: 'bg-teal-500',
    employee: 'bg-gray-500',
    user: 'bg-gray-500',
  };
  return map[role] || 'bg-gray-400';
};

// ── Component chính ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);   // dữ liệu từ API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/admin/dashboard');
        setStats(res.data.data);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = getCards(stats);
  const recentActivities = stats?.recentActivities || [];
  const now = new Date();
  const monthYear = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  // ── Trạng thái loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ── Trạng thái lỗi ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-8 py-6 text-center">
          <p className="text-rose-600 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ══ HEADER BANNER — gradient xanh đậm ══ */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 pt-8 pb-24 relative overflow-hidden">
        {/* Vòng trang trí nền */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-20 -right-4 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 left-1/3 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Xin chào, Admin 👋</p>
            <h1 className="text-3xl font-extrabold text-white">Tổng quan hệ thống</h1>
            <p className="text-blue-200 text-sm mt-1.5">Dữ liệu cập nhật theo thời gian thực · {monthYear}</p>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl backdrop-blur transition-all border border-white/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Quản lý tài khoản
          </button>
        </div>
      </div>

      {/* ══ STAT CARDS — nổi lên đè lên header ══ */}
      <div className="px-8 -mt-14 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-2xl p-5 flex flex-col gap-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-gradient-to-br ${card.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-white/20">
                  {card.icon}
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-white">{card.value}</span>
                  {card.placeholder && (
                    <p className="text-[10px] text-white/60 mt-0.5">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-white/85">{card.label}</p>
              <button
                onClick={() => navigate(card.link)}
                className="text-xs font-semibold self-start text-white/70 hover:text-white hover:underline underline-offset-2"
              >
                {card.linkLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ══ NỘI DUNG PHÍA DƯỚI ══ */}
      <div className="px-8 py-6 space-y-6">
      {/* ── 2 bảng dưới: Tài khoản mới + Yêu cầu chờ duyệt ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Slider 10 tài khoản mới nhất */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">Top 10 Tài khoản mới nhất</h2>
              <p className="text-xs text-gray-400 mt-0.5">Thành viên mới gia nhập hệ thống</p>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Xem tất cả →
            </button>
          </div>
          
          {stats?.recentUsers?.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
              }}
              className="pb-10" // padding bottom cho pagination dots
            >
              {stats.recentUsers.map((u) => (
                <SwiperSlide key={u.id} className="h-auto">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 h-full flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                    {/* Avatar */}
                    {u.Profile?.avatar_url ? (
                      <img 
                        src={`http://localhost:5000${u.Profile.avatar_url}`} 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-full object-cover mb-3 shadow-sm border-2 border-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-sm border-2 border-white">
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Thông tin */}
                    <h3 className="font-bold text-gray-800 text-sm truncate w-full" title={u.name || 'Chưa cập nhật'}>
                      {u.name || 'Chưa cập nhật'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate w-full mb-2" title={u.email}>
                      {u.email}
                    </p>
                    
                    {/* Badge */}
                    <div className="flex gap-1 mb-3">
                      <RoleBadge role={u.role} />
                    </div>

                    <div className="mt-auto pt-3 w-full border-t border-gray-200">
                      <p className="text-[10px] text-gray-400">Tham gia: {formatDate(u.created_at)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={u.department || 'Chưa xếp phòng ban'}>
                        {u.department || 'Chưa xếp phòng ban'}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              Chưa có tài khoản nào
            </div>
          )}
        </div>

        {/* Bảng yêu cầu cấp tài khoản — Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-dashed border-amber-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">Yêu cầu cấp tài khoản</h2>
              <p className="text-xs text-gray-400 mt-0.5">Yêu cầu từ HR đang chờ Admin xác nhận</p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-600 font-semibold px-2.5 py-1 rounded-full">Sắp có</span>
          </div>
          {/* Placeholder rows */}
          <div className="px-6 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-7 w-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
            <p className="text-center text-xs text-gray-400 pt-2">
              Chức năng sẽ khả dụng sau khi xây module HR
            </p>
          </div>
        </div>

      </div>

      {/* ── Widget Nhật ký hoạt động gần đây ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Nhật ký hoạt động gần đây</h2>
            <p className="text-xs text-gray-400 mt-0.5">Lịch sử thao tác của tất cả vai trò trong hệ thống</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-full">Top 10</span>
        </div>
        {recentActivities.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentActivities.map((item) => {
              const role = item.User?.role || 'user';
              const actorLabel = item.User?.name || item.User?.email || 'Hệ thống';
              const detail = item.detail || item.action;
              return (
                <div key={item.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getRoleDotColor(role)}`} />
                  <span className="text-xs font-semibold text-gray-600 w-32 shrink-0 truncate" title={actorLabel}>
                    {actorLabel}
                  </span>
                  <p className="text-sm text-gray-700 flex-1">
                    {detail}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-400">
            Chưa có hoạt động nào
          </div>
        )}
      </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
