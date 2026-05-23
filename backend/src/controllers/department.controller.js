const { Department, User } = require('../models');

// ============================================================
// LẤY DANH SÁCH PHÒNG BAN
// GET /api/admin/departments
// Dùng cho: Admin xem danh sách, HR chọn khi tạo hồ sơ nhân viên
// ============================================================
const getDepartments = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};

    // Nếu truyền query ?status=active thì lọc theo trạng thái
    if (status) whereClause.status = status;

    const departments = await Department.findAll({
      where: whereClause,
      // Đếm số nhân viên thuộc mỗi phòng ban
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
        },
      ],
      order: [['id', 'ASC']],
    });

    // Định dạng lại response: thêm trường userCount cho tiện dùng ở frontend
    const result = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      status: dept.status,
      created_at: dept.created_at,
      updated_at: dept.updated_at,
      userCount: dept.users ? dept.users.length : 0,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get Departments Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phòng ban' });
  }
};

// ============================================================
// THÊM MỚI PHÒNG BAN
// POST /api/admin/departments
// ============================================================
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên phòng ban không được để trống' });
    }

    // Kiểm tra xem tên phòng ban đã tồn tại chưa (tránh trùng lặp)
    const existing = await Department.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Tên phòng ban đã tồn tại trong hệ thống' });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      status: 'active',
    });

    return res.status(201).json({ success: true, message: 'Tạo phòng ban thành công', data: department });
  } catch (error) {
    console.error('Create Department Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tạo phòng ban' });
  }
};

// ============================================================
// CHỈNH SỬA PHÒNG BAN (Tên, Mô tả)
// PUT /api/admin/departments/:id
// ============================================================
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Phòng ban không tồn tại' });
    }

    // Nếu đổi tên, kiểm tra tên mới có bị trùng với phòng ban khác không
    if (name && name.trim() !== department.name) {
      const existing = await Department.findOne({ where: { name: name.trim() } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Tên phòng ban đã tồn tại trong hệ thống' });
      }
    }

    await department.update({
      name: name ? name.trim() : department.name,
      description: description !== undefined ? description.trim() : department.description,
      updated_at: new Date(),
    });

    return res.status(200).json({ success: true, message: 'Cập nhật phòng ban thành công', data: department });
  } catch (error) {
    console.error('Update Department Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phòng ban' });
  }
};

// ============================================================
// KÍCH HOẠT / VÔ HIỆU HÓA PHÒNG BAN
// PUT /api/admin/departments/:id/status
// Lưu ý: Không dùng DELETE để tránh mất lịch sử nhân sự
// ============================================================
const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ (active | inactive)' });
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Phòng ban không tồn tại' });
    }

    // Cảnh báo: Nếu vô hiệu hóa phòng ban đang có nhân viên
    if (status === 'inactive') {
      const userCount = await User.count({ where: { department_id: id } });
      if (userCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể vô hiệu hóa phòng ban đang có ${userCount} nhân viên. Vui lòng chuyển nhân viên sang phòng ban khác trước.`,
        });
      }
    }

    await department.update({ status, updated_at: new Date() });

    return res.status(200).json({
      success: true,
      message: `Phòng ban đã được ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: department,
    });
  } catch (error) {
    console.error('Update Department Status Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái phòng ban' });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, updateDepartmentStatus };
