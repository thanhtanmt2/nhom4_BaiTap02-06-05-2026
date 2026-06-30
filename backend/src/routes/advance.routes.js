const express = require('express');
const router = express.Router();
const advanceController = require('../controllers/advance.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Tất cả route cần đăng nhập
router.use(authenticateToken);

// ── Thêm chức năng cho nhân viên tự thao tác (không cần quyền kế toán) ──
router.post('/request', advanceController.requestAdvance);
router.get('/my-requests', advanceController.getMyRequests);

const authorizeAccountant = authorizeRoles(['admin', 'accountant']);

// ── Stats (phải khai báo trước /:id để không bị nhầm route)
router.get('/stats',     authorizeAccountant, advanceController.getStats);
router.get('/employees', authorizeAccountant, advanceController.getEmployees);

// ── CRUD
router.get('/',    authorizeAccountant, advanceController.getAll);
router.get('/:id', authorizeAccountant, advanceController.getOne);
router.post('/',   authorizeAccountant, advanceController.create);

// ── Actions
router.post('/:id/approve',  authorizeAccountant, advanceController.approve);
router.post('/:id/reject',   authorizeAccountant, advanceController.reject);
router.post('/:id/disburse', authorizeAccountant, advanceController.disburse);

module.exports = router;
