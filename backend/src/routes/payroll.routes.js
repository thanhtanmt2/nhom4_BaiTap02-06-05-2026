const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Nhân viên xem phiếu lương cá nhân của họ
router.get('/my-payrolls', authenticateToken, payrollController.getMyPayrolls);

// Chỉ Kế toán hoặc Admin mới được thao tác lương chung
router.use(authenticateToken, authorizeRoles(['admin', 'accountant']));

// Lấy danh sách lương theo tháng
router.get('/', payrollController.getPayrollsByMonth);

// Kích hoạt tính lương cho một tháng
router.post('/calculate', payrollController.calculatePayroll);

// Duyệt lương cho một tháng
router.put('/approve', payrollController.approvePayroll);

// Thanh toán lương cho một tháng (approved → paid)
router.put('/pay', payrollController.payPayroll);

module.exports = router;
