const { Payroll, User, Profile, SalaryAdjustment } = require('../entities');
const { sendPayslipEmail } = require('../utils/mailer');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

// Xem danh sách bảng lương (lọc theo month YYYY-MM hoặc year)
const getPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;
    let whereClause = {};

    if (month && year) {
      // Truyền cả month và year -> tạo filter theo YYYY-MM
      const mm = String(month).padStart(2, '0');
      whereClause.month = `${year}-${mm}`;
    } else if (month) {
      // Chỉ truyền month dạng YYYY-MM
      whereClause.month = month;
    }

    const payrollRows = await Payroll.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: Profile,
              attributes: ['full_name', 'bank_name', 'bank_account_number', 'bank_account_name']
            }
          ]
        }
      ],
      order: [['month', 'DESC'], ['id', 'ASC']]
    });

    // Override allowance/bonus từ salary_adjustments (nguồn thực tế)
    const monthKey = whereClause.month;
    let adjMap = {};
    if (monthKey) {
      const adjs = await SalaryAdjustment.findAll({
        where: { apply_month: monthKey, status: 'applied', kind: 'income' },
        attributes: ['user_id', 'category', 'amount'],
      });
      adjs.forEach(adj => {
        const uid = adj.user_id;
        if (!adjMap[uid]) adjMap[uid] = { allowance: 0, bonus: 0 };
        const cat = (adj.category || '').toLowerCase();
        if (cat.includes('ph\u1ee5 c\u1ea5p') || cat.includes('allowance')) {
          adjMap[uid].allowance += Number(adj.amount);
        } else {
          adjMap[uid].bonus += Number(adj.amount);
        }
      });
    }

    const payrolls = payrollRows.map(p => {
      const raw = p.toJSON ? p.toJSON() : { ...p };
      if (adjMap[raw.user_id]) {
        raw.allowance = adjMap[raw.user_id].allowance;
        raw.bonus     = adjMap[raw.user_id].bonus;
      }
      return raw;
    });

    res.json({ success: true, payrolls });
  } catch (error) {
    console.error('Error in getPayrolls:', error);
    res.status(500).json({ success: false, message: 'L\u1ed7i server' });
  }
};

