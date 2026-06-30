const { User, Profile, AccountRequest, Contract, Department, Attendance, AttendanceLock } = require('../entities');
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcrypt');
const { Op, Sequelize } = require('sequelize');

// ==========================================
// QUẢN LÝ YÊU CẦU CẤP TÀI KHOẢN (ACCOUNT REQUESTS)
// ==========================================

exports.createAccountRequest = async (req, res) => {
  try {
    const { email, full_name, role, department_id } = req.body;
    const hr_id = req.user.id;

    if (!email || !full_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và họ tên' });
    }

    // Check if email already exists in users table
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã có tài khoản trong hệ thống' });
    }

    // Check if there is already a pending request for this email
    const existingRequest = await AccountRequest.findOne({ where: { email, status: 'pending' } });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Đã có yêu cầu đang chờ duyệt cho email này' });
    }

    const newRequest = await AccountRequest.create({
      hr_id,
      email,
      full_name,
      role: role || 'employee',
      department_id: department_id || null,
      status: 'pending'
    });

    await logActivity({
      userId: hr_id,
      action: 'Tạo yêu cầu cấp tài khoản',
      detail: `Gửi yêu cầu tạo tài khoản cho ${email}`
    });

    res.status(201).json({ success: true, message: 'Đã gửi yêu cầu cấp tài khoản cho Admin', data: newRequest });
  } catch (error) {
    console.error('Lỗi khi tạo account request:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getMyAccountRequests = async (req, res) => {
  try {
    const hr_id = req.user.id;
    const requests = await AccountRequest.findAll({
      where: { hr_id },
      include: [
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Lỗi khi lấy account requests:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ==========================================
// CẬP NHẬT HỒ SƠ NHÂN VIÊN (THĂNG CHỨC / ĐỔI PHÒNG BAN)
// ==========================================

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department_id, full_name, phone, address } = req.body;
    const hr_id = req.user.id;

    const user = await User.findByPk(id, { include: [{ model: Profile }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    // Update User level info
    let userUpdated = false;
    if (role && role !== user.role) {
      // Bảo mật: Nếu người gọi là HR, không được phép set role thành admin
      if (req.user.role !== 'admin' && role === 'admin') {
        return res.status(403).json({ success: false, message: 'HR không có quyền cấp vai trò Admin' });
      }
      user.role = role;
      userUpdated = true;
    }
    if (department_id !== undefined && department_id !== user.department_id) {
      user.department_id = department_id || null;
      userUpdated = true;
    }
    if (userUpdated) await user.save();

    // Update Profile level info
    if (user.Profile) {
      let profileUpdated = false;
      if (full_name !== undefined) { user.Profile.full_name = full_name; profileUpdated = true; }
      if (phone !== undefined) { user.Profile.phone = phone; profileUpdated = true; }
      if (address !== undefined) { user.Profile.address = address; profileUpdated = true; }
      if (profileUpdated) await user.Profile.save();
    } else if (full_name || phone || address) {
      // If profile doesn't exist, create it
      await Profile.create({
        user_id: id,
        full_name,
        phone,
        address
      });
    }

    await logActivity({
      userId: hr_id,
      action: 'Cập nhật hồ sơ nhân viên',
      detail: `Cập nhật thông tin cho tài khoản ${user.email}`
    });

    res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ==========================================
// QUẢN LÝ HỢP ĐỒNG (CONTRACTS)
// ==========================================

exports.createContract = async (req, res) => {
  try {
    const { user_id, contract_type, basic_salary, start_date, end_date } = req.body;
    const hr_id = req.user.id;

    if (!user_id || !basic_salary || !start_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin bắt buộc' });
    }

    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu' });
    }

    // Kiểm tra xem user này có hợp đồng active không
    const activeContract = await Contract.findOne({ where: { user_id, status: 'active' } });
    if (activeContract) {
      return res.status(400).json({ success: false, message: 'Nhân viên này đang có hợp đồng hiệu lực. Vui lòng gia hạn hoặc chấm dứt hợp đồng cũ trước.' });
    }

    const newContract = await Contract.create({
      user_id,
      contract_type: contract_type || 'Chính thức',
      basic_salary,
      start_date,
      end_date: end_date || null,
      status: 'active',
      created_by_hr_id: hr_id
    });

    await logActivity({
      userId: hr_id,
      action: 'Tạo hợp đồng',
      detail: `Tạo hợp đồng ${contract_type} cho User ID ${user_id}`
    });

    res.status(201).json({ success: true, message: 'Tạo hợp đồng thành công', data: newContract });
  } catch (error) {
    console.error('Lỗi khi tạo hợp đồng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.findAll({
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: User, as: 'hr', attributes: ['name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    console.error('Lỗi khi lấy hợp đồng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.renewContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_type, basic_salary, start_date, end_date } = req.body;
    const hr_id = req.user.id;

    const oldContract = await Contract.findByPk(id);
    if (!oldContract) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
    }

    if (oldContract.status === 'terminated') {
      return res.status(400).json({ success: false, message: 'Không thể gia hạn hợp đồng đã chấm dứt' });
    }

    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu' });
    }

    // Đóng hợp đồng cũ
    oldContract.status = 'expired';
    await oldContract.save();

    // Tạo hợp đồng mới
    const newContract = await Contract.create({
      user_id: oldContract.user_id,
      contract_type: contract_type || oldContract.contract_type,
      basic_salary: basic_salary || oldContract.basic_salary,
      start_date: start_date,
      end_date: end_date || null,
      status: 'active',
      created_by_hr_id: hr_id
    });

    await logActivity({
      userId: hr_id,
      action: 'Gia hạn hợp đồng',
      detail: `Gia hạn hợp đồng cho User ID ${oldContract.user_id}`
    });

    res.status(201).json({ success: true, message: 'Gia hạn hợp đồng thành công', data: newContract });
  } catch (error) {
    console.error('Lỗi khi gia hạn hợp đồng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ==========================================
// BÁO CÁO VÀ CHỐT CÔNG (ATTENDANCE REPORTS & LOCK)
// ==========================================

exports.getAttendanceReport = async (req, res) => {
  try {
    const { month } = req.query; // format: "YYYY-MM"
    if (!month) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng (định dạng YYYY-MM)' });
    }

    // Check lock status
    const lock = await AttendanceLock.findOne({ where: { month } });
    const isLocked = !!lock;

    // Get all employees (excluding admins)
    const employees = await User.findAll({
      where: {
        role: { [Op.ne]: 'admin' }
      },
      include: [
        { model: Department, as: 'department', attributes: ['name'] }
      ]
    });

    // Start date and end date of the month
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]) - 1;
    const startDate = new Date(Date.UTC(year, monthNum, 1)).toISOString().split('T')[0];
    const endDate = new Date(Date.UTC(year, monthNum + 1, 0)).toISOString().split('T')[0];

    // Single aggregate query instead of N+1 loop
    const attendanceRows = await Attendance.findAll({
      where: { date: { [Op.between]: [startDate, endDate] } },
      attributes: [
        'user_id',
        'status',
        [Sequelize.fn('SUM', Sequelize.col('work_hours')), 'total_hours'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      ],
      group: ['user_id', 'status'],
      raw: true,
    });

    // Build map: { userId: { present, late, absent, leave, work_hours } }
    const statsMap = {};
    for (const row of attendanceRows) {
      const uid = row.user_id;
      if (!statsMap[uid]) statsMap[uid] = { present: 0, late: 0, absent: 0, leave: 0, work_hours: 0 };
      const count = parseInt(row.count) || 0;
      const hours = parseFloat(row.total_hours) || 0;
      if (row.status === 'Present') { statsMap[uid].present += count; statsMap[uid].work_hours += hours; }
      else if (row.status === 'Late') { statsMap[uid].late += count; statsMap[uid].work_hours += hours; }
      else if (row.status === 'Absent') statsMap[uid].absent += count;
      else if (row.status === 'OnLeave') statsMap[uid].leave += count;
    }

    const reportData = employees.map(employee => {
      const s = statsMap[employee.id] || { present: 0, late: 0, absent: 0, leave: 0, work_hours: 0 };
      return {
        user_id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department ? employee.department.name : 'Chưa phân phòng',
        present: s.present,
        late: s.late,
        absent: s.absent,
        leave: s.leave,
        work_hours: parseFloat(s.work_hours.toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      isLocked,
      data: reportData
    });
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo chấm công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.lockAttendance = async (req, res) => {
  try {
    const { month } = req.body;
    const hr_id = req.user.id;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng (định dạng YYYY-MM)' });
    }

    const existingLock = await AttendanceLock.findOne({ where: { month } });
    if (existingLock) {
      return res.status(400).json({ success: false, message: 'Bảng công tháng này đã được chốt và khóa trước đó!' });
    }

    await AttendanceLock.create({
      month,
      status: 'locked',
      locked_by: hr_id
    });

    await logActivity({
      userId: hr_id,
      action: 'Chốt bảng công',
      detail: `Khóa dữ liệu chấm công tháng ${month}`
    });

    res.status(200).json({ success: true, message: `Chốt và khóa bảng công tháng ${month} thành công, đã chuyển tiếp sang Kế toán.` });
  } catch (error) {
    console.error('Lỗi khi chốt bảng công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi chốt bảng công' });
  }
};

exports.unlockAttendance = async (req, res) => {
  try {
    const { month } = req.body;
    const hr_id = req.user.id;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng (định dạng YYYY-MM)' });
    }

    const existingLock = await AttendanceLock.findOne({ where: { month } });
    if (!existingLock) {
      return res.status(400).json({ success: false, message: 'Bảng công tháng này chưa được khóa!' });
    }

    await existingLock.destroy();

    await logActivity({
      userId: hr_id,
      action: 'Mở khóa bảng công',
      detail: `Mở khóa dữ liệu chấm công tháng ${month}`
    });

    res.status(200).json({ success: true, message: `Mở khóa bảng công tháng ${month} thành công.` });
  } catch (error) {
    console.error('Lỗi khi mở khóa bảng công:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi mở khóa bảng công' });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const { User, Candidate, Profile, Contract } = require('../entities');
    const { Op } = require('sequelize');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // 1. Phỏng vấn hôm nay
    const interviews = await Candidate.findAll({
      where: {
        interview_date: { [Op.gte]: today, [Op.lt]: tomorrow },
        stage: { [Op.in]: ['iv1', 'iv2'] }
      },
      order: [['interview_date', 'ASC']]
    });

    // 2. Kỷ niệm (Anniversaries in the next 7 days)
    const users = await User.findAll({
      attributes: ['id', 'name', 'created_at'],
      where: {
        role: { [Op.ne]: 'admin' },
        status: 'active'
      }
    });

    const events = users.map(u => {
      const joinDate = new Date(u.created_at);
      // Calculate anniversary this year
      const anniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
      if (anniversary < today) {
        anniversary.setFullYear(today.getFullYear() + 1);
      }
      
      const diffTime = anniversary - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7 && diffDays >= 0) {
        const years = anniversary.getFullYear() - joinDate.getFullYear();
        if (years > 0) {
          return {
            name: u.name,
            date: `${anniversary.getDate()}/${anniversary.getMonth() + 1} - ${years} năm`,
            daysLeft: diffDays,
            type: 'anniversary'
          };
        }
      }
      return null;
    }).filter(Boolean);

    // sort events by daysLeft
    events.sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({
      success: true,
      data: {
        interviews: interviews.map(i => ({
          time: new Date(i.interview_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          name: i.name,
          round: i.stage === 'iv1' ? 'Vòng 1' : 'Vòng 2',
          interviewer: i.interviewer || 'N/A',
          mode: (i.interview_link && i.interview_link.startsWith('http')) ? 'Online' : 'Trực tiếp'
        })),
        events
      }
    });

  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu dashboard HR:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
