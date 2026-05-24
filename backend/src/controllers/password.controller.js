const passwordService = require('../services/password.service');
const { forgotPasswordValidation, resetPasswordValidation } = require('../validations/password.validation');
const { logActivity } = require('../utils/activityLogger');

// Xử lý yêu cầu OTP quên mật khẩu
exports.requestOTP = async (req, res) => {
  try {
    // Validate email
    const { error, value } = forgotPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result = await passwordService.generateAndSendOTP(value.email);
    res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Lỗi server khi gửi OTP';
    
    console.error('Request OTP Error:', error);
    res.status(status).json({
      success: false,
      message: message
    });
  }
};

// Xử lý reset mật khẩu với OTP
exports.resetPassword = async (req, res) => {
  try {
    // Validate data
    const { error, value } = resetPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, otp, newPassword } = value;
    const result = await passwordService.verifyOTPAndResetPassword(email, otp, newPassword);

    if (result?.userId) {
      await logActivity({
        userId: result.userId,
        action: 'reset_password',
        detail: `Đổi mật khẩu tài khoản ${result.email || email}`,
        req,
      });
    }

    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Lỗi server khi reset mật khẩu';
    
    console.error('Reset Password Error:', error);
    res.status(status).json({
      success: false,
      message: message
    });
  }
};