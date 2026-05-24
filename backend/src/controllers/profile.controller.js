const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');
const { updateProfileValidation } = require('../validations/profile.validation');
const { logActivity } = require('../utils/activityLogger');

// Lấy thông tin profile của user hiện tại
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy thông tin User
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Lấy thông tin Profile
    let profile = await Profile.findOne({
      where: { user_id: userId }
    });

    // Nếu chưa có profile, tạo mới
    if (!profile) {
      profile = await Profile.create({
        user_id: userId,
        full_name: null,
        phone: null,
        address: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin profile thành công',
      data: {
        user: user,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
};

// Cập nhật thông tin profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validate dữ liệu
    const { error, value } = updateProfileValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Tìm profile
    let profile = await Profile.findOne({
      where: { user_id: userId }
    });

    // Nếu chưa có profile, tạo mới
    if (!profile) {
      profile = await Profile.create({
        user_id: userId,
        ...value
      });
    } else {
      // Cập nhật profile
      await profile.update(value);
    }

    // Lấy thông tin user (không lấy password)
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    await logActivity({
      userId,
      action: 'update_profile',
      detail: 'Cập nhật thông tin profile',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: {
        user: user,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật profile'
    });
  }
};

// Admin: Lấy profile của user theo ID
const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra user có tồn tại
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Lấy profile
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin profile thành công',
      data: {
        user: user,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Get Profile By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
};

// Upload ảnh đại diện
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file ảnh' });
    }
    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    let profile = await Profile.findOne({ where: { user_id: userId } });
    if (!profile) {
      profile = await Profile.create({ user_id: userId, avatar_url: avatarUrl });
    } else {
      if (profile.avatar_url) {
        const oldPath = path.join(__dirname, '../../', profile.avatar_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await profile.update({ avatar_url: avatarUrl });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: { avatar_url: avatarUrl },
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh' });
  }
};

// Lấy nhật ký hoạt động của user hiện tại
const getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const [logs, unreadCount] = await Promise.all([
      ActivityLog.findAll({
        where: { user_id: userId },
        attributes: ['id', 'action', 'detail', 'created_at', 'is_read'],
        order: [['created_at', 'DESC']],
        limit,
      }),
      ActivityLog.count({ where: { user_id: userId, is_read: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get My Activities Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy nhật ký hoạt động',
    });
  }
};

// Đánh dấu đã đọc toàn bộ nhật ký của user hiện tại
const markMyActivitiesRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await ActivityLog.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    });
  } catch (error) {
    console.error('Mark Activities Read Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu đã đọc',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfileById,
  uploadAvatar,
  getMyActivities,
  markMyActivitiesRead,
};
