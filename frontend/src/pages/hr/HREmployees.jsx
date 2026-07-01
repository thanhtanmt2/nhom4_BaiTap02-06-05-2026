import { useState, useEffect, useMemo } from 'react';
import { Search, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import hrService from '../../services/hr.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const ROLE_BADGE = {
  admin:      { label: 'Admin',      variant: 'accent' },
  hr:         { label: 'HR',         variant: 'brand' },
  manager:    { label: 'Quản lý',    variant: 'neutral' },
  accountant: { label: 'Kế toán',    variant: 'info' },
  employee:   { label: 'Nhân viên',  variant: 'neutral' },
  user:       { label: 'Nhân viên',  variant: 'neutral' },
};

const STATUS_BADGE = {
  active:   { label: 'Đang làm', variant: 'success' },
  inactive: { label: 'Nghỉ việc', variant: 'neutral' },
  locked:   { label: 'Khoá',      variant: 'danger' },
};

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hrService.getAllEmployees();
      const list = res.data?.employees || res.data?.data || res.data || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q || (emp.name || emp.username || '').toLowerCase().includes(q) || (emp.email || '').toLowerCase().includes(q);
    const matchRole = !filterRole || emp.role === filterRole;
    const matchStatus = !filterStatus || emp.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  }), [employees, search, filterRole, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Hồ sơ nhân viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-mono tabular-nums font-medium text-gray-700">{employees.length}</span> nhân viên trong hệ thống
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">{error}</div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email..."
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors">
          <option value="">Tất cả vai trò</option>
          <option value="employee">Nhân viên</option>
          <option value="manager">Quản lý</option>
          <option value="hr">HR</option>
          <option value="accountant">Kế toán</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 transition-colors">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang làm</option>
          <option value="inactive">Nghỉ việc</option>
          <option value="locked">Khoá</option>
        </select>
        {(search || filterRole || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
            className="h-9 px-3 text-[12px] text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['ID', 'Nhân viên', 'Email', 'Vai trò', 'Phòng ban', 'Trạng thái', ''].map(col => (
                  <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 6}).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-6 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                        <div className="h-3 w-28 bg-gray-200 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3 w-40 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-18 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-gray-400">
                    {search || filterRole || filterStatus ? 'Không tìm thấy nhân viên nào phù hợp.' : 'Chưa có nhân viên nào.'}
                  </td>
                </tr>
              ) : (
                filtered.map(emp => {
                  const displayName = emp.Profile?.full_name || emp.name || emp.username || emp.email;
                  const roleCfg = ROLE_BADGE[emp.role] || ROLE_BADGE.employee;
                  const stCfg = STATUS_BADGE[emp.status] || STATUS_BADGE.active;
                  return (
                    <tr key={emp.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-400">#{emp.id}</span>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={displayName} size="sm" />
                          <span className="text-[13px] font-medium text-gray-900">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className="text-[12px] text-gray-500">{emp.email}</span>
                      </td>
                      <td className="px-4">
                        <Badge variant={roleCfg.variant} size="sm">{roleCfg.label}</Badge>
                      </td>
                      <td className="px-4">
                        <span className="text-[12px] text-gray-500">{emp.department?.name || emp.department || '—'}</span>
                      </td>
                      <td className="px-4">
                        <Badge variant={stCfg.variant} dot size="sm">{stCfg.label}</Badge>
                      </td>
                      <td className="px-4">
                        <Link to={`/hr/employees/${emp.id}`}
                          className="text-[12px] text-accent-600 hover:text-accent-700 font-medium transition-colors">
                          Chi tiết →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && employees.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
            <p className="text-[12px] text-gray-500">
              Hiển thị <span className="font-mono tabular-nums font-medium text-gray-700">{filtered.length}</span>{' '}
              / <span className="font-mono tabular-nums font-medium text-gray-700">{employees.length}</span> nhân viên
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HREmployees;
