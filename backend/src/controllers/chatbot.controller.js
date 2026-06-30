const { GoogleGenerativeAI } = require('@google/generative-ai');
const { LeaveBalance, LeaveRequest, Task, Payroll, User, Candidate, Department } = require('../entities');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    thinkingConfig: { thinkingBudget: 0 } // tắt thinking để trả lời nhanh hơn
  }
});


// =============================================
// STATIC KNOWLEDGE BASE (Tùy chỉnh nội dung)
// =============================================
const COMPANY_KNOWLEDGE = {
  recruitment: `
Công ty đang tuyển dụng các vị trí sau:
- **Lập trình viên Backend (Node.js)**: Yêu cầu 1-3 năm kinh nghiệm, thành thạo Express.js, SQL
- **Lập trình viên Frontend (React)**: Yêu cầu 1-2 năm kinh nghiệm, thành thạo React, Tailwind CSS
- **Kế toán viên**: Yêu cầu tốt nghiệp kế toán, biết phần mềm kế toán
- **Nhân viên HR**: Yêu cầu kinh nghiệm tuyển dụng, giao tiếp tốt

Cách ứng tuyển: Gửi CV về hr@company.com hoặc liên hệ phòng HR trực tiếp.
  `.trim(),

  companyRules: `
Quy tắc và nội quy làm việc tại công ty:
1. **Giờ làm việc**: Thứ 2 - Thứ 6, 8:00 - 17:30. Nghỉ trưa 12:00 - 13:30
2. **Chấm công**: Phải check-in/check-out qua hệ thống mỗi ngày
3. **Trang phục**: Lịch sự, gọn gàng. Thứ 6 được mặc thoải mái hơn
4. **Nghỉ phép**: Mỗi năm được 12 ngày phép. Phải xin trước ít nhất 2 ngày
5. **Bảo mật thông tin**: Không chia sẻ thông tin nội bộ ra ngoài
6. **Thiết bị**: Sử dụng thiết bị công ty đúng mục đích
7. **Hành vi**: Tôn trọng đồng nghiệp, không quấy rối, không phân biệt đối xử
8. **Báo cáo sự cố**: Báo ngay cho quản lý nếu gặp sự cố bảo mật
  `.trim(),

  jobRequirements: `
Yêu cầu nghiệp vụ chung tại công ty:
- **Kỹ năng mềm**: Giao tiếp tốt, làm việc nhóm, tư duy phân tích
- **Ngoại ngữ**: Tiếng Anh đọc hiểu tài liệu kỹ thuật
- **Công nghệ**: Thành thạo Microsoft Office, email công việc
- **Đúng giờ**: Nghiêm túc về giờ giấc và deadline
- **Học hỏi**: Sẵn sàng học công nghệ/quy trình mới
  `.trim(),

  resetPassword: `
Hướng dẫn reset mật khẩu:
1. Truy cập trang đăng nhập của hệ thống HRM
2. Click vào **"Quên mật khẩu?"** bên dưới nút đăng nhập
3. Nhập địa chỉ email đã đăng ký
4. Kiểm tra hộp thư email - bạn sẽ nhận được mã OTP
5. Nhập mã OTP và đặt mật khẩu mới (ít nhất 8 ký tự)

Nếu không nhận được email, liên hệ IT Support hoặc phòng HR.
  `.trim(),
};

// =============================================
// GEMINI HELPERS
// =============================================

async function detectIntent(userMessage, isAuthenticated) {
  const prompt = `Bạn là hệ thống phân tích intent cho chatbot HR. Phân tích câu hỏi và trả về JSON hợp lệ.

Người dùng ${isAuthenticated ? 'ĐÃ đăng nhập' : 'CHƯA đăng nhập'}.

Các intent được phép:
- GREETING: Chào hỏi thông thường
- RECRUITMENT: Hỏi về tuyển dụng, vị trí tuyển dụng
- COMPANY_RULES: Hỏi về quy tắc, nội quy, quy định công ty
- JOB_REQUIREMENTS: Hỏi về yêu cầu nghiệp vụ, kỹ năng cần có
- RESET_PASSWORD: Hỏi cách đổi/reset mật khẩu
- MY_SALARY: Hỏi về lương (chỉ khi đã đăng nhập)
- MY_TASKS_TODAY: Hỏi về công việc/task hôm nay (chỉ khi đã đăng nhập)
- LEAVE_STATUS: Hỏi trạng thái đơn nghỉ phép (chỉ khi đã đăng nhập)
- LEAVE_DAYS_USED: Hỏi số ngày phép đã dùng/còn lại (chỉ khi đã đăng nhập)
- LEAVE_REQUEST: Muốn xin nghỉ phép (chỉ khi đã đăng nhập)
- UNKNOWN: Không hiểu hoặc ngoài phạm vi

Nếu là LEAVE_REQUEST, cố gắng trích xuất:
- reason: lý do nghỉ (nếu có trong câu)
- start_date: ngày bắt đầu (format YYYY-MM-DD, nếu có, tính từ hôm nay ${new Date().toISOString().split('T')[0]})
- end_date: ngày kết thúc (format YYYY-MM-DD, nếu có)
- total_days: số ngày (tính từ start đến end, nếu rõ)

Câu hỏi người dùng: "${userMessage}"

Trả về JSON (không có markdown, không có \`\`\`):
{"intent": "...", "params": {}}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Làm sạch markdown code block nếu có
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    console.log('[Chatbot] Intent raw:', text.substring(0, 200));
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[Chatbot] Intent detection error:', e.message);
    return { intent: 'UNKNOWN', params: {} };
  }
}

async function generateFriendlyResponse(context) {
  const { userMessage, intent, data, userName, error } = context;
  
  let dataStr = data ? JSON.stringify(data, null, 2) : 'Không có dữ liệu';
  
  const prompt = `Bạn là trợ lý HR thân thiện, chuyên nghiệp, trả lời bằng tiếng Việt.
Tên người dùng: ${userName || 'Bạn'}
Intent: ${intent}
Câu hỏi: "${userMessage}"
Dữ liệu từ hệ thống: ${error ? 'LỖI: ' + error : dataStr}

Hãy viết câu trả lời ngắn gọn, thân thiện, dễ hiểu. Dùng emoji phù hợp. Không quá dài.
Nếu có dữ liệu dạng số/ngày tháng, trình bày rõ ràng. Nếu có lỗi, giải thích lịch sự.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    console.error('[Chatbot] Response generation error:', e.message, e.status || '');
    return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
  }
}

