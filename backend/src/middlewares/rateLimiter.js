const rateLimit = require('express-rate-limit');

// Kiểm tra xem có bypass rate limiter hay không (ví dụ trong môi trường test/development)
const isBypass = process.env.BYPASS_LIMITER === 'true' || process.env.NODE_ENV === 'test';
const bypassMiddleware = (req, res, next) => next();

// Rate limiter for login: max 5 attempts per 15 minutes
const loginLimiter = isBypass ? bypassMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: {
    success: false,
    message: 'Số lần đăng nhập vượt quá giới hạn, vui lòng thử lại sau 15 phút',
  },
  skipSuccessfulRequests: true, // Chỉ đếm những lần đăng nhập thất bại (chống Bruteforce)
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for register: max 5 attempts per 15 minutes
const registerLimiter = isBypass ? bypassMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: {
    success: false,
    message: 'Số lần đăng ký vượt quá giới hạn, vui lòng thử lại sau 15 phút',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for forgot password: max 3 attempts per 30 minutes
const forgotPasswordLimiter = isBypass ? bypassMiddleware : rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // max 3 requests per IP
  message: {
    success: false,
    message: 'Số lần yêu cầu OTP vượt quá giới hạn, vui lòng thử lại sau 30 phút',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for reset password: max 5 attempts per 15 minutes
const resetPasswordLimiter = isBypass ? bypassMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: {
    success: false,
    message: 'Số lần reset mật khẩu vượt quá giới hạn, vui lòng thử lại sau 15 phút',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { 
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter
};
