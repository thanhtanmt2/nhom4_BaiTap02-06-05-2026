import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, Shield, Lock, Unlock, Download, Send, Pencil, RefreshCcw } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const ROLE_BADGE = {
  admin:      { label: 'Quản trị viên', variant: 'accent' },
  hr:         { label: 'HR',            variant: 'brand' },
  manager:    { label: 'Quản lý',       variant: 'neutral' },
  accountant: { label: 'Kế toán',       variant: 'info' },
  employee:   { label: 'Nhân viên',     variant: 'neutral' },
};

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const AdminUserDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const isCurrentAdmin = currentUser?.role === 'admin';

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resetPassResult, setResetPassResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [resUser, resDepts] = await Promise.all([
          adminService.getUserById(id),
          adminService.getDepartments({ status: 'active' })
        ]);
        if (resUser.success) {
          setUser(resUser.data.user);
          setProfile(resUser.data.profile || null);
        }
        if (resDepts.success) {
          setDepartments(resDepts.data);
        }
      } catch {
        setError('Không tìm thấy người dùng.');
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

  const handleDepartmentChange = async (newDeptId) => {
    if (!user) return;
    const deptId = newDeptId ? parseInt(newDeptId) : null;
    if (user.department_id === deptId) return;
    const confirmed = window.confirm(`Xác nhận thay đổi phòng ban của nhân viên này?`);
    if (!confirmed) return;
    try {
      setActionLoading(true);
      const res = await adminService.updateUserDepartment(user.id, deptId);
      if (res.success) {
        const selectedDept = departments.find(d => d.id === deptId);
        setUser((prev) => ({
          ...prev,
          department_id: deptId,
          department: selectedDept ? { id: deptId, name: selectedDept.name } : null
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật phòng ban');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    const confirmed = window.confirm(`Bạn có chắc chắn muốn ĐẶT LẠI MẬT KHẨU cho người dùng ${user.email} không?`);
    if (!confirmed) return;
    try {
      setActionLoading(true);
      setError('');
      setResetPassResult(null);
      const res = await adminService.resetUserPassword(user.id);
      if (res.success) {
        setResetPassResult(res.data.tempPassword);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setActionLoading(false);
    }
  };

  const avatarSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${BACKEND}${profile.avatar_url}`)
    : '';

  const displayName = profile?.full_name || user?.name || user?.email || '';
  const department = user?.department?.name || '—';
  const joinedAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—';
  const roleCfg = user ? (ROLE_BADGE[user.role] || { label: user.role, variant: 'neutral' }) : null;
  const isActive = user?.status === 'active';

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Banner skeleton */}
        <div className="bg-navy-50 border border-navy-100 rounded-lg p-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-navy-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-navy-200 rounded" />
              <div className="h-3.5 w-32 bg-navy-100 rounded" />
              <div className="flex gap-2 mt-2">
                <div className="h-6 w-20 bg-navy-100 rounded-full" />
                <div className="h-6 w-16 bg-navy-100 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-[13px] text-gray-400">Không tìm thấy người dùng.</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to={isCurrentAdmin ? "/admin/users" : "/hr/employees"}
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Quay lại danh sách
      </Link>

      {/* Error */}
      {error && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">
          {error}
        </div>
      )}

      {/* Mật khẩu mới được reset */}
      {resetPassResult && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-5 mb-5">
          <h3 className="text-[14px] font-semibold text-success-800 mb-2">Đã đặt lại mật khẩu thành công!</h3>
          <p className="text-[13px] text-success-700 mb-3">Vui lòng copy mật khẩu dưới đây và gửi cho người dùng:</p>
          <div className="flex items-center gap-3">
            <code className="px-3 py-2 bg-white border border-success-300 rounded text-success-700 font-mono font-bold text-[14px]">
              {resetPassResult}
            </code>
            <button 
              onClick={() => { navigator.clipboard.writeText(resetPassResult); alert('Đã copy!'); }}
              className="text-[12px] text-success-600 hover:text-success-800 font-medium underline"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Detail banner */}
      <div className="bg-navy-50 border border-navy-100 rounded-lg px-6 py-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <Avatar name={displayName} size="xl" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">{displayName}</h1>
                <p className="text-[13px] text-gray-500 mt-0.5">{user.email}</p>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium border border-gray-300 bg-white text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  <RefreshCcw size={13} strokeWidth={1.75} />
                  Reset mật khẩu
                </button>
                {isCurrentAdmin && (
                  <>
                    <button
                      onClick={handleToggleStatus}
                      disabled={actionLoading}
                      className={`h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium rounded-md transition-colors disabled:opacity-60
                        ${isActive
                          ? 'border border-danger-300 bg-danger-50 text-danger-700 hover:bg-danger-100'
                          : 'border border-success-300 bg-success-50 text-success-700 hover:bg-success-100'
                        }`}
                    >
                      {isActive ? <Lock size={13} strokeWidth={1.75} /> : <Unlock size={13} strokeWidth={1.75} />}
                      {isActive ? 'Khóa TK' : 'Mở khóa'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              {department !== '—' && (
                <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <Building2 size={13} strokeWidth={1.75} className="text-gray-400" />
                  {department}
                </span>
              )}
              {profile?.position && (
                <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <Shield size={13} strokeWidth={1.75} className="text-gray-400" />
                  {profile.position}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Calendar size={13} strokeWidth={1.75} className="text-gray-400" />
                Tham gia {joinedAt}
              </span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant={isActive ? 'success' : 'danger'} dot>{isActive ? 'Đang hoạt động' : 'Bị khoá'}</Badge>
              {roleCfg && <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>}
              {/* Role & Department change selects (Admin only) */}
              {isCurrentAdmin ? (
                <>
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(e.target.value)}
                    disabled={actionLoading}
                    className="h-6 pl-2 pr-6 text-[11px] border border-gray-300 rounded bg-white text-gray-600 focus:outline-none focus:border-navy-700 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="hr">HR</option>
                    <option value="manager">Quản lý</option>
                    <option value="accountant">Kế toán</option>
                    <option value="admin">Quản trị viên</option>
                  </select>

                  <select
                    value={user.department_id || ''}
                    onChange={e => handleDepartmentChange(e.target.value)}
                    disabled={actionLoading}
                    className="h-6 pl-2 pr-6 text-[11px] border border-gray-300 rounded bg-white text-gray-600 focus:outline-none focus:border-navy-700 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <option value="">-- Chưa xếp phòng ban --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </>
              ) : (
                <span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  Phòng ban: {user.department?.name || 'Chưa xếp'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-2 gap-4">
        {/* Liên hệ */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-4">Thông tin liên hệ</h3>
            <div className="space-y-3">
              {[
                { icon: Mail,     label: 'Email',         value: user.email },
                { icon: Phone,    label: 'Số điện thoại', value: profile?.phone || '—' },
                { icon: MapPin,   label: 'Địa chỉ',       value: profile?.address || '—' },
                { icon: Building2,label: 'Phòng ban',     value: department },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 shrink-0 mt-0.5">
                    <Icon size={13} strokeWidth={1.75} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">{label}</p>
                    <p className="text-[13px] text-gray-800 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin tài khoản */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[.06em] text-gray-400 mb-4">Thông tin tài khoản</h3>
            <div className="space-y-3">
              {[
                { label: 'Họ tên đầy đủ', value: profile?.full_name || user.name || '—' },
                { label: 'Vai trò', value: roleCfg?.label || user.role },
                { label: 'Ngày tạo TK', value: user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[12px] text-gray-500">{label}</span>
                  <span className="text-[13px] font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
