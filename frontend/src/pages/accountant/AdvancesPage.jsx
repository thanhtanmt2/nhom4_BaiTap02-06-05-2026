import { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2, XCircle, Inbox, AlertCircle, Wallet, X,
  ChevronDown, RotateCcw, AlertTriangle, Check, Search, Plus,
} from 'lucide-react';
import {
  getAdvances,
  getAdvanceStats,
  getAdvanceEmployees,
  createAdvance,
  approveAdvance,
  rejectAdvance,
  disburseAdvance,
} from '../../services/advance.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n) => (n ? Number(n).toLocaleString('vi-VN') : '—');
const fmtMoneyShort = (n) => {
  const m = Number(n) / 1_000_000;
  return m >= 1 ? `${m.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M` : `${Number(n).toLocaleString('vi-VN')}`;
};

function numberToWords(n) {
  if (!n) return '';
  const million = Math.floor(Number(n) / 1_000_000);
  if (million > 0) return `${million.toLocaleString('vi-VN')} triệu đồng`;
  const thou = Math.floor(Number(n) / 1_000);
  return `${thou.toLocaleString('vi-VN')} nghìn đồng`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 2) return 'Hôm qua';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const todayISO = () => new Date().toISOString().slice(0, 10);

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLORS = ['#1E3A6B', '#0891B2', '#7C3AED', '#0D9488', '#BE185D', '#A16207'];
const avBg = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

function Avatar({ name = '', size = 32 }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', background: avBg(name),
        color: '#fff', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600,
        flexShrink: 0, border: '1px solid rgba(0,0,0,.06)',
      }}
    >
      {initials(name)}
    </span>
  );
}

