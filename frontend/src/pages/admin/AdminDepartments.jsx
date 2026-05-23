import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';

// ============================================================
// TRANG QUẢN LÝ PHÒNG BAN (Admin)
// Chức năng: Xem danh sách, Thêm mới, Sửa tên/mô tả,
//            Kích hoạt / Vô hiệu hóa phòng ban
// ============================================================

const EMPTY_FORM = { name: '', description: '' };

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State điều khiển Modal (null = đóng, 'create' = thêm mới, object = chỉnh sửa)
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách phòng ban từ API
  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getDepartments();
      if (data.success) setDepartments(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Hiện thông báo thành công rồi tự động ẩn sau 3 giây
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Mở modal thêm mới
  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setModalMode('create');
  };

  // Mở modal chỉnh sửa với dữ liệu của phòng ban được chọn
  const handleOpenEdit = (dept) => {
    setForm({ name: dept.name, description: dept.description || '' });
    setModalMode(dept); // lưu cả object để lấy id khi submit
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setForm(EMPTY_FORM);
  };

  // Xử lý submit form (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        // Thêm mới
        const res = await adminService.createDepartment(form);
        if (res.success) {
          showSuccess('Tạo phòng ban thành công!');
          handleCloseModal();
          fetchDepartments();
        }
      } else {
        // Chỉnh sửa
        const res = await adminService.updateDepartment(modalMode.id, form);
        if (res.success) {
          showSuccess('Cập nhật phòng ban thành công!');
          handleCloseModal();
          fetchDepartments();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Kích hoạt hoặc vô hiệu hóa phòng ban
  const handleToggleStatus = async (dept) => {
    const newStatus = dept.status === 'active' ? 'inactive' : 'active';
    const confirmMsg =
      newStatus === 'inactive'
        ? `Bạn có chắc muốn vô hiệu hóa phòng ban "${dept.name}"?`
        : `Bạn có chắc muốn kích hoạt lại phòng ban "${dept.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminService.updateDepartmentStatus(dept.id, newStatus);
      if (res.success) {
        showSuccess(res.message);
        fetchDepartments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Quản lý Phòng ban</h1>
          <p className="text-gray-500 text-sm mt-1">
            Thêm mới, chỉnh sửa và quản lý danh mục phòng ban trong hệ thống
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Thêm phòng ban
        </button>
      </div>

      {/* Thông báo thành công */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          ✓ {success}
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Bảng danh sách phòng ban */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên phòng ban
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🏢</span>
                      <p>Chưa có phòng ban nào. Hãy tạo phòng ban đầu tiên!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{dept.id}
                    </td>

                    {/* Tên phòng ban */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                          {dept.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                      </div>
                    </td>

                    {/* Mô tả */}
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {dept.description || <span className="italic text-gray-400">Chưa có mô tả</span>}
                    </td>

                    {/* Số nhân viên */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                        {dept.userCount}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dept.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dept.status === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>

                    {/* Hành động */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Nút Sửa */}
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Chỉnh sửa
                        </button>
                        {/* Nút Kích hoạt / Vô hiệu hóa */}
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                            dept.status === 'active'
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {dept.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Tổng số */}
        {!loading && departments.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Tổng cộng: <span className="font-semibold text-gray-700">{departments.length}</span> phòng ban
            </p>
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL: Thêm mới / Chỉnh sửa phòng ban
          ====================================================== */}
      {modalMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header modal */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {modalMode === 'create' ? '➕ Thêm phòng ban mới' : `✏️ Chỉnh sửa: ${modalMode.name}`}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Tên phòng ban */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phòng ban <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Phòng Công nghệ thông tin"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về chức năng của phòng ban..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl transition-colors text-sm font-medium shadow-sm"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </span>
                  ) : modalMode === 'create' ? (
                    'Tạo phòng ban'
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
