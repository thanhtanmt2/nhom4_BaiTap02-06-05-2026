const { Attendance, AttendanceLock, Profile, Contract } = require('../entities');
const { Op } = require('sequelize');

const FACE_MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.55;

// Giờ bắt đầu làm việc (có thể cấu hình qua env)
const WORK_START_HOUR = parseInt(process.env.WORK_START_HOUR) || 8;
const WORK_START_MINUTE = parseInt(process.env.WORK_START_MINUTE) || 30;

// Lấy ngày/tháng theo múi giờ local của server (UTC+7 khi deploy tại VN)
function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const dateStr = getLocalDateStr(today);
    const currentMonth = dateStr.substring(0, 7);

    // Kiểm tra nhân viên có hợp đồng active không
    const activeContract = await Contract.findOne({ where: { user_id: userId, status: 'active' } });
    if (!activeContract) {
      return res.status(403).json({ success: false, message: 'Bạn chưa có hợp đồng lao động chính thức, không thể chấm công!' });
    }

    // Kiểm tra tháng bị chốt
    const isLocked = await AttendanceLock.findOne({ where: { month: currentMonth } });
    if (isLocked) {
      return res.status(400).json({ success: false, message: `Bảng công tháng ${currentMonth} đã bị khóa, không thể chấm công!` });
    }

    // Nhận mảng 128 số từ Frontend
    const { face_descriptor } = req.body;

    // Kiểm tra khuôn mặt
    const profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile || !profile.face_descriptor) {
      return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trước khi chấm công.' });
    }

    if (!face_descriptor || !Array.isArray(face_descriptor) || face_descriptor.length !== 128) {
      return res.status(400).json({ success: false, message: 'Không nhận diện được khuôn mặt từ Camera.' });
    }

    const savedDescriptor = JSON.parse(profile.face_descriptor);
    const distance = euclideanDistance(face_descriptor, savedDescriptor);

    if (distance > FACE_MATCH_THRESHOLD) {
      return res.status(403).json({ success: false, message: 'Khuôn mặt không khớp. Chấm công thất bại!' });
    }

    // Kiểm tra đã check-in hôm nay chưa
    let attendance = await Attendance.findOne({
      where: {
        user_id: userId,
        date: dateStr
      }
    });

    if (attendance && attendance.check_in_time) {
      return res.status(400).json({ success: false, message: 'Bạn đã check-in trong ngày hôm nay rồi!' });
    }

    // Xác định trạng thái: Present nếu check-in đúng giờ, Late nếu trễ
    const isLate = today.getHours() > WORK_START_HOUR ||
      (today.getHours() === WORK_START_HOUR && today.getMinutes() > WORK_START_MINUTE);
    const checkInStatus = isLate ? 'Late' : 'Present';

    // Nếu chưa có record thì tạo mới
    if (!attendance) {
      attendance = await Attendance.create({
        user_id: userId,
        date: dateStr,
        check_in_time: today,
        status: checkInStatus
      });
    } else {
      // Đã có record (ví dụ được tạo trước do OnLeave, nhưng user lại đi làm)
      attendance.check_in_time = today;
      attendance.status = checkInStatus;
      await attendance.save();
    }

    res.status(200).json({ success: true, message: 'Check-in thành công!', data: attendance });
  } catch (error) {
    console.error('Lỗi Check-in:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi check-in' });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const dateStr = getLocalDateStr(today);
    const currentMonth = dateStr.substring(0, 7); // e.g. "2026-06"

    // Kiểm tra nhân viên có hợp đồng active không
    const activeContract = await Contract.findOne({ where: { user_id: userId, status: 'active' } });
    if (!activeContract) {
      return res.status(403).json({ success: false, message: 'Bạn chưa có hợp đồng lao động chính thức, không thể chấm công!' });
    }

    // Kiểm tra xem tháng hiện tại có bị chốt/khóa chưa
    const isLocked = await AttendanceLock.findOne({ where: { month: currentMonth } });
    if (isLocked) {
      return res.status(400).json({ success: false, message: `Bảng công tháng ${currentMonth} đã bị khóa, không thể chấm công!` });
    }

    const { face_descriptor } = req.body;

    const profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile || !profile.face_descriptor) {
      return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký khuôn mặt.' });
    }

    if (!face_descriptor || !Array.isArray(face_descriptor) || face_descriptor.length !== 128) {
      return res.status(400).json({ success: false, message: 'Không nhận diện được khuôn mặt từ Camera.' });
    }

    const savedDescriptor = JSON.parse(profile.face_descriptor);
    const distance = euclideanDistance(face_descriptor, savedDescriptor);

    if (distance > FACE_MATCH_THRESHOLD) {
      return res.status(403).json({ success: false, message: 'Khuôn mặt không khớp. Chấm công thất bại!' });
    }

    const attendance = await Attendance.findOne({
      where: {
        user_id: userId,
        date: dateStr
      }
    });

    if (!attendance || !attendance.check_in_time) {
      return res.status(400).json({ success: false, message: 'Bạn chưa check-in trong ngày hôm nay!' });
    }

    if (attendance.check_out_time) {
      return res.status(400).json({ success: false, message: 'Bạn đã check-out trong ngày hôm nay rồi!' });
    }

    attendance.check_out_time = today;

    // Tính toán số giờ làm việc (ms -> giờ)
    const diffMs = today - new Date(attendance.check_in_time);
    const workHours = diffMs / (1000 * 60 * 60);
    attendance.work_hours = parseFloat(workHours.toFixed(2));

    await attendance.save();

    res.status(200).json({ success: true, message: 'Check-out thành công!', data: attendance });
  } catch (error) {
    console.error('Lỗi Check-out:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi check-out' });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const attendances = await Attendance.findAll({
      where: { user_id: userId },
      order: [['date', 'DESC']],
      limit: 30 // Lấy 30 ngày gần nhất
    });

    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    console.error('Lỗi lấy lịch sử:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử chấm công' });
  }
};

