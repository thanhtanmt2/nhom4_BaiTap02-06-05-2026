const { Op } = require('sequelize');
const User = require('../models/User');
const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');
const { logActivity } = require('../utils/activityLogger');

// ============================================================
// DASHBOARD ADMIN — Thống kê tổng quan
// GET /api/admin/dashboard
// ============================================================
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, lockedUsers, newUsersThisMonth, recentUsers, recentActivities] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'inactive' } }),
      User.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
      User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'status', 'created_at', 'department'],
        include: [{ model: Profile, attributes: ['avatar_url', 'full_name'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      ActivityLog.findAll({
        attributes: ['id', 'action', 'detail', 'created_at'],
        include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { totalUsers, activeUsers, lockedUsers, newUsersThisMonth, recentUsers, recentActivities },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu dashboard' });
  }
};

// Lấy danh sách user kèm profile (admin) — hỗ trợ search, filter & pagination
const getUsers = async (req, res) => {
  try {
    const { search, role, status, department, created_from, created_to, page, limit } = req.query;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (department) whereClause.department = department;
    if (created_from || created_to) {
      whereClause.created_at = {};
      if (created_from) whereClause.created_at[Op.gte] = new Date(created_from);
      if (created_to) {
        const toDate = new Date(created_to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = toDate;
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { count: total, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [Profile],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng' });
  }
};

// Lấy user + profile theo ID (admin)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    const profile = await Profile.findOne({ where: { user_id: userId } });
    return res.status(200).json({ success: true, data: { user, profile } });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin người dùng' });
  }
};

// Cập nhật trạng thái (active/inactive)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    await user.update({ status });

    await logActivity({
      userId: req.user?.id,
      action: 'admin_update_status',
      detail: `Cập nhật trạng thái user ${user.email} -> ${status}`,
      req,
    });
    return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: { user } });
  } catch (error) {
    console.error('Update User Status Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái' });
  }
};

// Cập nhật role (user/admin)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    await user.update({ role });

    await logActivity({
      userId: req.user?.id,
      action: 'admin_update_role',
      detail: `Cập nhật role user ${user.email} -> ${role}`,
      req,
    });
    return res.status(200).json({ success: true, message: 'Cập nhật role thành công', data: { user } });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật role' });
  }
};

module.exports = { getDashboardStats, getUsers, getUserById, updateUserStatus, updateUserRole };
