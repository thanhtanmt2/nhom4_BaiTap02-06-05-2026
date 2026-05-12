import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  const token = localStorage.getItem('token');

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để xem profile');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get('/profile/');

        if (response.data.success) {
          setUserData(response.data.data.user);
          setProfileData(response.data.data.profile);
          setFormData(response.data.data.profile);
        } else {
          setError(response.data.message || 'Lỗi khi lấy thông tin profile');
        }
      } catch (err) {
        console.error('Fetch Profile Error:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axiosClient.put(
        '/profile/',
        {
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address
        }
      );

      if (response.data.success) {
        setProfileData(response.data.data.profile);
        setSuccess('Cập nhật profile thành công!');
        setEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Lỗi khi cập nhật profile');
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setEditing(false);
    setError('');
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 shadow-2xl text-center border border-white/20">
          <h1 className="text-4xl font-black text-white mb-4 drop-shadow-lg">🔐 Profile</h1>
          <p className="text-white/80 text-lg font-semibold drop-shadow-md">Vui lòng đăng nhập để xem profile</p>
        </div>
      </div>
    );
  }

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full"></div>
            </div>
          </div>
          <p className="text-white text-xl font-bold drop-shadow-lg">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 opacity-5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 opacity-5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div>
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
              👤 Hồ Sơ Của Tôi
            </h1>
            <p className="text-white/80 text-lg drop-shadow-md">Quản lý và cập nhật thông tin cá nhân</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-3 px-8 rounded-xl transition duration-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-2 backdrop-blur-sm border border-red-400/50"
          >
            🚪 Đăng Xuất
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="backdrop-blur-md bg-red-500/20 border-2 border-red-400 rounded-2xl p-5 mb-8 shadow-lg animate-pulse">
            <p className="text-red-100 font-bold text-lg flex items-center gap-3">
              <span className="text-3xl">❌</span>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="backdrop-blur-md bg-green-500/20 border-2 border-green-400 rounded-2xl p-5 mb-8 shadow-lg">
            <p className="text-green-100 font-bold text-lg flex items-center gap-3">
              <span className="text-3xl">✅</span>
              {success}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20 sticky top-6 transform hover:scale-105 transition duration-300">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-75"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                    <span className="text-6xl font-black text-white">
                      {userData?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center border-t border-white/20 pt-6">
                <h3 className="text-2xl font-black text-white mb-3 drop-shadow-lg">
                  {profileData?.full_name || '👤 Chưa Cập Nhật'}
                </h3>
                <p className="text-white/70 text-sm break-all mb-4 font-semibold">{userData?.email}</p>

                <div className="flex justify-center mb-6">
                  {userData?.is_active ? (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg drop-shadow-lg">
                      🟢 Đã Kích Hoạt
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg drop-shadow-lg">
                      🟡 Chờ Kích Hoạt
                    </span>
                  )}
                </div>

                <div className="text-white/60 text-xs space-y-2 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                  <p>🆔 ID: <span className="font-bold text-white">{userData?.id}</span></p>
                  <p>👨‍💼 Vai trò: <span className="font-bold text-white capitalize">{userData?.role}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-md bg-white/10 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-3 drop-shadow-lg">
                  📋 Chi Tiết Thông Tin
                </h2>
                <p className="text-blue-100 mt-2 text-sm font-semibold">Cập nhật các thông tin cần thiết</p>
              </div>

              {/* Content */}
              <div className="p-8">
                {!editing ? (
                  // View Mode
                  <div className="space-y-6">
                    {/* Name Card */}
                    <div className="group bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/20 hover:border-white/40 transition duration-300">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">👤</div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Họ & Tên</label>
                          <p className="text-2xl font-black text-white mt-2 drop-shadow-lg group-hover:drop-shadow-2xl transition">
                            {profileData?.full_name || (
                              <span className="text-white/50">Chưa cập nhật</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phone Card */}
                    <div className="group bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-white/20 hover:border-white/40 transition duration-300">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">📱</div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Số Điện Thoại</label>
                          <p className="text-2xl font-black text-white mt-2 drop-shadow-lg group-hover:drop-shadow-2xl transition">
                            {profileData?.phone || (
                              <span className="text-white/50">Chưa cập nhật</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Address Card */}
                    <div className="group bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-2xl p-6 border border-white/20 hover:border-white/40 transition duration-300">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">📍</div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Địa Chỉ</label>
                          <p className="text-lg font-bold text-white mt-2 whitespace-pre-wrap drop-shadow-lg group-hover:drop-shadow-2xl transition">
                            {profileData?.address || (
                              <span className="text-white/50">Chưa cập nhật</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditing(true);
                        setError('');
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl transition duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg mt-8 border border-blue-400/50 backdrop-blur-sm"
                    >
                      ✏️ Chỉnh Sửa Thông Tin
                    </button>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name Input */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                        👤 Họ Tên <span className="text-red-400 text-lg">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Nhập họ tên của bạn"
                        className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 backdrop-blur-sm"
                      />
                      <p className="text-white/60 text-xs mt-2 font-semibold">⚠️ Bắt buộc nhập</p>
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                        📱 Số Điện Thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-200 backdrop-blur-sm"
                      />
                      <p className="text-white/60 text-xs mt-2 font-semibold">✅ Tùy chọn</p>
                    </div>

                    {/* Address Textarea */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                        📍 Địa Chỉ
                      </label>
                      <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        placeholder="Nhập địa chỉ của bạn"
                        rows="4"
                        className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-200 resize-none backdrop-blur-sm"
                      />
                      <p className="text-white/60 text-xs mt-2 font-semibold">✅ Tùy chọn</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-white/20">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 backdrop-blur-sm border border-green-400/50"
                      >
                        {loading ? '⏳ Đang lưu...' : '💾 Lưu Thay Đổi'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 backdrop-blur-sm border border-gray-400/50"
                      >
                        ✖️ Hủy Bỏ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-slate-900/95 to-purple-900/95 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">👤</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Hồ Sơ Cá Nhân</h1>
              <p className="text-purple-300 text-xs">Quản lý thông tin của bạn</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚪 Đăng Xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <p className="text-red-200 font-semibold flex items-center gap-2">
              <span className="text-xl">⚠️</span> {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <p className="text-green-200 font-semibold flex items-center gap-2">
              <span className="text-xl">✨</span> {success}
            </p>
          </div>
        )}

        {loading && !userData ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-300/20 border-t-purple-500 mb-4"></div>
              <p className="text-purple-300 text-lg">Đang tải thông tin...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - User Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
                {/* Avatar */}
                <div className="text-center mb-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-4 animate-pulse">
                    <span className="text-6xl">
                      {userData?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1">
                    {profileData?.full_name || 'Chưa cập nhật'}
                  </h3>
                  <p className="text-purple-300 text-sm break-all mb-4">{userData?.email}</p>
                </div>

                {/* Status Badge */}
                <div className="mb-4 p-3 bg-slate-700/50 rounded-lg text-center">
                  {userData?.is_active ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-green-300 font-semibold text-sm">Đã Kích Hoạt</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
                      <span className="text-yellow-300 font-semibold text-sm">Chưa Kích Hoạt</span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="space-y-3 border-t border-purple-500/20 pt-4">
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">ID Người Dùng</p>
                    <p className="text-white font-mono font-bold text-lg">#{userData?.id}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">Vai Trò</p>
                    <p className="text-blue-300 font-bold capitalize">{userData?.role || 'User'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Profile Details */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-8">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    📋 Thông Tin Chi Tiết
                  </h2>
                  <p className="text-purple-100 mt-2">Quản lý và cập nhật hồ sơ của bạn</p>
                </div>

                {/* Content */}
                <div className="p-8">
                  {!editing ? (
                    // View Mode
                    <div className="space-y-6">
                      {/* Full Name */}
                      <div className="group">
                        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300">
                          <div className="text-3xl">👤</div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-purple-300 uppercase tracking-widest">Họ Và Tên</label>
                            <p className="text-2xl font-bold text-white mt-2">
                              {profileData?.full_name || (
                                <span className="text-purple-400 font-normal text-base">Chưa cập nhật</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="group">
                        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-blue-500/20 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-300">
                          <div className="text-3xl">📱</div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Số Điện Thoại</label>
                            <p className="text-xl font-bold text-white mt-2">
                              {profileData?.phone || (
                                <span className="text-cyan-400 font-normal text-base">Chưa cập nhật</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="group">
                        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300">
                          <div className="text-3xl">📍</div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Địa Chỉ</label>
                            <p className="text-lg font-bold text-white mt-2 whitespace-pre-wrap leading-relaxed">
                              {profileData?.address || (
                                <span className="text-emerald-400 font-normal text-base">Chưa cập nhật</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditing(true);
                          setError('');
                        }}
                        className="w-full group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 mt-8 flex items-center justify-center gap-3 text-lg"
                      >
                        <span>✏️</span>
                        <span>Chỉnh Sửa Thông Tin</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  ) : (
                    // Edit Mode
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3 uppercase tracking-wider">
                          👤 Họ Và Tên <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Nhập họ tên của bạn"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-slate-400"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3 uppercase tracking-wider">
                          📱 Số Điện Thoại
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          placeholder="Ví dụ: 0912345678"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-white placeholder-slate-400"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-3 uppercase tracking-wider">
                          📍 Địa Chỉ
                        </label>
                        <textarea
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          placeholder="Nhập địa chỉ của bạn"
                          rows="4"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-emerald-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 text-white placeholder-slate-400 resize-none"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-4 pt-6 border-t border-purple-500/20">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-500 disabled:to-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
                        >
                          <span>💾</span>
                          <span>{loading ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 disabled:from-slate-500 disabled:to-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
                        >
                          <span>✖️</span>
                          <span>Hủy</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