// =============================================
// MAIN HANDLER
// =============================================

exports.chat = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({
        success: false,
        message: 'Chatbot chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
        reply: '⚠️ Chatbot chưa được kích hoạt. Quản trị viên cần cấu hình GEMINI_API_KEY.'
      });
    }

    const { message, conversationHistory = [] } = req.body;
    const userId = req.user?.id;
    const isAuthenticated = !!req.user;
    const userName = req.user?.name || null;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi' });
    }

    // Bước 1: Detect intent
    const { intent, params } = await detectIntent(message, isAuthenticated);

    // Bước 2: Fetch data tương ứng từ DB
    let data = null;
    let error = null;
    let directReply = null;

    if (!isAuthenticated && ['MY_SALARY', 'MY_TASKS_TODAY', 'LEAVE_STATUS', 'LEAVE_DAYS_USED', 'LEAVE_REQUEST'].includes(intent)) {
      return res.json({
        success: true,
        reply: '🔐 Bạn cần **đăng nhập** để sử dụng tính năng này. Vui lòng đăng nhập vào hệ thống!',
        intent: 'AUTH_REQUIRED'
      });
    }

    switch (intent) {
      case 'GREETING':
        data = {
          isAuthenticated,
          userName,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        break;

      case 'RECRUITMENT':
        data = { content: COMPANY_KNOWLEDGE.recruitment };
        break;

      case 'COMPANY_RULES':
        data = { content: COMPANY_KNOWLEDGE.companyRules };
        break;

      case 'JOB_REQUIREMENTS':
        data = { content: COMPANY_KNOWLEDGE.jobRequirements };
        break;

      case 'RESET_PASSWORD':
        data = { content: COMPANY_KNOWLEDGE.resetPassword };
        break;

      case 'MY_SALARY': {
        const payrolls = await Payroll.findAll({
          where: {
            user_id: userId,
            status: { [Op.in]: ['approved', 'paid'] }
          },
          order: [['month', 'DESC']],
          limit: 3
        });
        if (payrolls.length === 0) {
          error = 'Chưa có phiếu lương nào được duyệt';
        } else {
          data = payrolls.map(p => ({
            month: p.month,
            base_salary: Number(p.base_salary).toLocaleString('vi-VN'),
            allowance: Number(p.allowance).toLocaleString('vi-VN'),
            bonus: Number(p.bonus).toLocaleString('vi-VN'),
            deduction: Number(p.deduction).toLocaleString('vi-VN'),
            insurance_employee: Number(p.insurance_employee).toLocaleString('vi-VN'),
            tax: Number(p.tax).toLocaleString('vi-VN'),
            net_salary: Number(p.net_salary).toLocaleString('vi-VN'),
            status: p.status
          }));
        }
        break;
      }

      case 'MY_TASKS_TODAY': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allTasks = await Task.findAll({
          where: {
            assigned_to_id: userId,
            status: { [Op.in]: ['todo', 'in_progress', 'review'] }
          },
          order: [['due_date', 'ASC']],
          limit: 10
        });
        data = {
          tasks: allTasks.map(t => ({
            title: t.title,
            priority: t.priority,
            status: t.status,
            due_date: t.due_date
          })),
          total: allTasks.length,
          today: today.toLocaleDateString('vi-VN')
        };
        break;
      }

      case 'LEAVE_STATUS': {
        const requests = await LeaveRequest.findAll({
          where: { user_id: userId },
          order: [['created_at', 'DESC']],
          limit: 3
        });
        if (requests.length === 0) {
          error = 'Bạn chưa có đơn xin nghỉ phép nào';
        } else {
          data = requests.map(r => ({
            type: r.type === 'leave' ? 'Nghỉ phép' : 'OT',
            start_date: new Date(r.start_date).toLocaleDateString('vi-VN'),
            end_date: new Date(r.end_date).toLocaleDateString('vi-VN'),
            total_days: r.total_days,
            reason: r.reason,
            status: r.status === 'pending' ? '⏳ Đang chờ duyệt' :
                    r.status === 'approved' ? '✅ Đã duyệt' : '❌ Bị từ chối',
            created_at: new Date(r.created_at).toLocaleDateString('vi-VN')
          }));
        }
        break;
      }

      case 'LEAVE_DAYS_USED': {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let balance = await LeaveBalance.findOne({ where: { user_id: userId, year: currentYear } });
        if (!balance) {
          balance = { total_days: 12, used_days: 0, pending_days: 0 };
        }
        // Đếm số ngày nghỉ trong tháng hiện tại
        const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
        const monthlyLeaves = await LeaveRequest.findAll({
          where: {
            user_id: userId,
            status: 'approved',
            start_date: { [Op.gte]: monthStart },
            end_date: { [Op.lte]: monthEnd }
          }
        });
        const daysThisMonth = monthlyLeaves.reduce((sum, r) => sum + Number(r.total_days), 0);
        data = {
          year: currentYear,
          month: currentMonth,
          total_days: balance.total_days,
          used_days: balance.used_days,
          pending_days: balance.pending_days,
          remaining_days: balance.total_days - balance.used_days - balance.pending_days,
          days_this_month: daysThisMonth
        };
        break;
      }

      case 'LEAVE_REQUEST': {
        // Kiểm tra đủ thông tin chưa
        const { start_date, end_date, reason, total_days } = params;
        if (!start_date || !end_date || !reason) {
          // Thiếu thông tin - yêu cầu bổ sung
          const missing = [];
          if (!start_date || !end_date) missing.push('ngày bắt đầu và kết thúc');
          if (!reason) missing.push('lý do nghỉ');
          return res.json({
            success: true,
            reply: `📋 Để xin nghỉ phép, tôi cần biết thêm: **${missing.join(', ')}**. Bạn vui lòng cung cấp nhé!`,
            intent: 'LEAVE_REQUEST_PARTIAL',
            params
          });
        }

        // Tính số ngày
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffDays = total_days || Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Kiểm tra quỹ phép
        const currentYear = start.getFullYear();
        let balance = await LeaveBalance.findOne({ where: { user_id: userId, year: currentYear } });
        if (!balance) {
          balance = await LeaveBalance.create({ user_id: userId, year: currentYear, total_days: 12, used_days: 0, pending_days: 0 });
        }
        const remaining = balance.total_days - balance.used_days - balance.pending_days;
        if (diffDays > remaining) {
          return res.json({
            success: true,
            reply: `❌ Bạn không đủ ngày phép. Bạn chỉ còn **${remaining} ngày phép**, nhưng bạn đang xin **${diffDays} ngày**. Vui lòng điều chỉnh lại!`,
            intent: 'LEAVE_REQUEST_FAILED'
          });
        }

        // Tạo đơn
        const newRequest = await LeaveRequest.create({
          user_id: userId,
          type: 'leave',
          start_date,
          end_date,
          total_days: diffDays,
          reason,
          status: 'pending'
        });
        balance.pending_days += diffDays;
        await balance.save();

        data = {
          id: newRequest.id,
          start_date: start.toLocaleDateString('vi-VN'),
          end_date: end.toLocaleDateString('vi-VN'),
          total_days: diffDays,
          reason,
          status: 'Đang chờ duyệt'
        };
        break;
      }

      case 'UNKNOWN':
        try {
          const logPath = path.join(__dirname, '../../unanswered_questions.txt');
          const timestamp = new Date().toLocaleString('vi-VN');
          const logEntry = `[${timestamp}] UserID: ${userId || 'Guest'} - Câu hỏi: ${message}\n`;
          fs.appendFileSync(logPath, logEntry, 'utf8');
          console.log('[Chatbot] Đã ghi câu hỏi không trả lời được vào file unanswered_questions.txt');
        } catch (saveErr) {
          console.error('[Chatbot] Lỗi khi ghi câu hỏi vào file:', saveErr.message);
        }
        data = null;
        break;

      default:
        data = null;
    }

    // Bước 3: Gemini tạo câu trả lời thân thiện
    const reply = await generateFriendlyResponse({
      userMessage: message,
      intent,
      data,
      userName,
      error
    });

    return res.json({
      success: true,
      reply,
      intent
    });

  } catch (err) {
    console.error('[Chatbot] Main error:', err.message, err.status || '', err.errorDetails || '');
    return res.status(500).json({
      success: false,
      reply: '😔 Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!',
      message: err.message
    });
  }
};
