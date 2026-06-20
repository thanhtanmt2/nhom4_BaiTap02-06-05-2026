import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, LogOut, Calendar, RefreshCw } from 'lucide-react';
import attendanceService from '../../services/attendance.service';
import Badge from '../../components/ui/Badge';

const AttendancePage = () => {
  const [time, setTime] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Trạng thái nút bấm: 'idle' | 'checked_in' | 'done'
  const [todayStatus, setTodayStatus] = useState('idle');

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getMyHistory();
      if (res.data.success) {
        setHistory(res.data.data);
        determineTodayStatus(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const determineTodayStatus = (logs) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(l => l.date === todayStr);

    if (!todayLog) {
      setTodayStatus('idle');
    } else if (todayLog.check_in_time && !todayLog.check_out_time) {
      setTodayStatus('checked_in');
    } else if (todayLog.check_out_time) {
      setTodayStatus('done');
    }
  };

  const handleAction = async () => {
    setError('');
    setActionLoading(true);
    try {
      if (todayStatus === 'idle') {
        await attendanceService.checkIn();
      } else if (todayStatus === 'checked_in') {
        await attendanceService.checkOut();
      }
      await fetchHistory(); // Gọi lại để cập nhật bảng và trạng thái nút
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chấm công.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Chấm công</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ghi nhận giờ vào và giờ ra mỗi ngày của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget chấm công */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[11px] font-semibold text-success-600 bg-success-50 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></span>
              Sẵn sàng
            </div>

            {/* Đồng hồ */}
            <div className="text-center mt-6 mb-8">
              <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-widest">
                {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="font-mono text-5xl font-bold tracking-tight text-navy-900">
                {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-danger-600 text-sm mb-4 text-center">{error}</p>
            )}

            {/* Big Button */}
            {todayStatus === 'done' ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-success-50 border border-success-100 rounded-2xl w-full">
                <CheckCircle size={40} className="text-success-500 mb-3" />
                <h3 className="text-success-900 font-bold text-lg mb-1">Đã hoàn thành!</h3>
                <p className="text-success-700 text-sm">Bạn đã chấm công đầy đủ cho ngày hôm nay.</p>
              </div>
            ) : (
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`group relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(0,0,0,0.1)]
                  ${todayStatus === 'idle'
                    ? 'bg-gradient-to-b from-navy-600 to-navy-900 hover:shadow-[0_0_60px_rgba(11,31,61,0.4)] hover:-translate-y-1'
                    : 'bg-gradient-to-b from-accent-500 to-accent-700 hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] hover:-translate-y-1'
                  }`}
              >
                <div className="absolute inset-1 rounded-full border-2 border-white/20"></div>
                {actionLoading ? (
                  <RefreshCw size={36} className="text-white animate-spin" />
                ) : todayStatus === 'idle' ? (
                  <>
                    <Clock size={40} strokeWidth={2.5} className="text-white mb-2" />
                    <span className="text-white font-bold text-xl uppercase tracking-wider">Check In</span>
                  </>
                ) : (
                  <>
                    <LogOut size={40} strokeWidth={2.5} className="text-white mb-2" />
                    <span className="text-white font-bold text-xl uppercase tracking-wider">Check Out</span>
                  </>
                )}
              </button>
            )}
            
            <p className="text-xs text-gray-400 mt-8 text-center px-4">
              {todayStatus === 'idle' ? 'Vui lòng bấm nút để ghi nhận giờ BẮT ĐẦU làm việc.' 
                : todayStatus === 'checked_in' ? 'Vui lòng bấm nút để ghi nhận giờ KẾT THÚC làm việc.' 
                : 'Hẹn gặp lại bạn vào ngày mai!'}
            </p>
          </div>
        </div>

        {/* Bảng lịch sử */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50">
              <Calendar size={18} className="text-gray-500" />
              <h2 className="text-[15px] font-semibold text-gray-900">Lịch sử chấm công (30 ngày)</h2>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Ngày', 'Giờ vào', 'Giờ ra', 'Số giờ', 'Trạng thái'].map((col) => (
                      <th key={col} className="h-11 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Chưa có dữ liệu chấm công.</td>
                    </tr>
                  ) : (
                    history.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 text-sm">{formatDate(log.date)}</td>
                        <td className="px-5 py-3 font-mono text-[13px] text-gray-600">
                          {formatTime(log.check_in_time)}
                        </td>
                        <td className="px-5 py-3 font-mono text-[13px] text-gray-600">
                          {formatTime(log.check_out_time)}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-gray-900 font-semibold">
                          {log.work_hours ? `${log.work_hours}h` : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={
                            log.status === 'Present' ? 'success' :
                            log.status === 'Late' ? 'warning' :
                            log.status === 'Absent' ? 'danger' : 'neutral'
                          }>
                            {log.status === 'Present' ? 'Có mặt' : log.status === 'Late' ? 'Đi trễ' : log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendancePage;