exports.registerFace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { face_descriptor } = req.body;

    // Block self-registration for security (Only Admin can register via registerFaceForEmployee)
    return res.status(403).json({ success: false, message: 'Chức năng tự đăng ký khuôn mặt đã bị vô hiệu hóa vì lý do bảo mật. Vui lòng liên hệ Admin.' });
  } catch (error) {
    console.error('Lỗi đăng ký khuôn mặt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký khuôn mặt' });
  }
};

// Admin đăng ký khuôn mặt thay cho nhân viên (truyền :userId)
exports.registerFaceForEmployee = async (req, res) => {
  try {
    // SECURITY: Chỉ Admin mới được dùng endpoint này
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bảo mật: Chỉ Admin mới có quyền đăng ký khuôn mặt cho nhân viên.' });
    }

    const targetUserId = req.params.userId;
    const { face_descriptor } = req.body;

    if (!face_descriptor || !Array.isArray(face_descriptor)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu khuôn mặt không hợp lệ.' });
    }

    const profile = await Profile.findOne({ where: { user_id: targetUserId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nhân viên.' });
    }

    profile.face_descriptor = JSON.stringify(face_descriptor);
    await profile.save();

    res.status(200).json({ success: true, message: 'Đăng ký khuôn mặt cho nhân viên thành công!' });
  } catch (error) {
    console.error('Lỗi HR đăng ký khuôn mặt nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký khuôn mặt' });
  }
};

// HR kiểm tra trạng thái đăng ký khuôn mặt của nhân viên
exports.checkFaceRegisteredForEmployee = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const profile = await Profile.findOne({ where: { user_id: targetUserId } });
    const isRegistered = !!(profile && profile.face_descriptor);
    res.status(200).json({ success: true, isRegistered });
  } catch (error) {
    console.error('Lỗi kiểm tra đăng ký khuôn mặt nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.checkFaceRegistered = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ where: { user_id: userId } });
    
    const isRegistered = !!(profile && profile.face_descriptor);
    res.status(200).json({ success: true, isRegistered });
  } catch (error) {
    console.error('Lỗi kiểm tra đăng ký khuôn mặt:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

function euclideanDistance(desc1, desc2) {
  if (desc1.length !== desc2.length) return 999;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}
