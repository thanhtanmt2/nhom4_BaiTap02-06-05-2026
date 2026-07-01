import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  TrendingUp, TrendingDown, History, Plus, Download, Search,
  ChevronDown, RotateCcw, Trash2, Pencil, X, Check, AlertTriangle,
} from 'lucide-react';
import {
  getAdjustments,
  getAdjustmentEmployees,
  createAdjustment,
  updateAdjustmentStatus,
  deleteAdjustment,
} from '../../services/adjustment.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n) =>
  Number(n).toLocaleString('vi-VN');

const monthLabel = (ym) => {
  // "2026-05" → "Tháng 5/2026"
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `Tháng ${parseInt(m, 10)}/${y}`;
};

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Tạo danh sách 12 tháng gần đây để lọc
const buildMonthOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value: ym, label: monthLabel(ym) });
  }
  return opts;
};

const INCOME_TYPES = [
  'Thưởng dự án', 'Thưởng KPI', 'Phụ cấp ăn trưa', 'Phụ cấp đi lại',
  'Phụ cấp điện thoại', 'Phụ cấp xăng xe', 'Hoa hồng', 'Thưởng khác',
];
const DEDUCT_TYPES = [
  'Phạt đi trễ', 'Phạt vi phạm', 'Đền bù thiết bị', 'Đền bù khác', 'Hoàn ứng',
];

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLORS = ['#1E3A6B', '#0891B2', '#7C3AED', '#0D9488', '#BE185D', '#A16207'];
const avBg = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

function Avatar({ name = '', size = 28 }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%',
        background: avBg(name), color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
        border: '1px solid rgba(0,0,0,.06)',
      }}
    >
      {initials(name)}
    </span>
  );
}

