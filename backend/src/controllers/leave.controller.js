const { LeaveBalance, LeaveRequest } = require('../entities');
const { Op } = require('sequelize');

// ==========================================
// API DÀNH CHO NHÂN VIÊN (EMPLOYEE)
// ==========================================

// 1. Lấy thông tin Quỹ phép của tôi trong năm nay
exports.getMyLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id; // ID nhân viên lấy từ token đăng nhập
    const currentYear = new Date().getFullYear();

    // Tìm quỹ phép của nhân viên này trong năm nay
    let balance = await LeaveBalance.findOne({
      where: { user_id: userId, year: currentYear }
    });

    // Tự động cấp quỹ phép nếu đầu năm nhân viên chưa có
    if (!balance) {
      balance = await LeaveBalance.create({
        user_id: userId,
        year: currentYear,
        total_days: 12, // Mặc định mỗi năm có 12 ngày phép
        used_days: 0,
        pending_days: 0
      });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    console.error('Lỗi khi lấy quỹ phép:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Nhân viên nộp đơn xin nghỉ phép hoặc xin OT
exports.createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy thông tin từ form người dùng gửi lên
    const { type, start_date, end_date, total_days, ot_hours, reason } = req.body;

    // Ràng buộc cơ bản
    if (!type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // XỬ LÝ RIÊNG NẾU LÀ ĐƠN XIN NGHỈ PHÉP (LEAVE)
    if (type === 'leave') {
      if (!total_days || total_days <= 0) {
        return res.status(400).json({ success: false, message: 'Số ngày nghỉ không hợp lệ' });
      }

      // Kiểm tra trùng lịch TRƯỚC khi chạm vào quỹ phép
      const overlapping = await LeaveRequest.findOne({
        where: {
          user_id: userId,
          status: { [Op.in]: ['pending', 'approved'] },
          start_date: { [Op.lte]: end_date },
          end_date: { [Op.gte]: start_date },
        }
      });
      if (overlapping) {
        return res.status(400).json({ success: false, message: 'Đã có đơn trong khoảng thời gian này, không thể tạo trùng' });
      }

      const currentYear = new Date(start_date).getFullYear();

      // Lấy quỹ phép của năm đó ra để kiểm tra
      let balance = await LeaveBalance.findOne({ where: { user_id: userId, year: currentYear } });
      if (!balance) {
        balance = await LeaveBalance.create({ user_id: userId, year: currentYear, total_days: 12 });
      }

      // Công thức: Số ngày CÒN LẠI = Tổng cấp - (Đã dùng + Đang chờ duyệt)
      const remainingDays = balance.total_days - (balance.used_days + balance.pending_days);

      // Nếu số ngày xin nghỉ lớn hơn số ngày còn lại -> Từ chối ngay lập tức
      if (total_days > remainingDays) {
        return res.status(400).json({
          success: false,
          message: `Không đủ ngày phép. Bạn chỉ còn ${remainingDays} ngày có thể sử dụng.`
        });
      }

      // Nếu đủ ngày -> Lưu số ngày này vào mục pending (tạm khóa lại)
      balance.pending_days += parseFloat(total_days);
      await balance.save();
    }

    // XỬ LÝ RIÊNG NẾU LÀ ĐƠN OT
    if (type === 'ot') {
      if (!ot_hours || ot_hours <= 0) {
        return res.status(400).json({ success: false, message: 'Số giờ OT không hợp lệ' });
      }
      // Đơn OT thì không trừ quỹ phép nên không cần kiểm tra LeaveBalance
    }

    // Lưu lá đơn vào Database
    const newRequest = await LeaveRequest.create({
      user_id: userId,
      type,
      start_date,
      end_date,
      total_days: type === 'leave' ? total_days : 0, // Chỉ lưu total_days nếu là leave
      ot_hours: type === 'ot' ? ot_hours : null,     // Chỉ lưu ot_hours nếu là ot
      reason,
      status: 'pending' // Mặc định là chờ sếp duyệt
    });

    res.status(201).json({ success: true, message: 'Đã gửi đơn thành công', data: newRequest });
  } catch (error) {
    console.error('Lỗi khi nộp đơn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. Nhân viên xem lại lịch sử các lá đơn mình đã nộp
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm tất cả lá đơn do user này tạo, sắp xếp mới nhất lên đầu
    const requests = await LeaveRequest.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3b. Nhân viên hủy đơn đang chờ duyệt
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;

    const request = await LeaveRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    }
    if (request.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn này' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn đang chờ duyệt' });
    }

    // Hoàn trả pending_days nếu là đơn nghỉ phép
    if (request.type === 'leave') {
      const currentYear = new Date(request.start_date).getFullYear();
      const balance = await LeaveBalance.findOne({ where: { user_id: userId, year: currentYear } });
      if (balance) {
        balance.pending_days = Math.max(0, balance.pending_days - request.total_days);
        await balance.save();
      }
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ success: true, message: 'Đã hủy đơn thành công', data: request });
  } catch (error) {
    console.error('Lỗi khi hủy đơn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ==========================================
// API DÀNH CHO QUẢN LÝ (MANAGER)
// ==========================================

// 4. Lấy danh sách các đơn đang chờ duyệt — chỉ hiển thị nhân viên cùng phòng ban
exports.getPendingRequests = async (req, res) => {
  try {
    const { User } = require('../entities');

    // Lấy department_id của manager đang đăng nhập
    const manager = await User.findByPk(req.user.id, { attributes: ['department_id'] });
    const managerDeptId = manager?.department_id;

    // Nếu manager chưa được gán phòng ban → trả về rỗng thay vì lộ toàn bộ
    if (!managerDeptId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const pendingRequests = await LeaveRequest.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['name', 'email', 'department_id', 'role'],
          where: {
            [Op.or]: [
              { department_id: managerDeptId },
              { role: 'hr' }
            ]
          }
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn chờ duyệt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 5. Manager bấm Duyệt (approve) hoặc Từ chối (reject) đơn
exports.approveOrRejectRequest = async (req, res) => {
  try {
    const managerId = req.user.id;
    const requestId = req.params.id;
    const { status, reject_reason } = req.body; // status: 'approved' hoặc 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    if (status === 'rejected' && !reject_reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
    }

    // Tìm lá đơn đó
    const request = await LeaveRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Đơn này đã được xử lý rồi' });
    
    // Không cho phép tự phê duyệt đơn của bản thân
    if (request.user_id === managerId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự phê duyệt đơn của chính mình' });
    }

    // Cập nhật người duyệt và thời gian duyệt
    request.status = status;
    request.approved_by = managerId;
    request.approved_at = new Date();
    if (status === 'rejected') request.reject_reason = reject_reason;

    // QUAN TRỌNG: XỬ LÝ LẠI QUỸ PHÉP NẾU LÀ ĐƠN 'LEAVE'
    if (request.type === 'leave') {
      // Lấy năm hiện tại 
      const currentYear = new Date(request.start_date).getFullYear();
      // Check quỹ phép của user gửi yêu cầu 
      const balance = await LeaveBalance.findOne({ where: { user_id: request.user_id, year: currentYear } });

      // nếu tìm thấy quỹ phép 
      if (balance) {
        // Trừ đi số ngày pending đã tạm giữ lúc nộp đơn
        balance.pending_days -= request.total_days;

        // Nếu Duyệt -> Chuyển số ngày đó sang used_days (chính thức dùng)
        if (status === 'approved') {
          balance.used_days += request.total_days;
        }
        // Nếu Từ chối -> pending_days giảm về (trả lại quỹ), used_days không đổi

        await balance.save();
      }
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Đã duyệt đơn thành công' : 'Đã từ chối đơn',
      data: request
    });
  } catch (error) {
    console.error('Lỗi khi xử lý đơn:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 6. Lấy lịch làm việc của team (Để Manager xem ai nghỉ ngày nào)
exports.getTeamSchedule = async (req, res) => {
  try {
    const { User } = require('../entities');

    // Lấy tất cả các đơn ĐÃ ĐƯỢC DUYỆT để hiển thị lên Calendar
    const approvedSchedules = await LeaveRequest.findAll({
      where: { status: 'approved' },
      include: [
        { model: User, as: 'requester', attributes: ['name', 'email'] }
      ]
    });

    res.status(200).json({ success: true, data: approvedSchedules });
  } catch (error) {
    console.error('Lỗi khi lấy lịch team:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 7. Lịch sử phê duyệt của Manager (tất cả đơn đã approved/rejected)
exports.getApprovalHistory = async (req, res) => {
  try {
    const { User, Profile } = require('../entities');
    const { status, type, from, to } = req.query;

    const where = {};
    if (status && ['approved', 'rejected'].includes(status)) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['approved', 'rejected'] };
    }
    if (type && ['leave', 'ot', 'other'].includes(type)) {
      where.type = type;
    }
    if (from) {
      where.approved_at = { [Op.gte]: new Date(from) };
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.approved_at = { ...where.approved_at, [Op.lte]: toDate };
    }

    const history = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'department_id'],
          include: [{ model: Profile }]
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['approved_at', 'DESC']]
    });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử phê duyệt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
