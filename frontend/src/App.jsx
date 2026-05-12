import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="flex flex-col items-center justify-center p-4 min-h-screen">
              <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Trang chủ nhóm 4</h1>
                <p className="text-gray-600 mb-8">Nền tảng đã được thiết lập. Hãy chia nhau làm các trang dưới đây:</p>
                
                <div className="flex flex-col space-y-4">
                  <Link to="/login" className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Đăng nhập (Thành viên 1)</Link>
                  <Link to="/register" className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Đăng ký (Thành viên 2)</Link>
                  <Link to="/forgot-password" className="bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600">Quên mật khẩu (Thành viên 3)</Link>
                  <Link to="/profile" className="bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600">Profile (Thành viên 4)</Link>
                </div>
              </div>
            </div>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<div className="mt-8 text-xl font-bold flex items-center justify-center min-h-screen">Đây là chỗ render Trang Register</div>} />
        <Route path="/forgot-password" element={<div className="mt-8 text-xl font-bold flex items-center justify-center min-h-screen">Đây là chỗ render Trang Quên MK</div>} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

export default App;
