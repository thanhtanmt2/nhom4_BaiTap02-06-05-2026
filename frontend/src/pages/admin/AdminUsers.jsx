import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/admin.service';

const EMPTY_FILTERS = {
  search: '',
  role: '',
  status: '',
  department: '',
  created_from: '',
  created_to: '',
};

const AdminUsers = () => {
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    status: searchParams.get('status') || '',
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // State cho modal tạo tài khoản
  const EMPTY_CREATE_FORM = { name: '', email: '', role: 'employee', department_id: '' };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null); // lưu kết quả sau khi tạo thành công
  const [departments, setDepartments] = useState([]);

  // useRef giữ giá trị filters mới nhất — không bị stale closure
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // Mount: fetch users và danh sách phòng ban
  useEffect(() => {
    fetchUsers(filtersRef.current, 1);
    // Lấy danh sách phòng ban để dùng cho dropdown trong modal tạo user
    adminService.getDepartments({ status: 'active' }).then(res => {
      if (res.success) setDepartments(res.data);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Xử lý tạo tài khoản mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...createForm,
        department_id: createForm.department_id || null,
      };
      const res = await adminService.createUser(payload);
      if (res.success) {
        setCreateResult(res); // Hiển thị màn hình kết quả với mật khẩu tạm
        fetchUsers(filtersRef.current, 1); // Reload danh sách
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

  return (
    <>  
      <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">Xem và quản lý tất cả tài khoản trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2 shrink-0"
        >
          <span className="text-lg leading-none">+</span> Tạo tài khoản
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Tìm kiếm tên / email */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Tên hoặc Email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Vai trò */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Tất cả</option>
                <option value="admin">Quản trị viên</option>
                <option value="user">Người dùng</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Tất cả</option>
                <option value="active">Active</option>
                <option value="inactive">Khóa / Inactive</option>
              </select>
            </div>

            {/* Phòng ban */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Tất cả</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Kinh doanh">Kinh doanh</option>
                <option value="Kế toán">Kế toán</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {/* Từ ngày */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                name="created_from"
                value={filters.created_from}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Đến ngày */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                name="created_to"
                value={filters.created_to}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Nút hành động */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-xl transition-colors shadow-sm"
              >
                Lọc / Tìm kiếm
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60 rounded-xl transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên & Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          {(user.name?.trim() || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || '—'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const roleMap = {
                          admin:      { label: 'Quản trị viên', cls: 'bg-purple-100 text-purple-800' },
                          hr:         { label: 'HR',            cls: 'bg-violet-100 text-violet-800' },
                          manager:    { label: 'Quản lý',       cls: 'bg-amber-100 text-amber-800' },
                          accountant: { label: 'Kế toán',       cls: 'bg-teal-100 text-teal-800' },
                          employee:   { label: 'Nhân viên',     cls: 'bg-blue-100 text-blue-800' },
                        };
                        const r = roleMap[user.role] || { label: user.role, cls: 'bg-gray-100 text-gray-800' };
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.cls}`}>
                            {r.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Xem chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Hiển thị{' '}
              <span className="font-medium">
                {(pagination.page - 1) * 20 + 1}–{Math.min(pagination.page * 20, pagination.total)}
              </span>{' '}
              / <span className="font-medium">{pagination.total}</span> tài khoản
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ======================================================
        MODAL: Tạo tài khoản mới
    ====================================================== */}
    {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

          {/* Nếu đã tạo thành công: hiển thị màn hình kết quả với mật khẩu tạm */}
          {createResult ? (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Tạo tài khoản thành công!</h2>
              <p className="text-sm text-gray-500 mb-5">Vui lòng gửi thông tin dưới đây cho nhân viên.</p>

              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-gray-800">{createResult.data.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mật khẩu tạm:</span>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{createResult.data.tempPassword}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vai trò:</span>
                  <span className="font-semibold text-gray-800">{createResult.data.role}</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
                ⚠️ Hãy yêu cầu nhân viên đổi mật khẩu ngay sau khi đăng nhập lần đầu.
              </p>
              <button onClick={handleCloseCreateModal} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Header modal */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">➕ Tạo tài khoản mới</h2>
                <p className="text-sm text-gray-400 mt-0.5">Hệ thống sẽ tự tạo mật khẩu tạm cho nhân viên</p>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email công ty <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="nhanvien@company.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Role + Phòng ban */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={createForm.role}
                      onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="hr">HR</option>
                      <option value="manager">Quản lý</option>
                      <option value="accountant">Kế toán</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                    <select
                      value={createForm.department_id}
                      onChange={e => setCreateForm(p => ({ ...p, department_id: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
                    >
                      <option value="">-- Chưa xếp --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseCreateModal} disabled={creating}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium disabled:opacity-60">
                    Hủy bỏ
                  </button>
                  <button type="submit" disabled={creating || !createForm.email}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium shadow-sm">
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
    </>
  );
};

export default AdminUsers;
