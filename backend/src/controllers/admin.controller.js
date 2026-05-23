const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { Department } = require('../models');

// ============================================================
// DASHBOARD ADMIN — Thống kê tổng quan
// GET /api/admin/dashboard
// ============================================================
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, lockedUsers, newUsersThisMonth, recentUsers] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'inactive' } }),
      User.count({ where: { created_at: { [Op.gte]: startOfMonth } } }),
      User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'status', 'created_at', 'department_id'],
        include: [{ model: Profile, attributes: ['avatar_url', 'full_name'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { totalUsers, activeUsers, lockedUsers, newUsersThisMonth, recentUsers },
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
    if (department) whereClause.department_id = department; // department giờ là ID số nguyên
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
      include: [
        { model: Profile },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
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
    const user = await User.findByPk(userId, { 
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
    });
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
    if (!['admin', 'hr', 'manager', 'accountant', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    await user.update({ role });
    return res.status(200).json({ success: true, message: 'Cập nhật role thành công', data: { user } });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật role' });
  }
};

// ============================================================
// TẠO TÀI KHOẢN NGƯỜI DÙNG MỚI
// POST /api/admin/users
// Luồng: Admin tạo tài khoản → hệ thống sinh mật khẩu tạm → gửi mail (TODO)
// ============================================================
const createUser = async (req, res) => {
  try {
    const { name, email, role, department_id } = req.body;

    // Validate bắt buộc
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email và Vai trò là bắt buộc' });
    }

    // Validate định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
    }

    // Validate role hợp lệ
    const validRoles = ['admin', 'hr', 'manager', 'accountant', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng trong hệ thống' });
    }

    // Kiểm tra phòng ban hợp lệ nếu có truyền vào
    if (department_id) {
      const dept = await Department.findByPk(department_id);
      if (!dept || dept.status === 'inactive') {
        return res.status(400).json({ success: false, message: 'Phòng ban không tồn tại hoặc đã bị vô hiệu hóa' });
      }
    }

    // Tự động sinh mật khẩu tạm: chữ hoa + chữ thường + số + ký tự đặc biệt
    const tempPassword = `Hrm@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Tạo user mới
    const newUser = await User.create({
      name: name ? name.trim() : null,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      department_id: department_id || null,
      status: 'active',
    });

    // TODO: Gửi email thông báo đến nhân viên kèm mật khẩu tạm
    // await sendWelcomeEmail(email, tempPassword);

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản thành công! Mật khẩu tạm: ${tempPassword}`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department_id: newUser.department_id,
        status: newUser.status,
        tempPassword, // Trả về để Admin thông báo thủ công nếu chưa có email
      },
    });
  } catch (error) {
    console.error('Create User Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản' });
  }
};

module.exports = { getDashboardStats, getUsers, getUserById, updateUserStatus, updateUserRole, createUser };
