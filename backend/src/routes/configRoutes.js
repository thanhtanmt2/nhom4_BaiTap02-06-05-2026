const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');

// GET /api/config/tax-insurance (Public hoặc Private đều được, nhưng Private an toàn hơn)
router.get('/tax-insurance', authenticateToken, configController.getConfig);

// PUT /api/config/tax-insurance (Chỉ Admin)
router.put('/tax-insurance', authenticateToken, authorizeAdmin, configController.updateConfig);

module.exports = router;