// ── Status badge helpers ──────────────────────────────────────────────────────
const STATUS_META = {
  pending:   { label: 'Chờ duyệt',      bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  approved:  { label: 'Đã duyệt - chờ chi', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  rejected:  { label: 'Đã từ chối',     bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  deducting: { label: 'Đang khấu trừ', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  completed: { label: 'Hoàn thành',    bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`fixed top-4 right-4 z-[700] max-w-[380px] bg-white border border-l-4 ${isSuccess ? 'border-l-green-500' : 'border-l-red-500'} border-gray-200 rounded-lg p-3.5 shadow-lg flex gap-3 items-start`}
      style={{ animation: 'slide-in-right 200ms ease' }}
    >
      <span className={`flex-shrink-0 mt-0.5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
        {isSuccess ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900">{toast.title}</p>
        {toast.body && <p className="text-[12px] text-gray-500 mt-0.5">{toast.body}</p>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ req, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-5"
      style={{ background: 'rgba(15,23,42,.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-[420px] w-full p-6" style={{ animation: 'scale-in 200ms ease' }}>
        <div className="flex gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
            <XCircle size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">Từ chối đơn tạm ứng?</h3>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
              Đơn của <strong>{req?.requester?.name}</strong> sẽ bị từ chối. Nhân viên sẽ nhận thông báo.
            </p>
          </div>
        </div>

        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
          Lý do từ chối <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="VD: Vượt hạn mức năm, đã có đơn khác chưa khấu trừ xong..."
          rows={3}
          className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md resize-none outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15 leading-relaxed"
        />

        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="h-9 px-4 text-[13px] font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="h-9 px-4 text-[13px] font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? <RotateCcw size={13} className="animate-spin" /> : <XCircle size={13} />}
            Từ chối đơn
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Advance Modal ──────────────────────────────────────────────────────
function CreateModal({ employees, onClose, onCreated }) {
  const [form, setForm] = useState({ user_id: '', amount: '', reason: '', urgent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.user_id || !form.amount || !form.reason) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (Number(form.amount) <= 0) { setError('Số tiền phải lớn hơn 0.'); return; }
    setLoading(true);
    try {
      const res = await createAdvance({
        user_id: Number(form.user_id),
        amount: Number(form.amount),
        reason: form.reason,
        urgent: form.urgent,
      });
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-5"
      style={{ background: 'rgba(15,23,42,.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] flex flex-col" style={{ maxHeight: '90vh', animation: 'scale-in 200ms ease' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[17px] font-semibold text-gray-900">Tạo đơn tạm ứng</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-md"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nhân viên <span className="text-red-500">*</span></label>
            <select
              value={form.user_id}
              onChange={(e) => set('user_id', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-[14px] text-gray-900 bg-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
            >
              <option value="">Chọn nhân viên...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}{emp.Profile?.job_title ? ` — ${emp.Profile.job_title}` : ''}
                  {emp.contracts?.[0]?.basic_salary ? ` (${fmtMoneyShort(emp.contracts[0].basic_salary)}/tháng)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Số tiền yêu cầu <span className="text-red-500">*</span></label>
            <div className="flex">
              <input
                type="number" min="1"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                className="flex-1 h-10 px-3 border border-gray-300 border-r-0 rounded-l-md text-[14px] font-mono text-gray-900 bg-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
              />
              <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-r-md flex items-center text-[13px] text-gray-500">VNĐ</div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Lý do yêu cầu <span className="text-red-500">*</span></label>
            <textarea
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="VD: Mua thiết bị phục vụ công việc..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 bg-white resize-none focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => set('urgent', !form.urgent)}
              className={`w-8 h-5 rounded-full relative transition-colors flex-shrink-0 ${form.urgent ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.urgent ? 'left-3.5' : 'left-0.5'}`} />
            </button>
            <div>
              <p className="text-[13px] font-medium text-gray-900">Đánh dấu khẩn cấp</p>
              <p className="text-[11px] text-gray-500">Hiển thị nổi bật trong danh sách đơn chờ duyệt</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-[13px] text-red-700">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="h-9 px-4 text-[13px] font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">Huỷ</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-9 px-4 text-[13px] font-semibold rounded-md bg-navy-700 hover:bg-navy-800 text-white disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? <RotateCcw size={13} className="animate-spin" /> : <Plus size={13} />}
            Tạo đơn
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ req, onApprove, onReject, onDisburse, submitting }) {
  const [method, setMethod] = useState('split');
  const [months, setMonths] = useState(3);
  const [disburseDate, setDisburseDate] = useState(todayISO());

  useEffect(() => {
    if (req) {
      setMethod(req.deduct_method || 'split');
      setMonths(req.deduct_months || 3);
    }
  }, [req?.id]);

  if (!req) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-center bg-gray-50">
        <div>
          <Inbox size={56} className="text-gray-300 mx-auto mb-4" />
          <p className="text-[15px] font-semibold text-gray-900">Chọn một đơn từ danh sách bên trái</p>
          <p className="text-[13px] text-gray-500 mt-1.5">để xem chi tiết và duyệt tạm ứng.</p>
        </div>
      </div>
    );
  }

  const isPending   = req.status === 'pending';
  const isApproved  = req.status === 'approved';
  const isDeducting = req.status === 'deducting';
  const isCompleted = req.status === 'completed';

  const yearly_advanced = Number(req.yearly_advanced || 0);
  const yearly_limit    = Number(req.yearly_limit || 0);
  const amount          = Number(req.amount || 0);
  const afterApproval   = yearly_limit > 0 ? yearly_limit - yearly_advanced - amount : 0;
  const overLimit       = yearly_limit > 0 && afterApproval < 0;
  const monthlyDeduct   = method === 'split' ? Math.round(amount / months) : amount;

  const empName   = req.requester?.name || '—';
  const empTitle  = req.requester?.Profile?.job_title || req.requester?.Profile?.department || '';
  const empSalary = req.monthly_salary;

  // Lịch sử khấu trừ giả lập (dựa trên deduct_months & deducted_so_far)
  const deductedMonths = isDeducting || isCompleted
    ? Math.floor(Number(req.deducted_so_far || 0) / (amount / (req.deduct_months || 1)))
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
      <div className="flex-1 p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-wider mb-1">{req.code || `ADV-${req.id}`}</p>
            <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight">Đơn tạm ứng lương</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={req.status} />
              {req.urgent && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                  <AlertCircle size={11} /> Khẩn cấp
                </span>
              )}
              <span className="text-[12px] text-gray-400">
                Gửi {new Date(req.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} lúc {new Date(req.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Amount big card */}
        <div className="rounded-lg p-6 mb-4" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Số tiền yêu cầu</p>
          <p className="font-mono text-[36px] font-bold text-amber-700 leading-none tracking-tight">
            {fmtMoney(req.amount)} ₫
          </p>
          <p className="text-[12px] text-amber-600 mt-1.5 italic">({numberToWords(req.amount)} chẵn)</p>
        </div>

        {/* Employee info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-4">
          <Avatar name={empName} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-gray-900">{empName}</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">{empTitle}</p>
          </div>
          {empSalary && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Lương tháng</p>
              <p className="font-mono text-[15px] font-semibold text-gray-900 mt-0.5">{fmtMoney(empSalary)} ₫</p>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-3 pb-2.5 border-b border-gray-100">Lý do yêu cầu</h3>
          <p className="text-[13px] text-gray-700 leading-relaxed">{req.reason}</p>
        </div>

        {/* Quota */}
        {yearly_limit > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3 pb-2.5 border-b border-gray-100">
              Hạn mức tạm ứng năm {new Date().getFullYear()}
            </h3>
            <div className="bg-navy-50 border border-navy-100 rounded-md p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-700 mb-2.5">
                {fmtMoneyShort(yearly_limit)} / năm (tối đa 3 tháng lương)
              </p>
              {/* Bar */}
              <div className="h-2 rounded-full overflow-hidden flex mb-2.5 bg-gray-100">
                {yearly_limit > 0 && (
                  <>
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min((yearly_advanced / yearly_limit) * 100, 100)}%` }}
                      title={`Đã ứng: ${fmtMoney(yearly_advanced)}`}
                    />
                    <div
                      className={`h-full ${overLimit ? 'bg-red-500' : 'bg-amber-600'}`}
                      style={{ width: `${Math.min((amount / yearly_limit) * 100, 100 - (yearly_advanced / yearly_limit) * 100)}%` }}
                      title={`Yêu cầu: ${fmtMoney(amount)}`}
                    />
                    <div className="h-full bg-green-100 flex-1" />
                  </>
                )}
              </div>
              <div className="flex gap-4 text-[11px] text-gray-500 flex-wrap">
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1 align-middle" />Đã ứng <strong className="text-gray-900">{fmtMoney(yearly_advanced)} ₫</strong></span>
                <span><span className={`inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle ${overLimit ? 'bg-red-500' : 'bg-amber-600'}`} />Yêu cầu <strong className="text-gray-900">{fmtMoney(amount)} ₫</strong></span>
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-200 mr-1 align-middle" />Còn lại <strong className={overLimit ? 'text-red-600' : 'text-gray-900'}>{fmtMoney(Math.max(0, afterApproval))} ₫</strong></span>
              </div>
            </div>
            {overLimit && (
              <div className="mt-3 p-3 bg-red-50 border border-l-4 border-red-200 border-l-red-600 rounded-md flex gap-2">
                <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700 leading-relaxed">
                  Vượt hạn mức năm! Sau khi duyệt sẽ vượt <strong>{fmtMoney(Math.abs(afterApproval))} ₫</strong>. Cần phê duyệt ngoại lệ từ Manager trực tiếp.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deduction method — chỉ khi pending */}
        {isPending && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3 pb-2.5 border-b border-gray-100">Phương thức khấu trừ</h3>
            <div className="flex gap-2.5">
              {[
                { v: 'full',  label: 'Trừ 1 lần',       sub: 'Khấu trừ vào lương tháng tới' },
                { v: 'split', label: 'Chia nhiều tháng', sub: 'Khuyến nghị cho khoản lớn' },
              ].map(({ v, label, sub }) => (
                <button
                  key={v}
                  onClick={() => setMethod(v)}
                  className={`flex-1 p-3 rounded-md border text-left transition-all ${method === v ? 'border-2 border-navy-700 bg-navy-50' : 'border border-gray-300 hover:border-navy-300 hover:bg-navy-50'}`}
                >
                  <p className={`text-[13px] font-semibold ${method === v ? 'text-navy-800' : 'text-gray-900'}`}>{label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
                </button>
              ))}
            </div>

            {method === 'split' && (
              <div className="mt-3">
                <select
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-[13px] text-gray-900 bg-white mt-2 focus:outline-none focus:border-navy-600"
                >
                  {[2, 3, 6, 12].map((m) => (
                    <option key={m} value={m}>Chia {m} tháng</option>
                  ))}
                </select>
                <div className="flex flex-col gap-1.5 mt-3">
                  {Array.from({ length: months }).map((_, i) => {
                    const d = new Date(new Date().getFullYear(), new Date().getMonth() + 1 + i, 1);
                    const label = `${d.getMonth() + 1}/${d.getFullYear()}`;
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="bg-navy-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{i + 1}</span>
                          <span className="text-gray-700">Lương tháng <strong>{label}</strong></span>
                        </div>
                        <span className="font-mono font-semibold text-red-600">-{fmtMoney(monthlyDeduct)} ₫</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {method === 'full' && (
              <div className="mt-3">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-navy-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">1</span>
                    <span className="text-gray-700">Lương tháng <strong>{new Date().getMonth() + 2}/{new Date().getFullYear()}</strong></span>
                  </div>
                  <span className="font-mono font-semibold text-red-600">-{fmtMoney(amount)} ₫</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approved info */}
        {isApproved && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3 pb-2.5 border-b border-gray-100">Thông tin chi tiền</h3>
            {[
              { label: 'Ngày chi dự kiến', value: req.disburse_date ? new Date(req.disburse_date).toLocaleDateString('vi-VN') : '—' },
              { label: 'Phương thức', value: 'Chuyển khoản' },
              { label: 'Khấu trừ', value: req.deduct_method === 'split' ? `Chia ${req.deduct_months} tháng` : 'Trừ 1 lần' },
              { label: 'Người duyệt', value: req.reviewer?.name || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-[13px]">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Deducting history */}
        {(isDeducting || isCompleted) && req.deduct_months > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3 pb-2.5 border-b border-gray-100">Lịch sử khấu trừ</h3>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: req.deduct_months }).map((_, i) => {
                const done = i < deductedMonths;
                const perMonth = Math.round(amount / req.deduct_months);
                const d = new Date(new Date(req.created_at).getFullYear(), new Date(req.created_at).getMonth() + 1 + i, 1);
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${done ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="text-gray-700">Lương tháng <strong>{d.getMonth() + 1}/{d.getFullYear()}</strong></span>
                    </div>
                    <span className={`font-mono font-semibold ${done ? 'text-green-600 line-through' : 'text-gray-400'}`}>
                      -{fmtMoney(perMonth)} ₫
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-3">
              Đã khấu trừ:{' '}
              <strong className="font-mono text-gray-900">{fmtMoney(req.deducted_so_far)} ₫</strong>
              {' '}/ <strong className="font-mono">{fmtMoney(amount)} ₫</strong>
            </p>
          </div>
        )}

        {/* Reject reason */}
        {req.status === 'rejected' && req.reject_reason && (
          <div className="bg-red-50 border border-l-4 border-red-200 border-l-red-500 rounded-lg p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-red-800 mb-1.5">Lý do từ chối</h3>
            <p className="text-[13px] text-red-700 leading-relaxed">{req.reject_reason}</p>
            {req.reviewer?.name && (
              <p className="text-[11px] text-red-500 mt-2">Từ chối bởi: {req.reviewer.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      {isPending && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500 whitespace-nowrap">Ngày chuyển khoản:</label>
            <input
              type="date"
              value={disburseDate}
              onChange={(e) => setDisburseDate(e.target.value)}
              className="h-9 px-2.5 border border-gray-300 rounded-md font-mono text-[12px] text-gray-900 outline-none focus:border-navy-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onReject(req)}
              disabled={submitting}
              className="h-10 px-4 text-[14px] font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting ? <RotateCcw size={14} className="animate-spin" /> : <XCircle size={15} />}
              Từ chối
            </button>
            <button
              onClick={() => onApprove(req, { disburse_date: disburseDate, deduct_method: method, deduct_months: months })}
              disabled={submitting || overLimit}
              className="h-10 px-4 text-[14px] font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 flex items-center gap-1.5"
              title={overLimit ? 'Vượt hạn mức — cần ngoại lệ từ Manager' : ''}
            >
              {submitting ? <RotateCcw size={14} className="animate-spin" /> : <Check size={15} />}
              Duyệt & Chuyển khoản
            </button>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-4 flex items-center justify-between">
          <p className="text-[13px] text-gray-500">Sẵn sàng chi cho <strong>{empName}</strong></p>
          <button
            onClick={() => onDisburse(req)}
            disabled={submitting}
            className="h-10 px-4 text-[14px] font-semibold rounded-md bg-navy-700 hover:bg-navy-800 text-white disabled:opacity-60 flex items-center gap-1.5"
          >
            {submitting ? <RotateCcw size={14} className="animate-spin" /> : <Wallet size={15} />}
            Đánh dấu đã chi
          </button>
        </div>
      )}
    </div>
  );
}

// ── TABS config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'pending',   label: 'Chờ duyệt' },
  { key: 'approved',  label: 'Chờ chi' },
  { key: 'deducting', label: 'Đang khấu trừ' },
  { key: 'completed', label: 'Lịch sử' },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdvancesPage() {
  const [tab, setTab]           = useState('pending');
  const [rows, setRows]         = useState([]);
  const [stats, setStats]       = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadErr, setLoadErr]   = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');

  const showToast = (type, title, body = '') => {
    setToast({ type, title, body });
  };

  // Load stats + employees once
  useEffect(() => {
    getAdvanceStats().then((r) => setStats(r.data.data)).catch(() => {});
    getAdvanceEmployees().then((r) => setEmployees(r.data.data)).catch(() => {});
  }, []);

  // Load list when tab changes
  useEffect(() => {
    setLoadErr('');
    setLoading(true);
    setSelectedId(null);
    setSearch('');
    getAdvances({ status: tab })
      .then((r) => {
        setRows(r.data.data);
        if (r.data.data.length > 0) setSelectedId(r.data.data[0].id);
      })
      .catch(() => setLoadErr('Không tải được dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      r.requester?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const selectedReq = rows.find((r) => r.id === selectedId) || null;

  // ── Handlers
  const handleApprove = async (req, opts) => {
    setSubmitting(true);
    try {
      const res = await approveAdvance(req.id, opts);
      const updated = res.data.data;
      setRows((p) => p.filter((r) => r.id !== req.id));
      setSelectedId(null);
      setStats((s) => ({ ...s, pending: Math.max(0, (s.pending || 0) - 1), approved: (s.approved || 0) + 1 }));
      showToast('success', 'Đã duyệt tạm ứng', `${updated.requester?.name || ''} sẽ nhận ${fmtMoney(updated.amount)} ₫.`);
    } catch (err) {
      showToast('error', 'Lỗi duyệt đơn', err.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectOpen = (req) => {
    setRejectTarget(req);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (reason) => {
    setSubmitting(true);
    try {
      await rejectAdvance(rejectTarget.id, { reject_reason: reason });
      setRows((p) => p.filter((r) => r.id !== rejectTarget.id));
      setSelectedId(null);
      setStats((s) => ({ ...s, pending: Math.max(0, (s.pending || 0) - 1) }));
      showToast('success', 'Đã từ chối đơn', `Email thông báo đã gửi cho ${rejectTarget.requester?.name}.`);
    } catch (err) {
      showToast('error', 'Lỗi từ chối đơn', err.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
      setRejectTarget(null);
    }
  };

  const handleDisburse = async (req) => {
    setSubmitting(true);
    try {
      await disburseAdvance(req.id);
      setRows((p) => p.filter((r) => r.id !== req.id));
      setSelectedId(null);
      setStats((s) => ({ ...s, approved: Math.max(0, (s.approved || 0) - 1), deducting: (s.deducting || 0) + 1 }));
      showToast('success', 'Đã đánh dấu đã chi', `Bắt đầu khấu trừ từ lương của ${req.requester?.name}.`);
    } catch (err) {
      showToast('error', 'Lỗi chi tiền', err.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreated = (newRow) => {
    if (newRow.status === tab) {
      setRows((p) => [newRow, ...p]);
      setSelectedId(newRow.id);
    }
    setStats((s) => ({ ...s, pending: (s.pending || 0) + 1 }));
    showToast('success', 'Đã tạo đơn tạm ứng', `Mã đơn: ${newRow.code || newRow.id}`);
  };

  const tabCount = (key) => {
    const map = { pending: stats.pending, approved: stats.approved, deducting: stats.deducting, completed: stats.completed };
    return map[key] ?? '—';
  };

  return (
    <div className="flex h-full overflow-hidden -m-6">
      <style>{`
        @keyframes scale-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes slide-in-right{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="w-[380px] min-w-[380px] flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[20px] font-semibold text-gray-900">Tạm ứng lương</h1>
          </div>
          <p className="text-[13px] text-gray-500">Tháng {new Date().toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}</p>

          {/* Quick stats */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { dot: 'bg-amber-500', label: 'chờ duyệt', count: stats.pending },
              { dot: 'bg-green-500', label: 'chờ chi',   count: stats.approved },
              { label: 'Tháng:', count: stats.monthTotal ? fmtMoneyShort(stats.monthTotal) : '—', mono: true },
            ].map(({ dot, label, count, mono }) => (
              <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-700">
                {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                <strong className={mono ? 'font-mono' : ''}>{count ?? '—'}</strong> {label}
              </span>
            ))}
          </div>

          {/* Pill tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-md p-1 mt-3">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 h-[30px] rounded text-[11px] font-medium whitespace-nowrap px-1 transition-all ${tab === key ? 'bg-white shadow-sm text-gray-900' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {label} ({tabCount(key)})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-full h-8 pl-7 pr-3 border border-gray-200 rounded-md text-[12px] text-gray-900 bg-white focus:outline-none focus:border-navy-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RotateCcw size={18} className="animate-spin text-gray-400" />
            </div>
          )}
          {!loading && loadErr && (
            <div className="text-center py-10 text-[13px] text-red-500">{loadErr}</div>
          )}
          {!loading && !loadErr && filtered.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">
              Không có đơn nào trong tab này.
            </div>
          )}
          {!loading && !loadErr && filtered.map((req) => {
            const empName = req.requester?.name || '—';
            const empTitle = req.requester?.Profile?.job_title || req.requester?.Profile?.department || '';
            const isSelected = req.id === selectedId;
            return (
              <div
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={`p-3.5 border rounded-lg cursor-pointer mb-2 transition-all border-l-[3px] ${
                  isSelected
                    ? 'bg-navy-50 border-navy-300 border-l-navy-700'
                    : 'bg-white border-gray-200 border-l-transparent hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[15px] font-bold text-amber-700 flex-1">
                    {fmtMoney(req.amount)} ₫
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {req.urgent && (
                      <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">KHẨN</span>
                    )}
                    <span className="text-[11px] text-gray-400">{timeAgo(req.created_at)}</span>
                  </div>
                </div>
                {/* Employee */}
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={empName} size={22} />
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 leading-tight">{empName}</p>
                    {empTitle && <p className="text-[11px] text-gray-500 leading-tight">{empTitle}</p>}
                  </div>
                </div>
                {/* Reason */}
                <p className="text-[12px] text-gray-600 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {req.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <DetailPanel
        req={selectedReq}
        onApprove={handleApprove}
        onReject={handleRejectOpen}
        onDisburse={handleDisburse}
        submitting={submitting}
      />

      {/* Reject modal */}
      {showRejectModal && (
        <RejectModal
          req={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => { setShowRejectModal(false); setRejectTarget(null); }}
          loading={submitting}
        />
      )}

      {/* Toast */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