// ── FilterChip ────────────────────────────────────────────────────────────────
function FilterChip({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const ref = useRef(null);
  useEffect(() => setDraft(selected), [selected]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setDraft(selected); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, selected]);
  const toggle = (opt) => setDraft((p) => p.includes(opt) ? p.filter((v) => v !== opt) : [...p, opt]);
  const applied = selected.length > 0;
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => { setOpen((v) => !v); setDraft(selected); }}
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12px] font-medium transition-colors ${applied ? 'bg-navy-50 border-navy-300 text-navy-700' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}
      >
        {label}
        {applied && (
          <span className="bg-navy-700 text-white text-[9px] font-bold px-1 rounded-full leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown size={11} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.08)', minWidth: 180, padding: 4 }}>
          {options.map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 4, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.includes(opt)} onChange={() => toggle(opt)} style={{ accentColor: '#1E3A6B' }} />
              {opt}
            </label>
          ))}
          <div style={{ display: 'flex', gap: 4, padding: '6px 4px 2px', borderTop: '1px solid #f0f0f0', marginTop: 2 }}>
            <button onClick={() => { onChange([]); setOpen(false); }} style={{ flex: 1, padding: '3px', fontSize: 11, border: '1px solid #d1d5db', background: '#fff', borderRadius: 4, fontFamily: 'inherit', cursor: 'pointer' }}>Xoá</button>
            <button onClick={() => { onChange(draft); setOpen(false); }} style={{ flex: 1, padding: '3px', fontSize: 11, border: 'none', background: '#1E3A6B', color: '#fff', borderRadius: 4, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Áp dụng</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AddModal ──────────────────────────────────────────────────────────────────
function AddModal({ defaultKind = 'income', employees, onClose, onCreated }) {
  const [kind, setKind] = useState(defaultKind);
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    category: '',
    amount: '',
    apply_month: currentYearMonth(),
    reason: '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.user_id || !form.category || !form.amount || !form.apply_month) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (Number(form.amount) <= 0) {
      setError('Số tiền phải lớn hơn 0.');
      return;
    }
    setLoading(true);
    try {
      const res = await createAdjustment({
        kind,
        user_id: Number(form.user_id),
        category: form.category,
        amount: Number(form.amount),
        apply_month: form.apply_month,
        reason: form.reason,
        recurring,
      });
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Tạo danh sách 12 tháng gần đây
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(15,23,42,.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] flex flex-col" style={{ maxHeight: '90vh', animation: 'scale-in 200ms ease' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[17px] font-semibold text-gray-900">Thêm khoản phát sinh</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-md"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-md p-1">
            {[{ v: 'income', label: 'Thu nhập thêm', icon: TrendingUp, cls: 'text-green-700' }, { v: 'deduction', label: 'Khấu trừ', icon: TrendingDown, cls: 'text-red-600' }].map(({ v, label, icon: Icon, cls }) => (
              <button
                key={v}
                onClick={() => { setKind(v); set('category', ''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded text-[13px] font-medium transition-all ${kind === v ? `bg-white shadow-sm ${cls}` : 'text-gray-500'}`}
              >
                <Icon size={13} strokeWidth={1.75} /> {label}
              </button>
            ))}
          </div>

          {/* Nhân viên */}
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
                </option>
              ))}
            </select>
          </div>

          {/* Loại khoản */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Loại {kind === 'income' ? 'thu nhập' : 'khấu trừ'} <span className="text-red-500">*</span></label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-[14px] text-gray-900 bg-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
            >
              <option value="">Chọn loại...</option>
              {(kind === 'income' ? INCOME_TYPES : DEDUCT_TYPES).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Số tiền */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Số tiền <span className="text-red-500">*</span></label>
              <div className="flex">
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder="0"
                  className="flex-1 h-10 px-3 border border-gray-300 border-r-0 rounded-l-md text-[14px] font-mono text-gray-900 bg-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
                />
                <div className="h-10 px-3 bg-gray-50 border border-gray-300 rounded-r-md flex items-center text-[13px] text-gray-500">VNĐ</div>
              </div>
            </div>

            {/* Tháng áp dụng */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Tháng áp dụng <span className="text-red-500">*</span></label>
              <select
                value={form.apply_month}
                onChange={(e) => set('apply_month', e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-[14px] text-gray-900 bg-white focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Lý do</label>
            <textarea
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="VD: Hoàn thành xuất sắc sprint Q2..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 bg-white resize-none focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/15"
            />
          </div>

          {/* Toggle lặp lại */}
          <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setRecurring((v) => !v)}
              className={`w-8 h-5 rounded-full relative transition-colors flex-shrink-0 mt-0.5 ${recurring ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${recurring ? 'left-3.5' : 'left-0.5'}`} />
            </button>
            <div>
              <p className="text-[14px] font-medium text-gray-900">Lặp lại hàng tháng</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Khoản này sẽ tự động áp dụng mỗi tháng cho đến khi tắt.</p>
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
            Thêm khoản
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdjustmentsPage() {
  const { user } = useSelector((s) => s.auth);
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [tab, setTab] = useState('income');       // 'income' | 'deduction' | 'history'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState([]);
  const [monthFilter, setMonthFilter] = useState(currentYearMonth());
  const [selected, setSelected] = useState(new Set());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch employees list once
  useEffect(() => {
    getAdjustmentEmployees()
      .then((r) => setEmployees(r.data.data))
      .catch(() => {});
  }, []);

  // ── Fetch adjustments whenever tab / monthFilter changes
  useEffect(() => {
    if (tab === 'history') return;
    setLoadErr('');
    setLoading(true);
    setSelected(new Set());
    setTypeFilter([]);
    getAdjustments({ kind: tab === 'income' ? 'income' : 'deduction', apply_month: monthFilter })
      .then((r) => setRows(r.data.data))
      .catch(() => setLoadErr('Không tải được dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [tab, monthFilter]);

  // ── Derived filtered data
  const filtered = useMemo(() => {
    let list = rows;
    if (search) list = list.filter((r) => r.employee?.name?.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter.length) list = list.filter((r) => typeFilter.includes(r.category));
    return list;
  }, [rows, search, typeFilter]);

  // ── KPI totals (always from all loaded rows, not filtered)
  const incomeRows = tab === 'income' ? rows : [];
  const deductRows = tab === 'deduction' ? rows : [];
  const totalIncome = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
  const totalDeduct = deductRows.reduce((s, r) => s + Number(r.amount), 0);
  const recurringCount = rows.filter((r) => r.recurring).length;

  // ── Select helpers
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleSelect = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (allSelected) setSelected((p) => { const n = new Set(p); filtered.forEach((r) => n.delete(r.id)); return n; });
    else setSelected((p) => { const n = new Set(p); filtered.forEach((r) => n.add(r.id)); return n; });
  };

  // ── Actions
  const handleCreated = (newRow) => {
    // Thêm vào đầu danh sách nếu đúng tab + tháng
    if (newRow.kind === tab && newRow.apply_month === monthFilter) {
      setRows((p) => [newRow, ...p]);
    }
  };

  const handleApply = async (id) => {
    try {
      await updateAdjustmentStatus(id, 'applied');
      setRows((p) => p.map((r) => r.id === id ? { ...r, status: 'applied' } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi áp dụng khoản');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa khoản này?')) return;
    try {
      await deleteAdjustment(id);
      setRows((p) => p.filter((r) => r.id !== id));
      setSelected((p) => { const n = new Set(p); n.delete(id); return n; });
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa khoản');
    }
  };

  const handleBulkApply = async () => {
    const ids = [...selected].filter((id) => {
      const r = rows.find((rr) => rr.id === id);
      return r && r.status === 'pending';
    });
    if (!ids.length) { alert('Không có khoản nào ở trạng thái Chờ áp dụng.'); return; }
    if (!window.confirm(`Áp dụng ${ids.length} khoản vào bảng lương?`)) return;
    await Promise.all(ids.map((id) => updateAdjustmentStatus(id, 'applied').catch(() => {})));
    setRows((p) => p.map((r) => ids.includes(r.id) ? { ...r, status: 'applied' } : r));
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = [...selected].filter((id) => {
      const r = rows.find((rr) => rr.id === id);
      return r && r.status === 'pending';
    });
    if (!ids.length) { alert('Chỉ xóa được khoản ở trạng thái Chờ áp dụng.'); return; }
    if (!window.confirm(`Xóa ${ids.length} khoản?`)) return;
    await Promise.all(ids.map((id) => deleteAdjustment(id).catch(() => {})));
    setRows((p) => p.filter((r) => !ids.includes(r.id)));
    setSelected(new Set());
  };

  return (
    <div className="space-y-5">
      <style>{`@keyframes scale-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">
            Khoản thu nhập / khấu trừ phát sinh
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthLabel(monthFilter)} · Áp dụng vào bảng lương tháng đang tính
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
          >
            <Plus size={14} strokeWidth={2} /> Thêm khoản
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tổng thu nhập thêm', value: `+${fmtMoney(totalIncome)} ₫`, cls: 'text-green-700', sub: `${tab === 'income' ? rows.length : '—'} khoản · ${monthLabel(monthFilter)}` },
          { label: 'Tổng khấu trừ', value: `-${fmtMoney(totalDeduct)} ₫`, cls: 'text-red-600', sub: `${tab === 'deduction' ? rows.length : '—'} khoản · ${monthLabel(monthFilter)}` },
          { label: 'Net phát sinh', value: `${fmtMoney(totalIncome - totalDeduct)} ₫`, cls: 'text-gray-900', sub: 'Tác động vào quỹ lương' },
          { label: 'Khoản định kỳ', value: `${recurringCount}`, cls: 'text-gray-900', sub: 'Tự động áp dụng hàng tháng', suffix: ' khoản' },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500 mb-2">{c.label}</p>
            <p className={`font-mono text-[20px] font-bold leading-none tracking-tight ${c.cls}`}>
              {c.value}{c.suffix || ''}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-0">
        {[
          { key: 'income',    label: 'Thu nhập thêm',   icon: TrendingUp },
          { key: 'deduction', label: 'Khấu trừ',        icon: TrendingDown },
          { key: 'history',   label: 'Lịch sử thay đổi', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(''); setTypeFilter([]); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors -mb-px ${tab === key ? 'text-gray-900 border-navy-700' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            <Icon size={15} strokeWidth={1.75} /> {label}
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-navy-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {key === 'history' ? '—' : (tab === key ? filtered.length : '—')}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar (chỉ hiện khi không phải tab history) */}
      {tab !== 'history' && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex gap-2.5 items-center flex-wrap">
          <div className="relative flex items-center w-[240px] h-8 border border-gray-300 rounded-md focus-within:border-navy-500 bg-white">
            <Search size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-full h-full bg-transparent border-none outline-none pl-7 pr-2 text-[12px] text-gray-900"
            />
          </div>

          <FilterChip
            label="Loại"
            options={tab === 'income' ? INCOME_TYPES : DEDUCT_TYPES}
            selected={typeFilter}
            onChange={setTypeFilter}
          />

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-8 px-2.5 border border-gray-300 rounded-md text-[12px] text-gray-700 bg-white focus:outline-none focus:border-navy-500"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {(search || typeFilter.length > 0) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter([]); }}
              className="h-8 px-2.5 text-[12px] text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1"
            >
              <X size={11} /> Xoá lọc
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {tab === 'history' ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-[11px] font-bold uppercase tracking-[.05em] text-gray-400">Hoạt động gần nhất</span>
          </div>
          <div className="divide-y divide-gray-100">
            {rows.slice(0, 20).length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-[13px]">Chưa có hoạt động nào.</p>
            ) : (
              rows.slice(0, 20).map((r) => (
                <div key={r.id} className="flex gap-3.5 px-5 py-3.5">
                  <Avatar name={r.enteredBy?.name || 'System'} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-relaxed">
                      <strong className="text-gray-900">{r.enteredBy?.name || 'System'}</strong>{' '}
                      <span className="text-gray-600">thêm khoản</span>{' '}
                      <span className={r.kind === 'income' ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                        {r.category} · {r.kind === 'income' ? '+' : '-'}{fmtMoney(r.amount)} ₫
                      </span>{' '}
                      <span className="text-gray-500">cho</span>{' '}
                      <span className="text-navy-700 font-medium">{r.employee?.name}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                      {new Date(r.created_at).toLocaleString('vi-VN')} · {monthLabel(r.apply_month)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-9 pl-5 pr-2 py-3 text-left">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#1E3A6B' }} />
                  </th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ minWidth: 180 }}>Nhân viên</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ width: 160 }}>Loại</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-right" style={{ width: 140 }}>Số tiền</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ minWidth: 200 }}>Lý do</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ width: 120 }}>Tháng</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ width: 130 }}>Người nhập</th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-[.05em] text-gray-400 text-left" style={{ width: 120 }}>Trạng thái</th>
                  <th className="w-16 pr-4" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <RotateCcw size={18} className="animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-[13px] text-gray-400">Đang tải...</p>
                    </td>
                  </tr>
                )}
                {!loading && loadErr && (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <AlertTriangle size={18} className="text-amber-500 mx-auto mb-2" />
                      <p className="text-[13px] text-red-600">{loadErr}</p>
                    </td>
                  </tr>
                )}
                {!loading && !loadErr && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <p className="text-[13px] text-gray-400">Không có khoản nào{search || typeFilter.length ? ' khớp bộ lọc' : ' trong tháng này'}.</p>
                    </td>
                  </tr>
                )}
                {!loading && !loadErr && filtered.map((r) => {
                  const isIncome = r.kind === 'income';
                  const empName = r.employee?.name || '—';
                  const empTitle = r.employee?.Profile?.job_title || r.employee?.Profile?.department || '';
                  const enterer = r.enteredBy?.name;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${selected.has(r.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <td className="pl-5 pr-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ accentColor: '#1E3A6B' }} />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={empName} size={28} />
                          <div>
                            <p className="text-[13px] font-medium text-gray-900 leading-tight">{empName}</p>
                            {empTitle && <p className="text-[11px] text-gray-500 leading-tight">{empTitle}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-[12px] font-medium text-gray-700">{r.category}</span>
                        {r.recurring && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-medium">
                            <RotateCcw size={9} /> Định kỳ
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-3.5 text-right font-mono text-[13px] font-semibold ${isIncome ? 'text-green-700' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{fmtMoney(r.amount)} ₫
                      </td>
                      <td
                        className="px-3 py-3.5 text-[12px] text-gray-600 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap"
                        title={r.reason}
                      >
                        {r.reason || <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-3 py-3.5 text-[12px] text-gray-700">{monthLabel(r.apply_month)}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          {enterer ? (
                            <>
                              <Avatar name={enterer} size={18} />
                              <span className="text-gray-700">{enterer.split(' ').pop()}</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">System</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${r.status === 'applied' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'applied' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {r.status === 'applied' ? 'Đã áp dụng' : 'Chờ áp dụng'}
                        </span>
                      </td>
                      <td className="pr-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {r.status === 'pending' && (
                            <button
                              title="Áp dụng vào bảng lương"
                              onClick={() => handleApply(r.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {r.status === 'pending' && (
                            <button
                              title="Xóa khoản"
                              onClick={() => handleDelete(r.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {!loading && !loadErr && filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-navy-100">
                    <td colSpan={3} className="pl-5 pr-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Tổng cộng ({filtered.length} khoản)
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-[13px] font-bold ${tab === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                      {tab === 'income' ? '+' : '-'}{fmtMoney(filtered.reduce((s, r) => s + Number(r.amount), 0))} ₫
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && tab !== 'history' && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-lg"
          style={{ animation: 'scale-in 200ms ease' }}
        >
          <span className="text-[13px] font-medium whitespace-nowrap">Đã chọn <strong>{selected.size}</strong> khoản</span>
          <span className="w-px h-5 bg-white/20" />
          <div className="flex gap-1">
            <button
              onClick={handleBulkApply}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded bg-white/10 hover:bg-white/20"
            >
              <Check size={12} /> Áp dụng vào lương
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded bg-red-600/40 hover:bg-red-600/60 text-red-200"
            >
              <Trash2 size={12} /> Xóa
            </button>
          </div>
          <span className="w-px h-5 bg-white/20" />
          <button onClick={() => setSelected(new Set())} className="text-white/50 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <AddModal
          defaultKind={tab === 'deduction' ? 'deduction' : 'income'}
          employees={employees}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
