import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Camera, Pencil, X } from 'lucide-react';
import { updateProfile } from '../../redux/authSlice';
import {
  fetchProfileThunk,
  updateProfileThunk,
  uploadAvatarThunk,
  clearProfileMessages,
} from '../../redux/profileSlice';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const PHONE_REGEX = /^0\d{9,10}$/;

const inputClass = "w-full h-10 px-3 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors";

const AdminProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { profile, loading, saveLoading, avatarLoading, error, success } = useSelector((state) => state.profile);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ full_name: '', phone: '', address: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(fetchProfileThunk());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    setFormData({ full_name: profile.full_name || '', phone: profile.phone || '', address: profile.address || '' });
    if (profile.avatar_url) setAvatarPreview(`${BACKEND}${profile.avatar_url}`);
  }, [profile]);

  useEffect(() => {
    if (!user && profile) dispatch(updateProfile({ name: profile.full_name }));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearProfileMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra dung lượng file ở phía client (2MB)
    if (file.size > 2 * 1024 * 1024) {
      dispatch(clearProfileMessages());
      setLocalError('Dung lượng ảnh không được vượt quá 2MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLocalError('');
    const prevPreview = avatarPreview;
    setAvatarPreview(URL.createObjectURL(file));
    const result = await dispatch(uploadAvatarThunk(file));
    if (uploadAvatarThunk.fulfilled.match(result)) {
      setAvatarPreview(`${BACKEND}${result.payload.avatar_url}`);
      dispatch(updateProfile({ avatar_url: result.payload.avatar_url }));
    } else {
      setAvatarPreview(prevPreview);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (formData.phone && !PHONE_REGEX.test(formData.phone)) {
      setLocalError('Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0)');
      return;
    }
    const result = await dispatch(updateProfileThunk(formData));
    if (updateProfileThunk.fulfilled.match(result)) {
      if (result.payload.profile?.full_name) {
        dispatch(updateProfile({ name: result.payload.profile.full_name }));
      }
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({ full_name: profile?.full_name || '', phone: profile?.phone || '', address: profile?.address || '' });
    setLocalError('');
    setEditing(false);
    dispatch(clearProfileMessages());
  };

  if (!isAuthenticated) return null;

  const displayName = user?.name || user?.email || 'Quản trị viên';
  const displayError = localError || error;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.01em]">Hồ sơ quản trị viên</h1>
        <p className="text-sm text-gray-500 mt-0.5">Xem và cập nhật thông tin cá nhân</p>
      </div>

      {/* Banner card */}
      <div className="bg-navy-50 border border-navy-100 rounded-lg px-6 py-5 flex items-center gap-5">
        <div className="relative shrink-0">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="avatar"
              className={`w-20 h-20 rounded-full object-cover transition-opacity ${avatarLoading ? 'opacity-60' : 'opacity-100'}`}
            />
          ) : (
            <Avatar name={displayName} size="xl" />
          )}
          <label
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-navy-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-navy-800 transition-colors shadow-sm"
            title="Đổi ảnh đại diện"
          >
            <Camera size={12} strokeWidth={2.5} className="text-white" />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </label>
          {avatarLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
              <div className="w-5 h-5 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-40 bg-navy-200 rounded" />
              <div className="h-3 w-56 bg-navy-100 rounded" />
            </div>
          ) : (
            <>
              <h2 className="text-[18px] font-semibold text-gray-900 truncate">{displayName}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5 truncate">{user?.email}</p>
              <div className="mt-2">
                <Badge variant="accent">Quản trị viên</Badge>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error / Success */}
      {displayError && (
        <div className="border-l-[3px] border-danger-500 bg-danger-50 rounded-md px-4 py-3 text-[13px] text-danger-700">{displayError}</div>
      )}
      {success && (
        <div className="border-l-[3px] border-success-500 bg-success-50 rounded-md px-4 py-3 text-[13px] text-success-700">{success}</div>
      )}

      {/* Profile details */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-semibold text-gray-900">Thông tin cá nhân</h2>
          {!editing && (
            <button
              onClick={() => { setLocalError(''); setEditing(true); }}
              disabled={loading}
              className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium text-accent-600 hover:bg-accent-50 border border-accent-200 rounded-md transition-colors disabled:opacity-40"
            >
              <Pencil size={12} strokeWidth={2} /> Chỉnh sửa
            </button>
          )}
        </div>

        {!editing ? (
          <div className="divide-y divide-gray-100">
            {[
              { Icon: User,   label: 'Họ & Tên',        value: profile?.full_name },
              { Icon: Phone,  label: 'Số điện thoại',   value: profile?.phone },
              { Icon: MapPin, label: 'Địa chỉ',          value: profile?.address },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 px-5 py-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 shrink-0 mt-0.5">
                  <Icon size={14} strokeWidth={1.75} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[.04em]">{label}</p>
                  {loading ? (
                    <div className="h-3.5 w-36 bg-gray-200 rounded animate-pulse mt-1.5" />
                  ) : (
                    <p className="text-[13px] font-medium text-gray-800 mt-0.5">
                      {value || <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Họ & Tên</label>
              <input type="text" value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nguyễn Văn A" className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input type="tel" value={formData.phone}
                onChange={e => { setFormData({ ...formData, phone: e.target.value }); setLocalError(''); }}
                placeholder="0912345678" className={inputClass} />
              <p className="text-[11px] text-gray-400 mt-1">10-11 chữ số, bắt đầu bằng 0</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Địa chỉ</label>
              <textarea rows={2} value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-100 transition-colors resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleCancel} disabled={saveLoading}
                className="flex items-center gap-1.5 h-10 px-4 border border-gray-300 text-[13px] font-medium text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-60 transition-colors">
                <X size={14} strokeWidth={2} /> Hủy
              </button>
              <button type="submit" disabled={saveLoading}
                className="flex-1 h-10 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-md transition-colors">
                {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Thông tin tài khoản</h2>
        <div className="space-y-2">
          {[
            { label: 'Email',      value: user?.email },
            { label: 'Vai trò',   value: 'Quản trị viên' },
            { label: 'Trạng thái', value: 'Đang hoạt động' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-[12px] text-gray-500">{label}</span>
              <span className="text-[13px] font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
