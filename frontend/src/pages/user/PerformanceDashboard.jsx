import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import performanceService from '../../services/performance.service';
import Badge from '../../components/ui/Badge';

const RATING_BADGE = {
  A: { label: 'Xếp loại A', variant: 'success' },
  B: { label: 'Xếp loại B', variant: 'brand' },
  C: { label: 'Xếp loại C', variant: 'warning' },
  D: { label: 'Xếp loại D', variant: 'danger' },
};

const PerformanceDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await performanceService.getDashboardData();
      setData(res.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-lg" />)}
        </div>
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">
        Không tải được dữ liệu hiệu quả công việc.
      </div>
    );
  }

  const { taskStats, attendanceStats, reviews } = data;
  const latestReview = reviews.length > 0 ? reviews[0] : null;
  const ratingCfg = latestReview ? (RATING_BADGE[latestReview.rating] || RATING_BADGE.C) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Hiệu quả công việc</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thống kê task, chuyên cần và đánh giá KPI cá nhân</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Task stats */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200">
            <h2 className="text-[14px] font-semibold text-gray-900">Thống kê task</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
            {[
              { label: 'Tổng giao',   value: taskStats.total,      },
              { label: 'Hoàn thành',  value: taskStats.completed,  success: true },
              { label: 'Trễ hạn',     value: taskStats.overdue ?? 0,    danger: true },
              { label: 'Đang làm',    value: taskStats.inProgress, brand: true },
            ].map(k => (
              <div key={k.label} className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{k.label}</p>
                <p className={`font-mono tabular-nums text-[26px] font-bold leading-none
                  ${k.danger ? 'text-danger-600' : k.success ? 'text-success-600' : k.brand ? 'text-navy-700' : 'text-gray-900'}`}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance stats */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200">
            <h2 className="text-[14px] font-semibold text-gray-900">Chuyên cần</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
            {[
              { label: 'Ngày công',   value: attendanceStats.workingDays,   success: true },
              { label: 'Đi trễ',      value: attendanceStats.lateDays,      warning: true },
              { label: 'Nghỉ phép',   value: attendanceStats.leaveDays,     },
              { label: 'Vắng mặt',    value: attendanceStats.absentDays,    danger: true },
            ].map(k => (
              <div key={k.label} className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{k.label}</p>
                <p className={`font-mono tabular-nums text-[26px] font-bold leading-none
                  ${k.danger ? 'text-danger-600' : k.warning ? 'text-warning-600' : k.success ? 'text-success-600' : 'text-gray-900'}`}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI & Review */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200">
          <h2 className="text-[14px] font-semibold text-gray-900">Đánh giá KPI & Nhận xét</h2>
        </div>

        {latestReview ? (
          <div className="flex flex-col md:flex-row gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Score block */}
            <div className="md:w-48 p-6 flex flex-col items-center justify-center gap-2 bg-navy-50">
              <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-400">
                KPI tháng {latestReview.month}/{latestReview.year}
              </p>
              <p className="font-mono tabular-nums text-[48px] font-bold text-navy-900 leading-none">
                {latestReview.kpi_score}
              </p>
              {ratingCfg && <Badge variant={ratingCfg.variant}>{ratingCfg.label}</Badge>}
            </div>

            {/* Comments block */}
            <div className="flex-1 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 mb-3">Nhận xét từ quản lý</p>
              <blockquote className="border-l-[3px] border-navy-200 pl-4 text-[13px] text-gray-700 italic leading-relaxed">
                "{latestReview.comments || 'Không có nhận xét'}"
              </blockquote>
              {latestReview.reviewer && (
                <p className="text-[11px] text-gray-400 mt-3">
                  Người đánh giá: <span className="font-medium text-gray-600">{latestReview.reviewer.username || latestReview.reviewer.name}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-[13px] text-gray-400">Chưa có đánh giá KPI nào trong hệ thống.</p>
          </div>
        )}
      </div>

      {/* All reviews table */}
      {reviews.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200">
            <h2 className="text-[14px] font-semibold text-gray-900">Lịch sử đánh giá KPI</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Tháng/Năm', 'Điểm KPI', 'Xếp loại', 'Nhận xét'].map(col => (
                    <th key={col} className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, i) => {
                  const cfg = RATING_BADGE[r.rating] || RATING_BADGE.C;
                  return (
                    <tr key={i} className="h-12 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 font-mono tabular-nums text-[12px] text-gray-500">{r.month}/{r.year}</td>
                      <td className="px-5 font-mono tabular-nums text-[13px] font-semibold text-gray-900">{r.kpi_score}</td>
                      <td className="px-5"><Badge variant={cfg.variant} size="sm">{cfg.label}</Badge></td>
                      <td className="px-5 max-w-64"><p className="text-[12px] text-gray-600 truncate">{r.comments || '—'}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
