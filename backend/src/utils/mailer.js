const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, userName, otpCode) => {
  if (process.env.BYPASS_LIMITER === 'true') {
    console.log(`[MAIL MOCK] sendOTPEmail to=${toEmail} otpCode=${otpCode}`);
    return;
  }
  const mailOptions = {
    from: `"Nhom 4 App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Mã xác thực OTP - Đăng ký tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Xác thực tài khoản</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để xác thực:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4CAF50; background-color: #f5f5f5; padding: 15px 25px; border-radius: 8px; border: 2px dashed #4CAF50; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #666;">Mã OTP này có hiệu lực trong <strong>10 phút</strong>.</p>
        <p style="color: #666;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
      </div>
    `,
  };
  const info = await transporter.sendMail(mailOptions);
  if (info.messageId) {
    console.log('OTP Email Preview URL: ' + nodemailer.getTestMessageUrl(info));
  }
};

const sendPasswordResetEmail = async (toEmail, otpCode) => {
  if (process.env.BYPASS_LIMITER === 'true') {
    console.log(`[MAIL MOCK] sendPasswordResetEmail to=${toEmail} otpCode=${otpCode}`);
    return;
  }
  const mailOptions = {
    from: `"Nhom 4 App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Mã OTP Khôi Phục Mật Khẩu',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f9f9; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 32px 24px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">🔐</div>
          <h1 style="color: #fff; margin: 0; font-size: 22px;">Khôi Phục Mật Khẩu</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Nhóm 4 App</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Xin chào,</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Dưới đây là mã OTP của bạn:
          </p>
          <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; font-family: monospace;">${otpCode}</div>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="color: #92400e; font-size: 13px; margin: 0;">⏰ Mã này sẽ <strong>hết hạn sau 10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center;">
          <p style="color: #d1d5db; font-size: 12px; margin: 0;">© 2024 Nhóm 4. All rights reserved.</p>
        </div>
      </div>
    `,
  };
  const info = await transporter.sendMail(mailOptions);
  if (info.messageId) {
    console.log('Password Reset Email Preview URL: ' + nodemailer.getTestMessageUrl(info));
  }
};

const sendPayslipEmail = async (toEmail, userName, payroll) => {
  if (process.env.BYPASS_LIMITER === 'true') {
    console.log(`[MAIL MOCK] sendPayslipEmail to=${toEmail} name=${userName} netSalary=${payroll.net_salary}`);
    return;
  }
  const monthLabel = payroll.month; // YYYY-MM format
  const mailOptions = {
    from: `"Kế Toán Nhóm 4 App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `[Nhóm 4 App] Phiếu lương tháng ${monthLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Phiếu Lương Tháng ${monthLabel}</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Phòng Kế toán gửi bạn phiếu lương chi tiết cho tháng ${monthLabel}. Vui lòng kiểm tra thông tin bên dưới:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Lương cơ bản:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(payroll.base_salary).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phụ cấp:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(payroll.allowance).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Thưởng/KPI:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(payroll.bonus).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d32f2f;"><strong>Khấu trừ:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #d32f2f;">-${Number(payroll.deduction).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d32f2f;"><strong>Thuế TNCN:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #d32f2f;">-${Number(payroll.tax).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d32f2f;"><strong>Bảo hiểm NV:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #d32f2f;">-${Number(payroll.insurance_employee).toLocaleString('vi-VN')} VND</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 15px 10px; font-weight: bold; font-size: 16px;"><strong>Thực lãnh:</strong></td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 16px; text-align: right; color: #388e3c;">${Number(payroll.net_salary).toLocaleString('vi-VN')} VND</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 13px;">Nếu có bất kỳ thắc mắc nào, vui lòng phản hồi email này hoặc liên hệ phòng Kế toán.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
      </div>
    `,
  };
  const info = await transporter.sendMail(mailOptions);
  if (info.messageId) {
    console.log('Payslip Email Preview URL: ' + nodemailer.getTestMessageUrl(info));
  }
};

const sendApplicationConfirmEmail = async (toEmail, candidateName, jobTitle) => {
  if (process.env.BYPASS_LIMITER === 'true') {
    console.log(`[MAIL MOCK] sendApplicationConfirmEmail to=${toEmail} job=${jobTitle}`);
    return;
  }
  const mailOptions = {
    from: `"Tuyển Dụng Nhóm 4" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `[Nhóm 4] Xác nhận nhận hồ sơ - ${jobTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Nhận Được Hồ Sơ Của Bạn</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Cảm ơn bạn đã ứng tuyển tại Nhóm 4</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Xin chào <strong>${candidateName}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
            Chúng tôi đã nhận được hồ sơ ứng tuyển của bạn cho vị trí:
          </p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="color: #1e40af; font-size: 16px; font-weight: 700; margin: 0;">${jobTitle}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
            Đội ngũ tuyển dụng của chúng tôi sẽ xem xét hồ sơ và liên hệ lại với bạn trong thời gian sớm nhất nếu hồ sơ phù hợp với yêu cầu của vị trí.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0;">
            Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ phòng Nhân sự qua địa chỉ email này.
          </p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center; background: #f9fafb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Nhóm 4. All rights reserved.</p>
          <p style="color: #d1d5db; font-size: 11px; margin: 4px 0 0;">Đây là email tự động, vui lòng không trả lời trực tiếp.</p>
        </div>
      </div>
    `,
  };
  const info = await transporter.sendMail(mailOptions);
  if (info.messageId) {
    console.log('Application Confirm Email Preview URL: ' + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendPayslipEmail, sendApplicationConfirmEmail };
