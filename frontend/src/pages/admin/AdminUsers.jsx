import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, X, Camera, UserCheck } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { adminService } from '../../services/admin.service';
import attendanceService from '../../services/attendance.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const EMPTY_FILTERS = {
  search: '',
  role: '',
  status: '',
  department: '',
  created_from: '',
  created_to: '',
};

const ROLE_BADGE = {
  admin:      { label: 'Admin',       variant: 'accent' },
  hr:         { label: 'HR',          variant: 'brand' },
  manager:    { label: 'Quản lý',     variant: 'neutral' },
  accountant: { label: 'Kế toán',     variant: 'info' },
  employee:   { label: 'Nhân viên',   variant: 'neutral' },
};


const AdminUsers = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    status: searchParams.get('status') || '',
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const EMPTY_CREATE_FORM = { name: '', email: '', role: 'employee', department_id: '', account_request_id: null };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Face registration modal state
  const [faceModal, setFaceModal] = useState(null); // { id, name } | null
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | scanning | success | error
  const [faceMsg, setFaceMsg] = useState('');
  const [faceLoading, setFaceLoading] = useState(false);
  const videoRef = useRef(null);

  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const fetchUsers = async (currentFilters, page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v !== '')),
        page,
        limit: 20,
      };
      const data = await adminService.getUsers(params);
      if (data.success) {
        setUsers(data.data);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(filtersRef.current, 1);
    adminService.getDepartments({ status: 'active' }).then(res => {
      if (res.success) setDepartments(res.data);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.state?.prefillRequest) {
      const req = location.state.prefillRequest;
      setCreateForm({
        name: req.full_name || '',
        email: req.email || '',
        role: req.role || 'employee',
        department_id: req.department_id || '',
        account_request_id: req.id
      });
      setShowCreateModal(true);
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(filtersRef.current, 1);
  };

  const handleReset = () => {
    const reset = { ...EMPTY_FILTERS };
    setFilters(reset);
    fetchUsers(reset, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchUsers(filtersRef.current, newPage);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...createForm, department_id: createForm.department_id || null };
      const res = await adminService.createUser(payload);
      if (res.success) {
        setCreateResult(res);
        fetchUsers(filtersRef.current, 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateResult(null);
  };

  // --- FACE REGISTRATION LOGIC ---
  const loadModels = async () => {
    if (modelsLoaded) return true;
    setModelsLoading(true);
    setFaceMsg('Đang tải Models AI...');
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
      return true;
    } catch {
      setFaceMsg('Không thể tải Models AI. Kiểm tra thư mục /models.');
      return false;
    } finally {
      setModelsLoading(false);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setFaceMsg('Không thể mở Camera. Vui lòng cấp quyền truy cập.'));
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const openFaceModal = async (user) => {
    setFaceModal({ id: user.id, name: user.name || user.email });
    setFaceStatus('idle');
    setFaceMsg('');
    const ok = await loadModels();
    if (ok) {
      setFaceStatus('scanning');
      setFaceMsg('Camera đang bật. Đặt khuôn mặt nhân viên vào khung hình rồi nhấn "Chụp & Lưu".');
      setTimeout(() => startVideo(), 300);
    } else {
      setFaceStatus('error');
    }
  };

  const closeFaceModal = () => {
    stopVideo();
    setFaceModal(null);
    setFaceStatus('idle');
    setFaceMsg('');
  };

  const submitFaceForUser = async () => {
    if (!videoRef.current) return;
    setFaceLoading(true);
    setFaceMsg('Đang nhận diện khuôn mặt...');
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFaceMsg('Không nhận diện được khuôn mặt. Hãy đảm bảo mặt nhìn thẳng vào camera.');
        setFaceLoading(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      await attendanceService.registerFaceForEmployee(faceModal.id, { face_descriptor: descriptor });

      stopVideo();
      setFaceStatus('success');
      setFaceMsg(`Đã đăng ký khuôn mặt cho ${faceModal.name} thành công!`);
    } catch (err) {
      setFaceMsg(err.response?.data?.message || 'Có lỗi khi đăng ký khuôn mặt.');
      setFaceStatus('error');
    } finally {
      setFaceLoading(false);
    }
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <>
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total > 0 ? (
              <><span className="font-mono tabular-nums font-medium text-gray-700">{pagination.total}</span> tài khoản trong hệ thống</>
            ) : 'Xem và quản lý tất cả tài khoản trong hệ thống'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-4 flex items-center gap-1.5 text-[13px] font-semibold bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors active:scale-[.98] shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          Tạo tài khoản
        </button>
      </div>

      {/* Toolbar */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Tên hoặc email..."
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
            />
          </div>

          {/* Vai trò */}
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="manager">Quản lý</option>
            <option value="accountant">Kế toán</option>
            <option value="employee">Nhân viên</option>
          </select>

          {/* Trạng thái */}
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Bị khoá</option>
          </select>

          {/* Phòng ban */}
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {/* Ngày tạo */}
          <input
            type="date"
            name="created_from"
            value={filters.created_from}
            onChange={handleFilterChange}
            className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          />
          <span className="text-[12px] text-gray-400 self-center">đến</span>
          <input
            type="date"
            name="created_to"
            value={filters.created_to}
            onChange={handleFilterChange}
            className="h-9 px-3 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
          />

          {/* Actions */}
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 text-[13px] font-medium bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white rounded-md transition-colors"
          >
            Lọc
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="h-9 px-3 flex items-center gap-1.5 text-[13px] text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={13} strokeWidth={2} />
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['ID', 'Nhân viên', 'Vai trò', 'Phòng ban', 'Trạng thái', 'Ngày tạo', 'Khuôn mặt', ''].map((col) => (
                  <th key={col} className="h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-[.04em] text-gray-400 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-8 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-gray-200 rounded" />
                          <div className="h-2.5 w-36 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    {[24, 20, 16, 16, ''].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        {w ? <div className={`h-3 w-${w} bg-gray-200 rounded`} /> : null}
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-gray-400">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleCfg = ROLE_BADGE[user.role] || { label: user.role, variant: 'neutral' };
                  const isActive = user.status === 'active';
                  return (
                    <tr key={user.id} className="h-14 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-400">#{user.id}</span>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name || 'U'} size="sm" />
                          <div>
                            <p className="text-[13px] font-medium text-gray-900 leading-tight">{user.name || '—'}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4">
                        <Badge variant={roleCfg.variant} size="sm">{roleCfg.label}</Badge>
                      </td>
                      <td className="px-4">
                        <span className="text-[13px] text-gray-600">{user.department?.name || '—'}</span>
                      </td>
                      <td className="px-4">
                        <Badge variant={isActive ? 'success' : 'danger'} dot size="sm">
                          {isActive ? 'Hoạt động' : 'Bị khoá'}
                        </Badge>
                      </td>
                      <td className="px-4">
                        <span className="font-mono tabular-nums text-[12px] text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-4">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => openFaceModal(user)}
                            title="Đăng ký khuôn mặt"
                            className="flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors border border-indigo-200"
                          >
                            <Camera size={13} />
                            Đăng ký mặt
                          </button>
                        )}
                      </td>
                      <td className="px-4">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-[12px] font-medium text-accent-600 hover:text-accent-700 hover:underline whitespace-nowrap"
                        >
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

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[12px] text-gray-500">
              Hiển thị{' '}
              <span className="font-mono tabular-nums font-medium text-gray-700">
                {(pagination.page - 1) * 20 + 1}–{Math.min(pagination.page * 20, pagination.total)}
              </span>{' '}
              / <span className="font-mono tabular-nums font-medium text-gray-700">{pagination.total}</span> tài khoản
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
              <span className="px-3 text-[13px] font-medium text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ======== MODAL: Tạo tài khoản mới ======== */}
    {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">

          {createResult ? (
            /* Success screen */
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mb-4">
                <CheckCircle size={28} strokeWidth={1.75} className="text-success-600" />
              </div>
              <h2 className="text-[18px] font-semibold text-gray-900 mb-1">Tạo tài khoản thành công!</h2>
              <p className="text-[13px] text-gray-500 mb-5">Vui lòng gửi thông tin dưới đây cho nhân viên.</p>

              <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-4 text-left space-y-3 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500">Email:</span>
                  <span className="text-[13px] font-medium text-gray-900">{createResult.data.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500">Mật khẩu tạm:</span>
                  <span className="font-mono text-[13px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded">
                    {createResult.data.tempPassword}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-500">Vai trò:</span>
                  <span className="text-[13px] font-medium text-gray-900">{createResult.data.role}</span>
                </div>
              </div>

              <div className="border-l-[3px] border-warning-500 bg-warning-50 rounded px-3 py-2 text-[12px] text-warning-700 text-left w-full mb-5">
                Hãy yêu cầu nhân viên đổi mật khẩu ngay sau khi đăng nhập lần đầu.
              </div>

              <button
                onClick={handleCloseCreateModal}
                className="w-full h-10 bg-navy-700 hover:bg-navy-800 text-white text-[13px] font-semibold rounded-md transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-[16px] font-semibold text-gray-900">Tạo tài khoản mới</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Hệ thống sẽ tự tạo mật khẩu tạm cho nhân viên</p>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Họ tên</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                    Email công ty <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="nhanvien@company.com"
                    className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                      Vai trò <span className="text-danger-500">*</span>
                    </label>
                    <select
                      required
                      value={createForm.role}
                      onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="hr">HR</option>
                      <option value="manager">Quản lý</option>
                      <option value="accountant">Kế toán</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Phòng ban</label>
                    <select
                      value={createForm.department_id}
                      onChange={e => setCreateForm(p => ({ ...p, department_id: e.target.value }))}
                      className="w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors"
                    >
                      <option value="">-- Chưa xếp --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    disabled={creating}
                    className="flex-1 h-10 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-60 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.email}
                    className="flex-1 h-10 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition-colors"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang tạo...
                      </span>
                    ) : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    )}

    {/* ======== MODAL: ĐĂNG KÝ KHUÔN MẶT ======== */}
    {faceModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Camera size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Đăng ký khuôn mặt</h2>
                <p className="text-[12px] text-gray-500">{faceModal.name}</p>
              </div>
            </div>
            <button onClick={closeFaceModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex flex-col items-center gap-4">
            {/* Loading models */}
            {modelsLoading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <RefreshCw size={28} className="animate-spin text-indigo-500" />
                <p className="text-sm text-gray-500">Đang tải Models AI...</p>
              </div>
            )}

            {/* Success state */}
            {faceStatus === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-success-500" />
                </div>
                <p className="text-success-700 font-semibold">{faceMsg}</p>
                <button onClick={closeFaceModal}
                  className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                  Đóng
                </button>
              </div>
            )}

            {/* Camera scanning */}
            {faceStatus === 'scanning' && !modelsLoading && (
              <>
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {/* Khung ngắm */}
                  <div className="absolute inset-0 border-4 border-white/20 rounded-2xl m-4 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400" />
                  </div>
                </div>

                {/* Thông báo hướng dẫn */}
                <p className="text-[12px] text-gray-500 text-center leading-relaxed">{faceMsg}</p>

                {/* Actions */}
                <div className="flex w-full gap-3">
                  <button onClick={closeFaceModal} disabled={faceLoading}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                    Hủy
                  </button>
                  <button onClick={submitFaceForUser} disabled={faceLoading}
                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors">
                    {faceLoading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <UserCheck size={16} />
                        Chụp & Lưu khuôn mặt
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Error state */}
            {faceStatus === 'error' && (
              <div className="text-center py-4">
                <p className="text-danger-600 text-sm mb-4">{faceMsg}</p>
                <button onClick={closeFaceModal}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AdminUsers;
