const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { loginValidation, registerValidation, verifyOtpValidation } = require('../validations/auth.validation');
const { generateOTP, getOTPExpiryDate } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/mailer');
const { logActivity } = require('../utils/activityLogger');

// ============================================================
// DANG NHAP
// ============================================================
const login = async (req, res) => {
  try {
    // Buoc 1: Validate du lieu dau vao
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    // Buoc 2: Tim user trong database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // Buoc 3: So sanh mat khau da ma hoa
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    // Buoc 3b: Kiem tra tai khoan da kich hoat chua
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để nhập mã OTP.',
      });
    }

    // Buoc 4: Tao JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_cua_ban',
      { expiresIn: '24h' }
    );

    // Buoc 5: Xac dinh URL chuyen huong theo Role
    let redirectUrl = '/user/profile';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    }

    // Buoc 6: Tra ve Response thanh cong
    await logActivity({
      userId: user.id,
      action: 'login',
      detail: `Đăng nhập tài khoản ${user.email}`,
      req,
    });
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      redirectUrl: redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
    });
  }
};

// ============================================================
// DANG KY
// ============================================================
const register = async (req, res) => {
  try {
    // Buoc 1: Validate du lieu dau vao (name >= 2 ky tu, email hop le, password >= 6 ky tu)
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, email, password } = req.body;

    // Buoc 2: Kiem tra email da ton tai trong database chua
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được đăng ký, vui lòng sử dụng email khác',
      });
    }

    // Buoc 3: Ma hoa mat khau bang bcrypt voi 10 rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buoc 4: Luu user moi vao database voi status = 'inactive'
    // (chua kich hoat, cho xac thuc OTP)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'inactive',
    });

    // Buoc 5: Tao ma OTP 6 chu so, het han sau 10 phut
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiryDate(10);

    // Buoc 6: Luu OTP vao bang otps
    await OTP.create({
      user_id: newUser.id,
      code: otpCode,
      expires_at: expiresAt,
      is_used: false,
    });

    // Buoc 7: Gui ma OTP qua email bang Nodemailer
    await sendOTPEmail(email, name, otpCode);

    // Buoc 8: Tra ve Response 201 thanh cong
    await logActivity({
      userId: newUser.id,
      action: 'register',
      detail: `Đăng ký tài khoản ${newUser.email}`,
      req,
    });
    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực tài khoản.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký',
    });
  }
};

// ============================================================
// XAC THUC OTP
// ============================================================
const verifyOtp = async (req, res) => {
  try {
    // Buoc 1: Validate du lieu dau vao
    const { error } = verifyOtpValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, otp } = req.body;

    // Buoc 2: Tim user theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này',
      });
    }

    // Buoc 3: Kiem tra tai khoan da duoc kich hoat chua
    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực từ trước',
      });
    }

    // Buoc 4: Tim ban ghi OTP hop le (dung user, dung ma, chua su dung)
    const otpRecord = await OTP.findOne({
      where: {
        user_id: user.id,
        code: otp,
        is_used: false,
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác hoặc đã được sử dụng',
      });
    }

    // Buoc 5: Kiem tra OTP chua het han
    if (otpRecord.expires_at <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn, vui lòng đăng ký lại để nhận OTP mới',
      });
    }

    // Buoc 6: Danh dau OTP da duoc su dung
    await otpRecord.update({ is_used: true });

    // Buoc 7: Cap nhat trang thai user thanh active
    await user.update({ status: 'active' });

    await logActivity({
      userId: user.id,
      action: 'verify_otp',
      detail: `Xác thực OTP cho tài khoản ${user.email}`,
      req,
    });

    // Buoc 8: Tra ve Response thanh cong
    return res.status(200).json({
      success: true,
      message: 'Xác thực OTP thành công! Tài khoản của bạn đã được kích hoạt.',
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực OTP',
    });
  }
};

// ============================================================
// GUI LAI OTP
// ============================================================
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ success: false, message: 'Tài khoản này đã được xác thực' });
    }

    // Xoa OTP cu chua dung
    await OTP.destroy({ where: { user_id: user.id, is_used: false } });

    // Tao OTP moi
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiryDate(10);

    await OTP.create({ user_id: user.id, code: otpCode, expires_at: expiresAt, is_used: false });

    await sendOTPEmail(email, user.name, otpCode);

    return res.status(200).json({ success: true, message: 'Mã OTP mới đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi lại OTP' });
  }
};

module.exports = { login, register, verifyOtp, resendOtp };
