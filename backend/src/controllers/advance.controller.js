const { AdvanceRequest, User, Profile, Contract, Department } = require('../entities');
const { Op } = require('sequelize');
const { roleNames, mapEmployeeProfile } = require('../utils/helpers');

const mapAdvance = (adv) => {
  if (!adv) return null;
  const json = adv.toJSON ? adv.toJSON() : adv;
  if (json.requester) {
    json.requester = mapEmployeeProfile(json.requester);
  }
  return json;
};

// ── helpers ───────────────────────────────────────────────────────────────────
const employeeInclude = {
  model: User,
  as: 'requester',
  attributes: ['id', 'name', 'email', 'role'],
  include: [
    { model: Profile, attributes: ['id', 'full_name', 'phone', 'address', 'avatar_url'] },
    { model: Department, as: 'department', attributes: ['id', 'name'] },
    {
      model: Contract,
      as: 'contracts',
      attributes: ['basic_salary', 'status'],
      where: { status: 'active' },
      required: false,
      limit: 1,
      order: [['created_at', 'DESC']],
    },
  ],
};

const reviewerInclude = {
  model: User,
  as: 'reviewer',
  attributes: ['id', 'name'],
};

// Generate mã đơn tự động ADV-YYYY-XXXX
const generateCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `ADV-${year}-`;
  const last = await AdvanceRequest.findOne({
    where: { code: { [Op.like]: `${prefix}%` } },
    order: [['id', 'DESC']],
    attributes: ['code'],
  });
  let seq = 1;
  if (last?.code) {
    const parts = last.code.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// ── GET /api/advances/my-requests ──────────────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await AdvanceRequest.findAll({
      where: { user_id: userId },
      include: [ reviewerInclude ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: requests.map(mapAdvance) });
  } catch (error) {
    console.error('getMyRequests error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách ứng lương' });
  }
};

