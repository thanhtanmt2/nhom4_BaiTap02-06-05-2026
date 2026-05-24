import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../../services/axiosClient';
import Sidebar from './Sidebar';

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

const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosClient.get('/profile/activity?limit=10');
        const payload = res.data.data || {};
        setLogs(payload.logs || []);
        setUnreadCount(payload.unreadCount || 0);
      } catch (err) {
        setError('Không thể tải nhật ký');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="relative px-6 py-3 flex items-center justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Xem thông báo"
              >
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Thông báo của bạn</p>
                        <p className="text-xs text-gray-400">{user?.email || 'Tài khoản hiện tại'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await axiosClient.post('/profile/activity/read');
                            setUnreadCount(0);
                            setLogs((prev) => prev.map((item) => ({ ...item, is_read: true })));
                          } catch (err) {
                            setError('Không thể đánh dấu đã đọc');
                          }
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline disabled:text-gray-300"
                        disabled={unreadCount === 0}
                      >
                        Đánh dấu đã đọc
                      </button>
                    </div>
                  </div>

                  {loading && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</div>
                  )}

                  {!loading && error && (
                    <div className="px-4 py-6 text-center text-sm text-rose-500">{error}</div>
                  )}

                  {!loading && !error && logs.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Chưa có hoạt động nào</div>
                  )}

                  {!loading && !error && logs.length > 0 && (
                    <div className="max-h-80 overflow-auto divide-y divide-gray-50">
                      {logs.map((item) => (
                        <div key={item.id} className="px-4 py-3">
                          <p className="text-sm text-gray-700">{item.detail || item.action}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(item.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
