import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMeThunk } from './redux/authSlice';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';

import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserProfile from './pages/user/UserProfile';
import AdminProfile from './pages/admin/AdminProfile';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminConfig from './pages/admin/AdminConfig';
import ProtectedRoute from './routes/ProtectedRoute';

import Layout from './components/Layout';

// Redirect /profile đến đúng dashboard theo role
const RoleRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/profile'} replace />;
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Sau hard refresh: token có nhưng user chưa load → fetch lại từ API
  useEffect(() => {
    if (isAuthenticated && user === null) {
      dispatch(fetchMeThunk());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      {/* Public routes (auth) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Legacy redirect */}
      <Route path="/profile" element={<RoleRedirect />} />

      {/* Public routes với Navbar & Footer (Loi) */}
      <Route element={<Layout />}>
        {/* Removed Home and ProductDetail routes */}
      </Route>

      {/* User dashboard */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRole="user">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="config" element={<AdminConfig />} />
      </Route>
    </Routes>
  );
};

export default App;
