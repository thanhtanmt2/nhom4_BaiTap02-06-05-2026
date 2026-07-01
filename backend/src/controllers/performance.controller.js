const { Task, Attendance, PerformanceReview, PromotionProposal, User, Contract, LeaveBalance, LeaveRequest } = require('../entities');
const { Op } = require('sequelize');

exports.getDashboardData = async (req, res) => {
  try {
    // Determine the target user. An employee checks their own, HR/Manager can check others.
    const userId = req.params.userId || req.user.id;
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : null;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Setup date filters
    let taskFilter = { assigned_to_id: userId };
    let attendanceFilter = { user_id: userId };
    
    if (currentMonth && currentYear) {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      
      taskFilter.created_at = { [Op.between]: [startDate, endDate] };
      attendanceFilter.date = { [Op.between]: [startDate, endDate] };
    }

    // 1. Task Statistics
    const tasks = await Task.findAll({ where: taskFilter });
    const overdueCount = tasks.filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;

    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      pending: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      inReview: tasks.filter(t => t.status === 'review').length,
      overdue: overdueCount,
    };

    // 2. Attendance & Leave Statistics
    const attendances = await Attendance.findAll({ where: attendanceFilter });
    
    let leaveDays = 0;
    if (currentMonth) {
      // Đếm số ngày nghỉ phép ĐÃ ĐƯỢC DUYỆT trong tháng đó
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      const approvedLeaves = await LeaveRequest.findAll({
        where: {
          user_id: userId,
          type: 'leave',
          status: 'approved',
          start_date: { [Op.between]: [startDate, endDate] }
        }
      });
      leaveDays = approvedLeaves.reduce((sum, req) => sum + parseFloat(req.total_days || 0), 0);
    } else {
      // Xem toàn bộ thì lấy used_days từ LeaveBalance của năm
      const balance = await LeaveBalance.findOne({ where: { user_id: userId, year: currentYear } });
      leaveDays = balance ? balance.used_days : 0;
    }
    
    const attendanceStats = {
      workingDays: attendances.filter(a => a.status === 'Present').length,
      lateDays: attendances.filter(a => a.status === 'Late').length,
      leaveDays: leaveDays,
      absentDays: attendances.filter(a => a.status === 'Absent').length,
    };

    // 3. Latest Performance Reviews
    let reviewFilter = { user_id: userId };
    if (currentMonth && currentYear) {
      reviewFilter.month = currentMonth;
      reviewFilter.year = currentYear;
    }

    const reviews = await PerformanceReview.findAll({
      where: reviewFilter,
      order: [['year', 'DESC'], ['month', 'DESC']],
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }]
    });

    res.json({
      success: true,
      data: {
        taskStats,
        attendanceStats,
        reviews,
        currentMonth,
        currentYear
      }
    });

  } catch (error) {
    console.error('getDashboardData error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.submitReview = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Forbidden: Manager role required' });
    }
    const { user_id, month, year, rating, kpi_score, comments } = req.body;

    if (kpi_score === undefined || kpi_score === null || kpi_score < 0 || kpi_score > 100) {
      return res.status(400).json({ success: false, message: 'Điểm KPI phải trong khoảng 0–100' });
    }

    // Check if review already exists
    let review = await PerformanceReview.findOne({ where: { user_id, month, year } });
    if (review) {
      review.rating = rating;
      review.kpi_score = kpi_score;
      review.comments = comments;
      review.reviewer_id = req.user.id;
      await review.save();
    } else {
      review = await PerformanceReview.create({
        user_id,
        reviewer_id: req.user.id,
        month,
        year,
        rating,
        kpi_score,
        comments
      });
    }

    res.json({ success: true, data: review, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('submitReview error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createPromotionProposal = async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Forbidden: Manager role required' });
    }
    const { user_id, current_position, proposed_position, proposed_salary, reason } = req.body;

    let warning = null;
    let finalProposedPosition = proposed_position;

    if (proposed_salary) {
      const activeContract = await Contract.findOne({
        where: { user_id, status: 'active' }
      });
      if (activeContract && activeContract.basic_salary > 0) {
        const increasePercent = ((proposed_salary - activeContract.basic_salary) / activeContract.basic_salary) * 100;
        if (increasePercent > 30) {
          warning = 'Mức tăng vượt ngưỡng, cần phê duyệt thêm từ cấp trên';
        }
      }
      finalProposedPosition = `${proposed_position} (Lương đề xuất: ${Number(proposed_salary).toLocaleString('vi-VN')} VNĐ)`;
    }

    const proposal = await PromotionProposal.create({
      user_id,
      proposed_by: req.user.id,
      current_position,
      proposed_position: finalProposedPosition,
      reason,
      status: 'Pending'
    });

    res.json({ success: true, data: proposal, warning, message: 'Proposal created' });
  } catch (error) {
    console.error('createPromotionProposal error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPromotionProposals = async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Forbidden: Role required' });
    }
    const { Profile } = require('../entities');
    const proposals = await PromotionProposal.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{ model: Profile }]
        },
        { model: User, as: 'proposer', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: proposals });
  } catch (error) {
    console.error('getPromotionProposals error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updatePromotionStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin or HR role required' });
    }
    const { id } = req.params;
    const { status } = req.body;

    const proposal = await PromotionProposal.findByPk(id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    proposal.status = status;
    await proposal.save();

    res.json({ success: true, data: proposal, message: 'Status updated' });
  } catch (error) {
    console.error('updatePromotionStatus error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { month, year } = req.query;
    const { Department, PerformanceReview } = require('../entities');
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['id', 'name', 'email', 'status'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Contract,
          as: 'contracts',
          where: { status: 'active' },
          required: false,
          attributes: ['basic_salary']
        }
      ]
    });

    const formattedEmployees = await Promise.all(employees.map(async (emp) => {
      const e = emp.toJSON();
      
      const reviewWhere = { user_id: e.id };
      if (month && year) {
        reviewWhere.month = parseInt(month);
        reviewWhere.year = parseInt(year);
      }

      const latestReview = await PerformanceReview.findOne({
        where: reviewWhere,
        order: [['year', 'DESC'], ['month', 'DESC']]
      });
      if (latestReview) {
        e.latest_rating = latestReview.rating;
        e.latest_kpi_score = latestReview.kpi_score;
      }
      return e;
    }));

    res.json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error('getAllEmployees error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
