import React, { useState, useEffect } from 'react';
import LeaveService from '../../services/leave.service';
import { Plus, CalendarDays, Clock, CheckCircle, XCircle, FileText, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { fmtDate as fmt } from '../../utils/format';

const TYPE_BADGE = {
  leave: { label: 'Nghỉ phép', variant: 'warning' },
  ot:    { label: 'Làm OT',   variant: 'info' },
};

const STATUS_BADGE = {
  approved: { label: 'Đã duyệt',  variant: 'success' },
  rejected: { label: 'Từ chối',   variant: 'danger' },
  pending:  { label: 'Chờ duyệt', variant: 'warning' },
};

const inputClass = "w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors";
const labelClass = "block text-[12px] font-medium text-gray-700 mb-1.5";

const INIT_FORM = {
  type: 'leave', start_date: '', end_date: '', total_days: '',
  ot_hours: '', start_time: '', end_time: '', reason: ''
};

const MyLeaves = () => {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INIT_FORM);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (formData.type === 'leave' && formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end >= start) {
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, total_days: diffDays }));
      } else {
        setFormData(prev => ({ ...prev, total_days: 0 }));
      }
    }
  }, [formData.start_date, formData.end_date, formData.type]);

  useEffect(() => {
    if (formData.type === 'ot' && formData.start_time && formData.end_time) {
      const [sh, sm] = formData.start_time.split(':').map(Number);
      const [eh, em] = formData.end_time.split(':').map(Number);
      const startMs = sh * 3600000 + sm * 60000;
      const endMs   = eh * 3600000 + em * 60000;
      if (endMs > startMs) {
        setFormData(prev => ({ ...prev, ot_hours: Math.round((endMs - startMs) / 360000) / 10 }));
      } else {
        setFormData(prev => ({ ...prev, ot_hours: 0 }));
      }
    }
  }, [formData.start_time, formData.end_time, formData.type]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, requestsRes] = await Promise.all([
        LeaveService.getMyLeaveBalance(),
        LeaveService.getMyLeaveRequests()
      ]);
      setBalance(balanceRes.data?.data || null);
      setRequests(requestsRes.data?.data || []);
    } catch {
      setBalance(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const submitData = { ...formData };
      if (submitData.type === 'ot') {
        submitData.reason = `[OT: ${submitData.start_time} - ${submitData.end_time}] ${submitData.reason}`;
      }
      await LeaveService.createLeaveRequest(submitData);
      setShowModal(false);
      setFormData(INIT_FORM);
      fetchData();
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Có lỗi xảy ra khi nộp đơn');
    }
  };

  const remaining = balance ? balance.total_days - balance.used_days - balance.pending_days : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Nghỉ phép & OT</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý quỹ phép và theo dõi trạng thái các đơn yêu cầu</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setSubmitError(''); }}
          className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors active:scale-[.98] shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} /> Nộp đơn mới
        </button>
      </div>

      {/* Leave balance KPI */}
      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: `Tổng phép (${balance.year})`, value: balance.total_days, unit: 'ngày' },
            { label: 'Đã nghỉ',        value: balance.used_days,    unit: 'ngày', danger: true },
            { label: 'Chờ duyệt',      value: balance.pending_days, unit: 'ngày', warning: true },
            { label: 'Còn lại',        value: remaining,            unit: 'ngày', success: remaining > 0 },
          ].map(k => (
            <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-2">{k.label}</p>
              <p className={`font-mono tabular-nums text-[28px] font-bold leading-none
                ${k.danger ? 'text-danger-600' : k.warning ? 'text-warning-600' : k.success ? 'text-success-600' : 'text-gray-900'}`}>
                {k.value}
                <span className="text-[14px] font-normal text-gray-400 ml-1">{k.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Requests table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900">Lịch sử yêu cầu</h2>
          <span className="font-mono tabular-nums text-[12px] text-gray-400">{requests.length} đơn</span>
        </div>

        {loading ? (
          <div className="space-y-0">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 border-b border-gray-100 px-5 flex items-center gap-4 animate-pulse">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <FileText size={32} strokeWidth={1.25} className="text-gray-300 mb-3" />
            <p className="text-[14px] font-medium text-gray-500">Chưa có đơn nào</p>
            <p className="text-[12px] text-gray-400 mt-1">Nhấn "Nộp đơn mới" để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Ngày gửi', 'Loại', 'Thời gian', 'Thời lượng', 'Trạng thái'].map(col => (
                    <th key={col} className="h-10 px-5 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const stCfg = STATUS_BADGE[req.status] || STATUS_BADGE.pending;
                  const typeCfg = TYPE_BADGE[req.type] || TYPE_BADGE.leave;
                  return (
                    <tr key={req.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5">
                        <span className="font-mono tabular-nums text-[12px] text-gray-500">{fmt(req.created_at)}</span>
                      </td>
                      <td className="px-5">
                        <Badge variant={typeCfg.variant} size="sm">{typeCfg.label}</Badge>
                      </td>
                      <td className="px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tabular-nums text-[12px] text-gray-700">{fmt(req.start_date)}</span>
                          {req.start_date !== req.end_date && (
                            <>
                              <span className="text-gray-400 text-[11px]">→</span>
                              <span className="font-mono tabular-nums text-[12px] text-gray-700">{fmt(req.end_date)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5">
                        <span className="font-mono tabular-nums text-[13px] font-semibold text-gray-800">
                          {req.type === 'leave' ? `${req.total_days} ngày` : `${req.ot_hours} giờ`}
                        </span>
                      </td>
                      <td className="px-5">
                        <div className="space-y-1">
                          <Badge variant={stCfg.variant} size="sm">{stCfg.label}</Badge>
                          {req.status === 'rejected' && req.reject_reason && (
                            <p className="text-[11px] text-danger-600 max-w-48">{req.reject_reason}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Nộp đơn mới</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">Điền thông tin nghỉ phép hoặc đăng ký OT</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {submitError && (
                <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">{submitError}</div>
              )}

              <div>
                <label className={labelClass}>Loại đơn</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                  <option value="leave">Nghỉ phép</option>
                  <option value="ot">Làm thêm giờ (OT)</option>
                </select>
              </div>

              {formData.type === 'leave' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Từ ngày <span className="text-danger-500">*</span></label>
                    <input id="start_date" type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Đến ngày <span className="text-danger-500">*</span></label>
                    <input id="end_date" type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Số ngày nghỉ (tự động)</label>
                    <input readOnly value={formData.total_days || ''} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed font-mono tabular-nums`} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Ngày làm OT <span className="text-danger-500">*</span></label>
                    <input type="date" name="start_date" value={formData.start_date}
                      onChange={e => setFormData(p => ({...p, start_date: e.target.value, end_date: e.target.value}))}
                      required className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Từ giờ <span className="text-danger-500">*</span></label>
                      <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Đến giờ <span className="text-danger-500">*</span></label>
                      <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Số giờ OT (tự động)</label>
                    <input readOnly value={formData.ot_hours || ''} className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed font-mono tabular-nums`} />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Lý do chi tiết <span className="text-danger-500">*</span></label>
                <textarea id="reason" name="reason" value={formData.reason} onChange={handleChange} required rows={3}
                  placeholder="Ghi rõ lý do..."
                  className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 h-10 bg-accent-600 hover:bg-accent-700 text-white text-[13px] font-semibold rounded-md transition-colors">Gửi đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
