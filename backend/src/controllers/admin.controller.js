const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, Profile, Department, ActivityLog } = require('../entities');
const { logActivity } = require('../utils/activityLogger');

// ============================================================
// DASHBOARD ADMIN — Thống kê tổng quan
// GET /api/admin/dashboard
// ============================================================
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, lockedUsers, newUsersThisMonth, recentUsers, recentActivities, departments, login24h, loginPrev24h, systemEvents24h, recentLogins] = await Promise.all([
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
      ActivityLog.findAll({
        attributes: ['id', 'action', 'detail', 'ip', 'created_at'],
        include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      Department.findAll({
        attributes: ['id', 'name'],
        include: [{ model: User, as: 'users', attributes: ['id'] }],
      }),
      ActivityLog.count({
        where: { action: 'login', created_at: { [Op.gte]: last24h } },
        distinct: true,
        col: 'user_id',
      }),
      ActivityLog.count({
        where: { action: 'login', created_at: { [Op.gte]: last48h, [Op.lt]: last24h } },
        distinct: true,
        col: 'user_id',
      }),
      ActivityLog.count({
        where: { created_at: { [Op.gte]: last24h } },
      }),
      ActivityLog.findAll({
        where: { action: 'login', created_at: { [Op.gte]: last24h } },
        attributes: ['created_at'],
      }),
    ]);

    let departmentStats = departments.map(d => ({
      name: d.name,
      count: d.users ? d.users.length : 0,
    })).sort((a, b) => b.count - a.count);

    const maxCount = departmentStats[0]?.count || 1;
    departmentStats = departmentStats.map(d => ({ ...d, max: maxCount }));

    // Generate login chart data (12 buckets of 2 hours)
    const loginChartData = Array(12).fill(0);
    recentLogins.forEach(log => {
      const logTime = new Date(log.created_at).getTime();
      const diffMs = now.getTime() - logTime;
      const hoursAgo = diffMs / (1000 * 60 * 60);
      const bucketIndex = 11 - Math.floor(hoursAgo / 2); // 0 is oldest, 11 is newest
      if (bucketIndex >= 0 && bucketIndex < 12) {
        loginChartData[bucketIndex]++;
      }
    });

    return res.status(200).json({
      success: true,
      data: { 
        totalUsers, activeUsers, lockedUsers, newUsersThisMonth, 
        recentUsers, recentActivities, departmentStats, 
        login24h, loginPrev24h, systemEvents24h, loginChartData 
      },
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
    if (!['user', 'admin', 'hr', 'manager', 'accountant', 'employee'].includes(role)) {
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

// Cập nhật phòng ban
const updateUserDepartment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { department_id } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    if (department_id) {
      const dept = await Department.findByPk(department_id);
      if (!dept) return res.status(400).json({ success: false, message: 'Phòng ban không tồn tại' });
    }

    await user.update({ department_id: department_id || null });

    await logActivity({
      userId: req.user?.id,
      action: 'admin_update_department',
      detail: `Cập nhật phòng ban user ${user.email} -> ID ${department_id || 'Chưa xếp'}`,
      req,
    });
    return res.status(200).json({ success: true, message: 'Cập nhật phòng ban thành công', data: { user } });
  } catch (error) {
    console.error('Update User Department Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phòng ban' });
  }
};

// ============================================================
// TẠO TÀI KHOẢN NGƯỜI DÙNG MỚI
// POST /api/admin/users
// Luồng: Admin tạo tài khoản → hệ thống sinh mật khẩu tạm → gửi mail (TODO)
// ============================================================
const createUser = async (req, res) => {
  try {
    const { name, email, role, department_id, basic_salary, account_request_id } = req.body;

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
    const validRoles = ['user', 'admin', 'hr', 'manager', 'accountant', 'employee'];
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

    const tempPassword = crypto.randomBytes(8).toString('hex') + '@Tmp1';
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

    // Tạo profile trống mặc định để không bị lỗi khi các role khác truy xuất
    await Profile.create({
      user_id: newUser.id,
      full_name: name ? name.trim() : null,
    });

    // TODO: Gửi email thông báo đến nhân viên kèm mật khẩu tạm
    // await sendWelcomeEmail(email, tempPassword);

    if (account_request_id) {
      const { AccountRequest } = require('../entities');
      await AccountRequest.update(
        { status: 'approved' },
        { where: { id: account_request_id } }
      );
    }

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản thành công!`,
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

// ============================================================
// YÊU CẦU CẤP TÀI KHOẢN TỪ HR
// ============================================================

const getPendingAccountRequests = async (req, res) => {
  try {
    const { AccountRequest, Department } = require('../entities');
    const requests = await AccountRequest.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'hr', attributes: ['name', 'email'] },
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      order: [['created_at', 'ASC']]
    });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Lỗi khi lấy yêu cầu cấp tài khoản:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const approveAccountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { AccountRequest } = require('../entities');
    
    const request = await AccountRequest.findByPk(id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
    }

    // Kiểm tra email trùng
    const existingUser = await User.findOne({ where: { email: request.email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống' });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex') + '@Tmp1';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Tạo User
    const newUser = await User.create({
      name: request.full_name,
      email: request.email.toLowerCase(),
      password: hashedPassword,
      role: request.role,
      department_id: request.department_id,
      status: 'active'
    });

    // Tạo Profile
    await Profile.create({
      user_id: newUser.id,
      full_name: request.full_name
    });

    // Update request status
    request.status = 'approved';
    await request.save();

    await logActivity({
      userId: req.user.id,
      action: 'Duyệt yêu cầu tài khoản',
      detail: `Đã duyệt yêu cầu tạo tài khoản cho ${request.email}`
    });

    res.status(200).json({ success: true, message: 'Đã duyệt và tạo tài khoản thành công!', data: { tempPassword, user: newUser } });
  } catch (error) {
    console.error('Lỗi khi duyệt yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const rejectAccountRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { AccountRequest } = require('../entities');
    
    const request = await AccountRequest.findByPk(id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại hoặc đã được xử lý' });
    }

    request.status = 'rejected';
    await request.save();

    await logActivity({
      userId: req.user.id,
      action: 'Từ chối yêu cầu tài khoản',
      detail: `Từ chối yêu cầu tạo tài khoản cho ${request.email}`
    });

    res.status(200).json({ success: true, message: 'Đã từ chối yêu cầu' });
  } catch (error) {
    console.error('Lỗi khi từ chối yêu cầu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================================
// ĐẶT LẠI MẬT KHẨU CHO USER (CHỈ ADMIN)
// ============================================================
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    const newPassword = crypto.randomBytes(8).toString('hex') + '@Tmp1';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    await logActivity({
      userId: req.user?.id,
      action: 'admin_reset_password',
      detail: `Admin đặt lại mật khẩu cho tài khoản ${user.email}`,
      req,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Đặt lại mật khẩu thành công', 
      data: { tempPassword: newPassword } 
    });
  } catch (error) {
    console.error('Reset User Password Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi đặt lại mật khẩu' });
  }
};

// ============================================================
// LẤY NHẬT KÝ HỆ THỐNG
// ============================================================
const getActivityLogs = async (req, res) => {
  try {
    const { search, date_from, date_to, page, limit } = req.query;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { detail: { [Op.like]: `%${search}%` } },
      ];
    }

    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) {
        const toDate = new Date(date_to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = toDate;
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { count: total, rows: logs } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get Activity Logs Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy nhật ký hệ thống' });
  }
};

module.exports = { 
  getDashboardStats, 
  getUsers, 
  getUserById, 
  updateUserStatus, 
  updateUserRole, 
  updateUserDepartment,
  createUser,
  getPendingAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
  resetUserPassword,
  getActivityLogs
};
