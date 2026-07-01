import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Pencil, Trash2, Clock, AlertTriangle } from 'lucide-react';
import hrService from '../../services/hr.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const CONTRACT_TYPE_LABEL = { 
  'Thử việc': 'Thử việc', 
  'Chính thức': 'Chính thức',
  'Thời vụ': 'Thời vụ',
  probation: 'Thử việc', 
  official: 'Chính thức' 
};
const CONTRACT_TYPE_VARIANT = { 
  'Thử việc': 'info', 
  'Chính thức': 'brand',
  'Thời vụ': 'neutral',
  probation: 'info', 
  official: 'brand' 
};

const STATUS_CONFIG = {
  active:     { label: 'Đang hiệu lực', variant: 'success' },
  expired:    { label: 'Hết hạn',       variant: 'warning' },
  terminated: { label: 'Đã chấm dứt',   variant: 'danger' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtCurrency = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

function daysUntilExpiry(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 86_400_000);
}

const inputClass = "w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors";
const labelClass = "block text-[12px] font-medium text-gray-700 mb-1.5";

const Modal = ({ title, sub, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 overflow-hidden">
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
          {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const ContractManager = () => {
  const [allContracts, setAllContracts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [onlyExpiring, setOnlyExpiring] = useState(false);
  const [toast, setToast] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);

  const emptyForm = { user_id: '', contract_number: '', contract_type: 'Thử việc', start_date: '', end_date: '', basic_salary: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [extendData, setExtendData] = useState({ end_date: '', basic_salary: '', contract_type: '', status: '' });
  const [empSearch, setEmpSearch] = useState('');
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrService.getAllContracts();
      const data = res.data.contracts || [];
      setAllContracts(data);
      setContracts(data);
    } catch {
      setAllContracts([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await hrService.getAllEmployees();
      setEmployees(res.data.employees || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadContracts(); loadEmployees(); }, [loadContracts, loadEmployees]);

  useEffect(() => {
    let data = allContracts;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(c =>
        (c.user?.Profile?.full_name || c.user?.name || '').toLowerCase().includes(q) ||
        (c.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (filterType) data = data.filter(c => c.contract_type === filterType);
    if (filterStatus) data = data.filter(c => c.status === filterStatus);
    if (onlyExpiring) data = data.filter(c => {
      const d = daysUntilExpiry(c.end_date);
      return d !== null && d > 0 && d <= 60;
    });
    setContracts(data);
  }, [search, filterType, filterStatus, onlyExpiring, allContracts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await hrService.createContract(formData);
      showToast('success', 'Tạo hợp đồng thành công!');
      setShowCreate(false);
      setFormData(emptyForm);
      setEmpSearch('');
      loadContracts();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi tạo hợp đồng');
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (extendData.end_date) payload.end_date = extendData.end_date;
      if (extendData.basic_salary) payload.basic_salary = extendData.basic_salary;
      if (extendData.contract_type) payload.contract_type = extendData.contract_type;
      if (extendData.status) payload.status = extendData.status;
      await hrService.extendContract(selectedContract.id, payload);
      showToast('success', 'Cập nhật hợp đồng thành công!');
      setShowExtend(false);
      setSelectedContract(null);
      loadContracts();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi cập nhật hợp đồng');
    }
  };

  const openExtend = (contract) => {
    setSelectedContract(contract);
    setExtendData({ end_date: contract.end_date || '', basic_salary: contract.basic_salary || '', contract_type: contract.contract_type || '', status: contract.status || '' });
    setShowExtend(true);
  };

  const handleDelete = async () => {
    if (!contractToDelete) return;
    try {
      await hrService.deleteContract(contractToDelete.id);
      showToast('success', `Đã xóa hợp đồng ${contractToDelete.contract_number}`);
      setShowConfirmDelete(false);
      setContractToDelete(null);
      loadContracts();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi xóa hợp đồng');
    }
  };

  const expiringCount = allContracts.filter(c => { const d = daysUntilExpiry(c.end_date); return d !== null && d > 0 && d <= 60; }).length;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-md shadow-lg text-[13px] font-medium
          ${toast.type === 'success' ? 'bg-success-600 text-white' : 'bg-danger-600 text-white'}`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Hợp đồng lao động</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-mono tabular-nums font-medium text-gray-700">{allContracts.length}</span> hợp đồng trong hệ thống
          </p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setShowCreate(true); }}
          className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors active:scale-[.98] shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          Tạo hợp đồng mới
        </button>
      </div>

      {/* Expiring callout */}
      {expiringCount > 0 && (
        <div className="flex items-center justify-between border-l-[3px] border-warning-500 bg-warning-50 rounded-md px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} strokeWidth={1.75} className="text-warning-600 shrink-0" />
            <span className="text-[13px] text-warning-700">
              <strong>{expiringCount} hợp đồng</strong> sẽ hết hạn trong 60 ngày tới — cần gia hạn hoặc thông báo
            </span>
          </div>
          <button
            onClick={() => setOnlyExpiring(true)}
            className="text-[12px] font-medium text-warning-700 hover:underline shrink-0"
          >
            Xem ngay →
          </button>
        </div>
      )}

      {/* KPI mini cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tổng hợp đồng',  value: allContracts.length },
          { label: 'Đang hiệu lực',  value: allContracts.filter(c => c.status === 'active').length,     success: true },
          { label: 'Hết hạn',         value: allContracts.filter(c => c.status === 'expired').length,    warning: true },
          { label: 'Đã chấm dứt',    value: allContracts.filter(c => c.status === 'terminated').length, danger: true },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-2">{k.label}</p>
            <p className={`font-mono tabular-nums text-[28px] font-bold leading-none tracking-[-0.02em]
              ${k.success ? 'text-success-600' : k.warning ? 'text-warning-600' : k.danger ? 'text-danger-600' : 'text-gray-900'}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên hoặc email nhân viên..."
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors"
        >
          <option value="">Loại HĐ</option>
          <option value="Thử việc">Thử việc</option>
          <option value="Chính thức">Chính thức</option>
          <option value="Thời vụ">Thời vụ</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors"
        >
          <option value="">Trạng thái</option>
          <option value="active">Đang hiệu lực</option>
          <option value="expired">Hết hạn</option>
          <option value="terminated">Đã chấm dứt</option>
        </select>
        {(search || filterType || filterStatus || onlyExpiring) && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setOnlyExpiring(false); }}
            className="h-9 px-3 text-[12px] text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            <div className="h-10 bg-gray-50 border-b border-gray-200 animate-pulse" />
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="h-14 border-b border-gray-100 px-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-gray-400">Không tìm thấy hợp đồng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Nhân viên', 'Số HĐ', 'Loại', 'Từ ngày', 'Đến ngày', 'Lương cơ bản', 'Còn lại', 'Trạng thái', ''].map(col => (
                    <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const stCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.active;
                  const typCfg = CONTRACT_TYPE_VARIANT[c.contract_type] || 'neutral';
                  const user = c.user;
                  const days = daysUntilExpiry(c.end_date);
                  const expiring = days !== null && days > 0 && days <= 60;
                  const expired  = days !== null && days <= 0;

                  return (
                    <tr key={c.id} className={`h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${expiring ? 'bg-warning-50/50' : ''}`}>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user?.Profile?.full_name || user?.name || user?.email || '?'} size="sm" />
                          <div>
                            <p className="text-[13px] font-medium text-gray-900 leading-tight">{user?.Profile?.full_name || user?.name || '—'}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">{user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-700">{c.contract_number}</span>
                      </td>
                      <td className="px-4">
                        <Badge variant={typCfg} size="sm">{CONTRACT_TYPE_LABEL[c.contract_type] || c.contract_type}</Badge>
                      </td>
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-600">{fmt(c.start_date)}</span>
                      </td>
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-600">{fmt(c.end_date)}</span>
                      </td>
                      <td className="px-4 text-right">
                        <span className="font-mono tabular-nums text-[13px] font-medium text-gray-800">{fmtCurrency(c.basic_salary)}</span>
                      </td>
                      <td className="px-4">
                        {days === null ? (
                          <span className="text-[12px] text-gray-400">—</span>
                        ) : expired ? (
                          <span className="flex items-center gap-1 text-[12px] text-danger-600 font-medium">
                            <Clock size={12} strokeWidth={2} />Hết hạn
                          </span>
                        ) : expiring ? (
                          <span className="flex items-center gap-1 text-[12px] text-warning-600 font-medium">
                            <Clock size={12} strokeWidth={2} />{days} ngày
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums text-[12px] text-gray-500">{days} ngày</span>
                        )}
                      </td>
                      <td className="px-4">
                        <Badge variant={stCfg.variant} size="sm">{stCfg.label}</Badge>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openExtend(c)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                          >
                            <Pencil size={13} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => { setContractToDelete(c); setShowConfirmDelete(true); }}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                          </button>
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

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Tạo hợp đồng lao động mới" sub="Hệ thống sẽ lưu thông tin hợp đồng vào hồ sơ nhân viên" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelClass}>Nhân viên</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Gõ tên hoặc email để tìm..."
                  value={empSearch}
                  required={!formData.user_id}
                  onFocus={() => setEmpDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setEmpDropdownOpen(false), 150)}
                  onChange={e => {
                    setEmpSearch(e.target.value);
                    setFormData({ ...formData, user_id: '' });
                    setEmpDropdownOpen(true);
                  }}
                />
                {empDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {employees
                      .filter(emp => {
                        const q = empSearch.toLowerCase();
                        const fullName = emp.Profile?.full_name || emp.name || '';
                        return !q || fullName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
                      })
                      .map(emp => {
                        const nameToDisplay = emp.Profile?.full_name || emp.name || emp.email;
                        const deptName = emp.department?.name || emp.department || '';
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            onMouseDown={() => {
                              setFormData({ ...formData, user_id: emp.id });
                              setEmpSearch(`${nameToDisplay}${deptName ? ' · ' + deptName : ''}`);
                              setEmpDropdownOpen(false);
                            }}
                          >
                            <Avatar name={nameToDisplay} size="xs" />
                            <span>
                              <p className="font-medium text-gray-800">{nameToDisplay}</p>
                              <p className="text-[11px] text-gray-400">{emp.email}</p>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Số hợp đồng</label>
                <input type="text" className={inputClass} required placeholder="HĐ-2026-001"
                  value={formData.contract_number}
                  onChange={e => setFormData({ ...formData, contract_number: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Loại hợp đồng</label>
                <select className={inputClass} value={formData.contract_type}
                  onChange={e => setFormData({ ...formData, contract_type: e.target.value })}>
                  <option value="Thử việc">Thử việc</option>
                  <option value="Chính thức">Chính thức</option>
                  <option value="Thời vụ">Thời vụ</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Ngày bắt đầu</label>
                <input type="date" className={inputClass} required
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Ngày kết thúc</label>
                <input type="date" className={inputClass}
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Lương cơ bản (VND)</label>
              <input type="number" className={inputClass} required placeholder="10000000"
                value={formData.basic_salary}
                onChange={e => setFormData({ ...formData, basic_salary: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button type="submit"
                className="flex-1 h-10 bg-accent-600 hover:bg-accent-700 text-white text-[13px] font-semibold rounded-md transition-colors">
                Tạo hợp đồng
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Extend Modal */}
      {showExtend && selectedContract && (
        <Modal
          title="Cập nhật hợp đồng"
          sub={`${selectedContract.User?.name || selectedContract.User?.email} · ${selectedContract.contract_number}`}
          onClose={() => setShowExtend(false)}
        >
          <form onSubmit={handleExtend} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Loại hợp đồng</label>
                <select className={inputClass} value={extendData.contract_type}
                  onChange={e => setExtendData({ ...extendData, contract_type: e.target.value })}>
                  <option value="">— Không thay đổi —</option>
                  <option value="Thử việc">Thử việc</option>
                  <option value="Chính thức">Chính thức</option>
                  <option value="Thời vụ">Thời vụ</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Trạng thái</label>
                <select className={inputClass} value={extendData.status}
                  onChange={e => setExtendData({ ...extendData, status: e.target.value })}>
                  <option value="">— Không thay đổi —</option>
                  <option value="active">Đang hiệu lực</option>
                  <option value="expired">Hết hạn</option>
                  <option value="terminated">Đã chấm dứt</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Ngày kết thúc mới</label>
                <input type="date" className={inputClass} value={extendData.end_date}
                  onChange={e => setExtendData({ ...extendData, end_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Lương cơ bản mới (VND)</label>
                <input type="number" className={inputClass} placeholder="Để trống nếu không đổi"
                  value={extendData.basic_salary}
                  onChange={e => setExtendData({ ...extendData, basic_salary: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowExtend(false)}
                className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button type="submit"
                className="flex-1 h-10 bg-navy-700 hover:bg-navy-800 text-white text-[13px] font-semibold rounded-md transition-colors">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {showConfirmDelete && contractToDelete && (
        <Modal title="Xác nhận xóa hợp đồng" onClose={() => setShowConfirmDelete(false)}>
          <div className="space-y-4">
            <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded px-4 py-3 text-[13px] text-danger-700">
              Hành động này không thể hoàn tác. Bạn có chắc muốn xóa hợp đồng{' '}
              <strong className="font-mono">{contractToDelete.contract_number}</strong>{' '}
              của <strong>{contractToDelete.User?.name || contractToDelete.User?.email}</strong>?
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDelete(false)}
                className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-10 bg-danger-600 hover:bg-danger-700 text-white text-[13px] font-semibold rounded-md transition-colors">
                Xóa hợp đồng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractManager;