// Xuất file ngân hàng (Excel XLSX)
const exportBankFile = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng và năm.' });
    }

    const mm = String(month).padStart(2, '0');
    const monthKey = `${year}-${mm}`;

    const payrollRows = await Payroll.findAll({
      where: {
        month: monthKey,
        status: { [Op.in]: ['approved', 'paid'] }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name'],
          include: [
            {
              model: Profile,
              attributes: ['full_name', 'bank_name', 'bank_account_number', 'bank_account_name']
            }
          ]
        }
      ]
    });

    if (!payrollRows || payrollRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kh\u00f4ng t\u00ecm th\u1ea5y d\u1eef li\u1ec7u l\u01b0\u01a1ng \u0111\u00e3 duy\u1ec7t cho th\u00e1ng n\u00e0y.' });
    }

    // Lấy allowance/bonus thực từ salary_adjustments
    const adjsExport = await SalaryAdjustment.findAll({
      where: { apply_month: monthKey, status: 'applied', kind: 'income' },
      attributes: ['user_id', 'category', 'amount'],
    });
    const adjMapExport = {};
    adjsExport.forEach(adj => {
      const uid = adj.user_id;
      if (!adjMapExport[uid]) adjMapExport[uid] = { allowance: 0, bonus: 0 };
      const cat = (adj.category || '').toLowerCase();
      if (cat.includes('ph\u1ee5 c\u1ea5p') || cat.includes('allowance')) {
        adjMapExport[uid].allowance += Number(adj.amount);
      } else {
        adjMapExport[uid].bonus += Number(adj.amount);
      }
    });

    const payrolls = payrollRows.map(p => {
      const raw = p.toJSON ? p.toJSON() : { ...p };
      if (adjMapExport[raw.user_id]) {
        raw.allowance = adjMapExport[raw.user_id].allowance;
        raw.bonus     = adjMapExport[raw.user_id].bonus;
      }
      return raw;
    });

    const headers = [
      'STT', 'H\u1ecd v\u00e0 t\u00ean', 'S\u1ed1 t\u00e0i kho\u1ea3n', 'Ng\u00e2n h\u00e0ng', 'T\u00ean ch\u1ee7 TK',
      'L\u01b0\u01a1ng c\u01a1 b\u1ea3n', 'Ph\u1ee5 c\u1ea5p', 'Th\u01b0\u1edfng', 'Kh\u1ea5u tr\u1eeb',
      'Thu\u1ebf TNCN', 'B\u1ea3o hi\u1ec3m NV', 'Th\u1ef1c l\u00e3nh', 'N\u1ed9i dung CK'
    ];

    const wsData = [headers];

    payrolls.forEach((p, index) => {
      const profile = p.user?.Profile || {};
      const fullName = profile.full_name || p.user?.name || '';
      const accNumber = profile.bank_account_number || '';
      const bankName = profile.bank_name || '';
      const accName = profile.bank_account_name || fullName;
      const description = `Luong T${month}/${year}`;

      wsData.push([
        index + 1,
        fullName,
        accNumber,
        bankName,
        accName,
        Math.round(Number(p.base_salary) || 0),
        Math.round(Number(p.allowance) || 0),
        Math.round(Number(p.bonus) || 0),
        Math.round(Number(p.deduction) || 0),
        Math.round(Number(p.tax) || 0),
        Math.round(Number(p.insurance_employee) || 0),
        Math.round(Number(p.net_salary) || 0),
        description
      ]);
    });

    const totalBase       = payrolls.reduce((s, p) => s + Math.round(Number(p.base_salary) || 0), 0);
    const totalAllowance  = payrolls.reduce((s, p) => s + Math.round(Number(p.allowance) || 0), 0);
    const totalBonus      = payrolls.reduce((s, p) => s + Math.round(Number(p.bonus) || 0), 0);
    const totalDeduction  = payrolls.reduce((s, p) => s + Math.round(Number(p.deduction) || 0), 0);
    const totalTax        = payrolls.reduce((s, p) => s + Math.round(Number(p.tax) || 0), 0);
    const totalInsurance  = payrolls.reduce((s, p) => s + Math.round(Number(p.insurance_employee) || 0), 0);
    const totalNet        = payrolls.reduce((s, p) => s + Math.round(Number(p.net_salary) || 0), 0);

    wsData.push([
      '', '', '', '', 'TỔNG CỘNG',
      totalBase, totalAllowance, totalBonus, totalDeduction,
      totalTax, totalInsurance, totalNet, ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const maxCols = wsData[0].length;
    const wscols = [];
    for (let i = 0; i < maxCols; i++) {
      let maxLen = 10;
      wsData.forEach(row => {
        const val = row[i];
        if (val) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      wscols.push({ wch: maxLen + 2 });
    }
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách chi lương');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Bank_Export_T${month}_${year}.xlsx`);
    res.send(buf);
  } catch (error) {
    console.error('Error in exportBankFile:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Gửi phiếu lương cho 1 nhân viên
const sendPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          include: [{ model: Profile }]
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng lương.' });
    }

    const email = payroll.user.email;
    const name = payroll.user.Profile?.full_name || 'Nhân viên';

    await sendPayslipEmail(email, name, payroll);

    payroll.is_payslip_sent = true;
    await payroll.save();

    res.json({ success: true, message: 'Gửi phiếu lương thành công.' });
  } catch (error) {
    console.error('Error in sendPayslip:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi email.' });
  }
};

// Gửi hàng loạt theo tháng YYYY-MM hoặc month+year riêng
const sendBatchPayslips = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng và năm.' });
    }

    const mm = String(month).padStart(2, '0');
    const monthKey = `${year}-${mm}`;

    const payrolls = await Payroll.findAll({
      where: {
        month: monthKey,
        is_payslip_sent: false
      },
      include: [
        {
          model: User,
          as: 'user',
          include: [{ model: Profile }]
        }
      ]
    });

    if (payrolls.length === 0) {
      return res.json({ success: true, message: 'Không có phiếu lương nào cần gửi.' });
    }

    let successCount = 0;
    for (let p of payrolls) {
      try {
        const email = p.user.email;
        const name = p.user.Profile?.full_name || 'Nhân viên';
        await sendPayslipEmail(email, name, p);
        p.is_payslip_sent = true;
        await p.save();
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${p.user.email}`, err);
      }
    }

    res.json({ success: true, message: `Đã gửi thành công ${successCount}/${payrolls.length} phiếu lương.` });
  } catch (error) {
    console.error('Error in sendBatchPayslips:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Nhân viên xem phiếu lương của chính mình
const getMyPayslips = async (req, res) => {
  try {
    const userId = req.user.id;
    const payrolls = await Payroll.findAll({
      where: { user_id: userId },
      order: [['month', 'DESC']]
    });
    res.json({ success: true, payrolls });
  } catch (error) {
    console.error('Error in getMyPayslips:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getPayrolls,
  exportBankFile,
  sendPayslip,
  sendBatchPayslips,
  getMyPayslips
};