// ── GET /api/advances ─────────────────────────────────────────────────────────
// Query: status, search (tên nhân viên)
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const requesterInclude = search
      ? { ...employeeInclude, where: { name: { [Op.like]: `%${search}%` } }, required: true }
      : employeeInclude;

    const { count, rows } = await AdvanceRequest.findAndCountAll({
      where,
      include: [requesterInclude, reviewerInclude],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const mapped = rows.map(mapAdvance);
    return res.json({ success: true, data: mapped, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error('getAll advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── GET /api/advances/:id ─────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const adv = await AdvanceRequest.findByPk(req.params.id, {
      include: [employeeInclude, reviewerInclude],
    });
    if (!adv) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    return res.json({ success: true, data: mapAdvance(adv) });
  } catch (err) {
    console.error('getOne advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/advances/request ────────────────────────────────────────────────
// Cho phép nhân viên tự tạo đơn ứng lương
exports.requestAdvance = async (req, res) => {
  try {
    const { amount, reason, urgent } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do' });
    }

    const code = await generateCode();
    
    // Check limit
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const sumRow = await AdvanceRequest.findAll({
      where: { user_id: userId, status: { [Op.not]: 'rejected' }, created_at: { [Op.gte]: startOfYear } },
      attributes: ['amount'],
    });
    const yearlyAdvanced = sumRow.reduce((s, r) => s + Number(r.amount), 0);
    
    let salary = 0;
    const emp = await User.findByPk(userId, { include: [{ model: Contract, as: 'contracts', where: { status: 'active' }, required: false }] });
    if (emp && emp.contracts && emp.contracts.length > 0) {
      salary = emp.contracts[0].basic_salary;
    }
    const yearlyLimit = salary * 1; // 1 month limit

    if (salary > 0 && yearlyAdvanced + Number(amount) > yearlyLimit) {
      return res.status(400).json({
        success: false,
        message: `Vượt hạn mức năm. Đã ứng: ${yearlyAdvanced}, hạn mức: ${yearlyLimit}`
      });
    }

    const newReq = await AdvanceRequest.create({
      code,
      user_id: userId,
      amount,
      monthly_salary: salary,
      yearly_advanced: yearlyAdvanced,
      yearly_limit: yearlyLimit,
      reason,
      urgent: !!urgent,
      status: 'pending',
    });

    const fullReq = await AdvanceRequest.findByPk(newReq.id, {
      include: [ employeeInclude, reviewerInclude ],
    });

    res.status(201).json({ success: true, data: mapAdvance(fullReq) });
  } catch (error) {
    console.error('requestAdvance error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi yêu cầu ứng lương' });
  }
};

// ── POST /api/advances ────────────────────────────────────────────────────────
// Nhân viên tự nộp đơn hoặc kế toán tạo hộ
exports.create = async (req, res) => {
  try {
    const { user_id, amount, reason, urgent, monthly_salary } = req.body;

    if (!user_id || !amount || !reason) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải lớn hơn 0' });
    }

    const targetUser = await User.findByPk(user_id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
    }

    // Lấy lương từ hợp đồng active nếu không truyền vào
    let salary = monthly_salary ? Number(monthly_salary) : null;
    if (!salary) {
      const contract = await Contract.findOne({
        where: { user_id, status: 'active' },
        order: [['created_at', 'DESC']],
      });
      salary = contract?.basic_salary || null;
    }

    // Tính hạn mức: 3 tháng lương (nếu có)
    const yearlyLimit = salary ? salary * 3 : null;

    // Tính tổng đã tạm ứng trong năm
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const sumRow = await AdvanceRequest.findAll({
      where: {
        user_id,
        status: { [Op.in]: ['approved', 'deducting', 'completed'] },
        created_at: { [Op.gte]: startOfYear },
      },
      attributes: ['amount'],
    });
    const yearlyAdvanced = sumRow.reduce((s, r) => s + Number(r.amount), 0);

    const code = await generateCode();

    const adv = await AdvanceRequest.create({
      code,
      user_id,
      amount: Number(amount),
      monthly_salary: salary,
      yearly_advanced: yearlyAdvanced,
      yearly_limit: yearlyLimit,
      reason,
      urgent: !!urgent,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await AdvanceRequest.findByPk(adv.id, {
      include: [employeeInclude, reviewerInclude],
    });
    return res.status(201).json({ success: true, data: mapAdvance(result) });
  } catch (err) {
    console.error('create advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/advances/:id/approve ───────────────────────────────────────────
exports.approve = async (req, res) => {
  try {
    const adv = await AdvanceRequest.findByPk(req.params.id);
    if (!adv) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    if (adv.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ duyệt được đơn đang chờ' });
    }

    const { disburse_date, deduct_method, deduct_months } = req.body;

    await adv.update({
      status: 'approved',
      disburse_date: disburse_date || null,
      deduct_method: deduct_method || 'split',
      deduct_months: deduct_method === 'split' ? (Number(deduct_months) || 3) : 1,
      reviewed_by: req.user?.id || null,
      updated_at: new Date(),
    });

    const result = await AdvanceRequest.findByPk(adv.id, {
      include: [employeeInclude, reviewerInclude],
    });
    return res.json({ success: true, data: mapAdvance(result) });
  } catch (err) {
    console.error('approve advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/advances/:id/reject ────────────────────────────────────────────
exports.reject = async (req, res) => {
  try {
    const adv = await AdvanceRequest.findByPk(req.params.id);
    if (!adv) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    if (adv.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Chỉ từ chối được đơn đang chờ' });
    }

    const { reject_reason } = req.body;
    if (!reject_reason) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
    }

    await adv.update({
      status: 'rejected',
      reject_reason,
      reviewed_by: req.user?.id || null,
      updated_at: new Date(),
    });

    const result = await AdvanceRequest.findByPk(adv.id, {
      include: [employeeInclude, reviewerInclude],
    });
    return res.json({ success: true, data: mapAdvance(result) });
  } catch (err) {
    console.error('reject advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── POST /api/advances/:id/disburse ──────────────────────────────────────────
// Đánh dấu đã chi tiền → chuyển sang deducting
exports.disburse = async (req, res) => {
  try {
    const adv = await AdvanceRequest.findByPk(req.params.id);
    if (!adv) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
    if (adv.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Chỉ chi tiền được đơn đã duyệt' });
    }

    const newStatus = adv.deduct_method === 'split' ? 'deducting' : 'completed';
    await adv.update({ status: newStatus, updated_at: new Date() });

    const result = await AdvanceRequest.findByPk(adv.id, {
      include: [employeeInclude, reviewerInclude],
    });
    return res.json({ success: true, data: mapAdvance(result) });
  } catch (err) {
    console.error('disburse advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── GET /api/advances/stats ───────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [pending, approved, deducting, completed] = await Promise.all([
      AdvanceRequest.count({ where: { status: 'pending' } }),
      AdvanceRequest.count({ where: { status: 'approved' } }),
      AdvanceRequest.count({ where: { status: 'deducting' } }),
      AdvanceRequest.count({ where: { status: 'completed' } }),
    ]);
    // Tổng tiền tháng hiện tại
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthRows = await AdvanceRequest.findAll({
      where: {
        status: { [Op.in]: ['approved', 'deducting', 'completed'] },
        created_at: { [Op.gte]: startOfMonth },
      },
      attributes: ['amount'],
    });
    const monthTotal = monthRows.reduce((s, r) => s + Number(r.amount), 0);

    return res.json({
      success: true,
      data: { pending, approved, deducting, completed, monthTotal },
    });
  } catch (err) {
    console.error('getStats advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ── GET /api/advances/employees ───────────────────────────────────────────────
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: { [Op.in]: ['employee', 'user', 'manager', 'accountant', 'hr'] } },
      attributes: ['id', 'name', 'email', 'role'],
      include: [
        { model: Profile, attributes: ['id', 'full_name', 'phone', 'address', 'avatar_url'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        {
          model: Contract,
          as: 'contracts',
          attributes: ['basic_salary', 'status'],
          where: { status: 'active' },
          required: false,
          limit: 1,
          order: [['created_at', 'DESC']],
        },
      ],
      order: [['name', 'ASC']],
    });
    const mapped = employees.map(mapEmployeeProfile);
    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('getEmployees advance error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
