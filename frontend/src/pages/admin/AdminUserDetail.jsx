import  { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import Alert from '../../components/Alert';
import Button from '../../components/Button';

const COLOR_MAP = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-700',
};

const Badge = ({ children, color = 'gray' }) => (
  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${COLOR_MAP[color] || COLOR_MAP.gray}`}>
    {children}
  </span>
);

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const Avatar = ({ src, name }) =>
  src ? (
    <img src={src} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
  ) : (
    <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-700">
      {(name || 'U').trim().charAt(0).toUpperCase()}
    </div>
  );

const AdminUserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminService.getUserById(id);
        if (res.success) {
          setUser(res.data.user);
          setProfile(res.data.profile || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      `Xác nhận ${user.status === 'active' ? 'khóa' : 'mở khóa'} tài khoản này?`
    );
    if (!confirmed) return;
    try {
      setActionLoading(true);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const res = await adminService.updateUserStatus(user.id, newStatus);
      if (res.success) setUser((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!user || user.role === newRole) return;
    const confirmed = window.confirm(`Xác nhận đổi vai trò thành "${newRole}"?`);
    if (!confirmed) return;
    try {
      setActionLoading(true);
      const res = await adminService.updateUserRole(user.id, newRole);
      if (res.success) setUser((prev) => ({ ...prev, role: newRole }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật role');
    } finally {
      setActionLoading(false);
    }
  };

  const avatarSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${BACKEND}${profile.avatar_url}`)
    : '';

  const displayName = profile?.full_name || user?.name || user?.email || '';
  const department = user?.department?.name || '—';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleString('vi-VN')
    : '—';

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-800">Chi tiết tài khoản</h1>
        <Link to="/admin/users" className="text-sm text-gray-500 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>

      <Alert type="error" message={error} />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !user ? (
        <div className="text-center py-20 text-gray-500">Không tìm thấy người dùng.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột trái — avatar & badges */}
          <div className="md:col-span-1 flex flex-col items-center gap-4">
            <Avatar src={avatarSrc} name={displayName} />
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 truncate">{displayName}</h2>
              <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
            </div>
            <div className="flex flex-col items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5">
                <Badge color={user.status === 'active' ? 'green' : 'red'}>
                  {user.status === 'active' ? 'Active' : 'Locked'}
                </Badge>
                <Badge color={
                  user.role === 'admin' ? 'purple' : 
                  user.role === 'hr' ? 'blue' : 
                  user.role === 'manager' ? 'red' : 
                  user.role === 'accountant' ? 'green' : 'gray'
                }>
                  {{
                    admin: 'Quản trị viên',
                    hr: 'HR',
                    manager: 'Quản lý',
                    accountant: 'Kế toán',
                    employee: 'Nhân viên'
                  }[user.role] || user.role}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">{department}</div>
            </div>
          </div>

          {/* Cột phải — thông tin chi tiết & nút thao tác */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500">Thông tin chi tiết</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  variant="danger"
                  className="w-auto! min-w-35"
                >
                  {user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </Button>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={actionLoading}
                  className="text-sm font-medium border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="employee">Nhân viên</option>
                  <option value="hr">HR</option>
                  <option value="manager">Quản lý</option>
                  <option value="accountant">Kế toán</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Email</div>
                <div className="text-sm text-gray-800">{user.email}</div>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Tên đầy đủ</div>
                <div className="text-sm text-gray-800">{profile?.full_name || '—'}</div>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Số điện thoại</div>
                <div className="text-sm text-gray-800">{profile?.phone || '—'}</div>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Địa chỉ</div>
                <div className="text-sm text-gray-800">{profile?.address || '—'}</div>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Phòng ban</div>
                <div className="text-sm text-gray-800">{department}</div>
              </div>
              <div className="flex items-center justify-between pb-3">
                <div className="text-xs text-gray-400 uppercase font-semibold">Ngày tạo</div>
                <div className="text-sm text-gray-800">{createdAt}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
