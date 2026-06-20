import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, CalendarDays, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import attendanceService from '../../services/attendance.service';
import { taskService } from '../../services/task.service';
import Badge from '../../components/ui/Badge';

const UserToday = () => {
  const [todayStatus, setTodayStatus] = useState('idle'); // idle | checked_in | done
  const [checkInTime, setCheckInTime] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [attRes, taskRes] = await Promise.all([
          attendanceService.getMyHistory().catch(() => null),
          taskService.getMyTasks().catch(() => null),
        ]);

        if (attRes?.data?.success) {
          const todayStr = today.toISOString().split('T')[0];
          const todayLog = attRes.data.data?.find(l => l.date === todayStr);
          if (!todayLog) {
            setTodayStatus('idle');
          } else if (todayLog.check_in_time && !todayLog.check_out_time) {
            setTodayStatus('checked_in');
            setCheckInTime(todayLog.check_in_time);
          } else if (todayLog.check_out_time) {
            setTodayStatus('done');
            setCheckInTime(todayLog.check_in_time);
          }
        }

        if (taskRes?.data?.success || Array.isArray(taskRes?.data)) {
          const tasks = taskRes.data?.data || taskRes.data || [];
          const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
          setPendingTasks(active.slice(0, 5));
        }
      } catch {
        // silent — individual pages have full error handling
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusInfo = {
    idle:       { label: 'Chưa chấm công',   variant: 'warning', icon: Clock },
    checked_in: { label: 'Đang làm việc',    variant: 'success', icon: CheckCircle },
    done:       { label: 'Đã hoàn tất hôm nay', variant: 'neutral', icon: CheckCircle },
  }[todayStatus];

  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Hôm nay</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{todayLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Attendance card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-gray-500" />
            <h2 className="text-[14px] font-semibold text-gray-900">Chấm công hôm nay</h2>
          </div>

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${todayStatus === 'idle' ? 'bg-warning-100' : todayStatus === 'checked_in' ? 'bg-success-100' : 'bg-gray-100'}`}>
                <StatusIcon size={18} className={
                  todayStatus === 'idle' ? 'text-warning-700' : todayStatus === 'checked_in' ? 'text-success-700' : 'text-gray-500'
                } />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{statusInfo.label}</p>
                {checkInTime && (
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Vào lúc {new Date(`1970-01-01T${checkInTime}`).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          )}

          <Link
            to="/user/attendance"
            className="mt-4 block w-full text-center py-2 text-[13px] font-medium text-navy-700 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Đến trang chấm công →
          </Link>
        </div>

        {/* Tasks card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo size={16} className="text-gray-500" />
              <h2 className="text-[14px] font-semibold text-gray-900">Task đang thực hiện</h2>
            </div>
            {pendingTasks.length > 0 && (
              <span className="text-[11px] font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                {pendingTasks.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle size={28} className="text-success-500 mb-2" />
              <p className="text-[13px] text-gray-500">Không có task đang chờ</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.map(task => (
                <li key={task.id} className="flex items-start gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
                  <AlertCircle size={14} className="text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Deadline: {new Date(task.due_date).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <Badge variant={task.status === 'in_progress' ? 'brand' : 'neutral'} size="sm">
                    {task.status === 'in_progress' ? 'Đang làm' : 'Cần làm'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/user/tasks"
            className="mt-4 block w-full text-center py-2 text-[13px] font-medium text-navy-700 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Xem tất cả task →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserToday;
