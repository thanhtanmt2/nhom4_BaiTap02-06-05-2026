const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');
const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
} = require('../controllers/admin.controller');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
} = require('../controllers/department.controller');

// Dashboard stats (Nhut)
router.get('/dashboard', authenticateToken, authorizeAdmin, getDashboardStats);

// User management (Tan)
router.get('/users', authenticateToken, authorizeAdmin, getUsers);
router.get('/users/:userId', authenticateToken, authorizeAdmin, getUserById);
router.put('/users/:userId/status', authenticateToken, authorizeAdmin, updateUserStatus);
router.put('/users/:userId/role', authenticateToken, authorizeAdmin, updateUserRole);

// ---- Department Management ----
// Lấy danh sách phòng ban (Admin + HR đều dùng)
router.get('/departments', authenticateToken, getDepartments);
// Tạo mới phòng ban (chỉ Admin)
router.post('/departments', authenticateToken, authorizeAdmin, createDepartment);
// Sửa tên/mô tả phòng ban (chỉ Admin)
router.put('/departments/:id', authenticateToken, authorizeAdmin, updateDepartment);
// Kích hoạt / Vô hiệu hóa phòng ban (chỉ Admin)
router.put('/departments/:id/status', authenticateToken, authorizeAdmin, updateDepartmentStatus);

module.exports = router;
