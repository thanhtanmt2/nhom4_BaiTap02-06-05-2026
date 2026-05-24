const bcrypt = require('bcrypt');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { generateOTP, getOTPExpiryDate } = require('../utils/otp');

exports.generateAndSendOTP = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng với email này.' };
    }

    const otpCode = generateOTP();
    const expiryTime = getOTPExpiryDate(10);

    // Save OTP to database
    await OTP.create({
      user_id: user.id,
      code: otpCode,
      expires_at: expiryTime
    });

    await sendPasswordResetEmail(email, otpCode);

    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra trong 10 phút.'
    };
  } catch (error) {
    throw error;
  }
};

exports.verifyOTPAndResetPassword = async (email, otp, newPassword) => {
  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng.' };
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({
      where: { 
        user_id: user.id,
        code: otp,
        is_used: false
      }
    });

    if (!otpRecord) {
      throw { status: 400, message: 'Mã OTP không hợp lệ.' };
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      await otpRecord.destroy();
      throw { status: 400, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu OTP mới.' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await user.update({ password: hashedPassword });

    // Delete OTP
    await otpRecord.destroy();

    return { 
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
      userId: user.id,
      email: user.email,
    };
  } catch (error) {
    throw error;
  }
};