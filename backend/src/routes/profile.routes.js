const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getProfileById,
  uploadAvatar,
  getMyActivities,
  markMyActivitiesRead,
} = require('../controllers/profile.controller');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const accountantController = require('../controllers/accountant.controller');

router.get('/', authenticateToken, getProfile);
router.get('/activity', authenticateToken, getMyActivities);
router.post('/activity/read', authenticateToken, markMyActivitiesRead);
router.put('/', authenticateToken, updateProfile);
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);
router.get('/my-payslips/list', authenticateToken, accountantController.getMyPayslips);
router.get('/:userId', authenticateToken, authorizeAdmin, getProfileById);

// Error handling middleware for profile routes (e.g. Multer size limit)
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Dung lượng ảnh không được vượt quá 2MB',
    });
  }
  return res.status(400).json({
    success: false,
    message: err.message || 'Lỗi khi tải ảnh lên',
  });
});

module.exports = router;
