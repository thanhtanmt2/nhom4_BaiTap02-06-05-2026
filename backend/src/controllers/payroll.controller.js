const { User, Contract, TaxInsuranceConfig, Payroll, SalaryAdjustment, AdvanceRequest, Profile, LeaveRequest } = require('../entities');
const { Op } = require('sequelize');

exports.calculatePayroll = async (req, res) => {
  try {
    const { month } = req.body; // e.g. "2026-11"
    if (!month) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng tính lương (VD: 2026-11)' });
    }

    // Lấy cấu hình thuế bảo hiểm
    const config = await TaxInsuranceConfig.findByPk(1);
    if (!config) {
      return res.status(400).json({ success: false, message: 'Chưa có cấu hình Thuế/Bảo hiểm' });
    }

    // Lấy tất cả nhân viên có hợp đồng
    const users = await User.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Contract,
          as: 'contracts',
          where: { status: 'active' },
          required: false // Lấy cả những user chưa có hợp đồng để log ra nếu cần
        }
      ]
    });

    const results = [];
    let calculatedCount = 0;

    for (const user of users) {
      // Chỉ tính lương cho người có hợp đồng Active
      if (!user.contracts || user.contracts.length === 0) continue;
      
      const contract = user.contracts[0]; // Giả sử lấy hợp đồng active đầu tiên
      const baseSalary = Number(contract.basic_salary) || 0;
      const employeeType = contract.employee_type || 'Full-time';

      // Xóa phiếu lương nháp cũ của tháng này nếu có
      await Payroll.destroy({
        where: { user_id: user.id, month, status: 'draft' }
      });

      // Kiểm tra xem đã duyệt/đã trả chưa
      const existing = await Payroll.findOne({
        where: { user_id: user.id, month }
      });
      if (existing) {
        // Đã duyệt hoặc trả -> bỏ qua không tính lại
        continue;
      }

      // Lấy TẤT CẢ khoản thu nhập/khấu trừ của tháng này (cả pending lẫn applied)
      // Các khoản pending sẽ được tự động đánh dấu applied khi tính lương
      const adjustments = await SalaryAdjustment.findAll({
        where: {
          user_id: user.id,
          apply_month: month,
          status: { [Op.in]: ['pending', 'applied'] }
        }
      });

      // Auto-apply các khoản đang pending → applied
      const pendingIds = adjustments.filter(a => a.status === 'pending').map(a => a.id);
      if (pendingIds.length > 0) {
        await SalaryAdjustment.update(
          { status: 'applied', updated_at: new Date() },
          { where: { id: { [Op.in]: pendingIds } } }
        );
      }

      let allowance = 0;
      let bonus = 0;
      let deduction = 0;

      adjustments.forEach(adj => {
        if (adj.kind === 'income') {
          // Phụ cấp: category chứa 'phụ cấp' hoặc 'allowance'
          const cat = (adj.category || '').toLowerCase();
          if (cat.includes('phụ cấp') || cat.includes('allowance')) {
            allowance += Number(adj.amount) || 0;
          } else {
            bonus += Number(adj.amount) || 0;
          }
        } else if (adj.kind === 'deduction') {
          deduction += Number(adj.amount) || 0;
        }
      });

      // Cộng thêm lương OT từ các đơn OT đã được duyệt trong tháng
      const [monthYear, monthNum] = [month.split('-')[0], month.split('-')[1]];
      const monthStart = `${monthYear}-${monthNum}-01`;
      const lastDay = new Date(Number(monthYear), Number(monthNum), 0).getDate();
      const monthEnd = `${monthYear}-${monthNum}-${String(lastDay).padStart(2, '0')}`;

      const approvedOTs = await LeaveRequest.findAll({
        where: {
          user_id: user.id,
          type: 'ot',
          status: 'approved',
          start_date: { [Op.gte]: monthStart, [Op.lte]: monthEnd }
        }
      });
      const totalOtHours = approvedOTs.reduce((s, r) => s + (Number(r.ot_hours) || 0), 0);
      if (totalOtHours > 0) {
        // Quy đổi: lương/giờ × hệ số 1.5 × số giờ OT (giả định 176 giờ/tháng)
        const hourlyRate = baseSalary / 176;
        bonus += Math.round(hourlyRate * 1.5 * totalOtHours);
      }

      // Truy vấn các khoản tạm ứng đang khấu trừ (deducting)
      let advance = 0;
      const activeAdvances = await AdvanceRequest.findAll({
        where: {
          user_id: user.id,
          status: 'deducting'
        }
      });
      activeAdvances.forEach(adv => {
        if (adv.deduct_method === 'split' && adv.deduct_months > 0) {
          const monthlyDeduct = Math.floor(Number(adv.amount) / adv.deduct_months);
          advance += monthlyDeduct;
        } else {
          advance += Number(adv.amount) || 0;
        }
      });

      let insuranceEmployee = 0;
      let tax = 0;

      // Tính bảo hiểm
      if (employeeType === 'Full-time') {
        const insuranceSalary = Math.min(baseSalary, Number(config.max_insurance_salary));
        const totalInsuranceRate = Number(config.social_insurance_rate) + Number(config.health_insurance_rate) + Number(config.unemployment_insurance_rate);
        insuranceEmployee = (insuranceSalary * totalInsuranceRate) / 100;
      }

      // Tính thu nhập chịu thuế
      const taxableIncome = baseSalary + allowance + bonus - deduction - insuranceEmployee - Number(config.personal_deduction);

      // Tính thuế
      if (employeeType === 'Freelancer') {
        // Freelancer khấu trừ cứng 10%
        tax = (baseSalary + allowance + bonus) * 0.1;
      } else {
        // Tính thuế TNCN lũy tiến 7 bậc (theo Luật Thuế TNCN hiện hành)
        if (taxableIncome > 0) {
          if (taxableIncome <= 5000000)       tax = taxableIncome * 0.05;
          else if (taxableIncome <= 10000000) tax = 250000   + (taxableIncome - 5000000)  * 0.1;
          else if (taxableIncome <= 18000000) tax = 750000   + (taxableIncome - 10000000) * 0.15;
          else if (taxableIncome <= 32000000) tax = 1950000  + (taxableIncome - 18000000) * 0.2;
          else if (taxableIncome <= 52000000) tax = 4750000  + (taxableIncome - 32000000) * 0.25;
          else if (taxableIncome <= 80000000) tax = 9750000  + (taxableIncome - 52000000) * 0.30;
          else                                tax = 18150000 + (taxableIncome - 80000000) * 0.35;
        }
      }

      // Lương thực nhận
      const netSalary = baseSalary + allowance + bonus - deduction - advance - insuranceEmployee - tax;

      const payroll = await Payroll.create({
        user_id: user.id,
        month,
        base_salary: baseSalary,
        allowance,
        bonus,
        deduction,
        advance,
        insurance_company: 0, // Tính sau
        insurance_employee: insuranceEmployee,
        tax,
        net_salary: netSalary > 0 ? netSalary : 0,
        status: 'draft'
      });

      results.push(payroll);
      calculatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Đã tính lương nháp thành công cho ${calculatedCount} nhân sự`,
      data: results
    });

  } catch (error) {
    console.error('Lỗi tính lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tính lương' });
  }
};

exports.getPayrollsByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    const whereClause = {};
    if (month) whereClause.month = month;

    const payrolls = await Payroll.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: Contract,
              as: 'contracts',
              where: { status: 'active' },
              required: false,
              attributes: ['employee_type'],
              limit: 1
            }
          ]
        }
      ]
    });

    // Flatten employee_type lên tầng payroll để FE đọc dễ
    const data = payrolls.map(p => {
      const raw = p.toJSON();
      raw.employee_type = raw.user?.contracts?.[0]?.employee_type || 'Full-time';
      return raw;
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.getMyPayrolls = async (req, res) => {
  try {
    const userId = req.user.id;
    const payrolls = await Payroll.findAll({
      where: { 
        user_id: userId,
        // Chỉ cho phép xem lương đã duyệt hoặc đã trả
        status: { [Op.in]: ['approved', 'paid'] }
      },
      order: [['month', 'DESC']]
    });
    
    res.status(200).json({ success: true, data: payrolls });
  } catch (error) {
    console.error('Lỗi khi lấy phiếu lương cá nhân:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.approvePayroll = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số tháng (month)' });
    }

    // Đổi trạng thái toàn bộ phiếu lương 'draft' thành 'approved' trong tháng đó
    const [updatedRows] = await Payroll.update(
      { status: 'approved' },
      { where: { month: month, status: 'draft' } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không có phiếu lương nháp nào để duyệt trong tháng này' });
    }

    res.status(200).json({ success: true, message: `Đã duyệt thành công ${updatedRows} phiếu lương cho tháng ${month}` });
  } catch (error) {
    console.error('Lỗi khi duyệt lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi duyệt lương' });
  }
};

exports.payPayroll = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số tháng (month)' });
    }

    const [updatedRows] = await Payroll.update(
      { status: 'paid', paid_at: new Date() },
      { where: { month, status: 'approved' } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không có phiếu lương đã duyệt nào để thanh toán trong tháng này' });
    }

    res.status(200).json({ success: true, message: `Đã thanh toán thành công ${updatedRows} phiếu lương cho tháng ${month}` });
  } catch (error) {
    console.error('Lỗi khi thanh toán lương:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi thanh toán lương' });
  }
};
