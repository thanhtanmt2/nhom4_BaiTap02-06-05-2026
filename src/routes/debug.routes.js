const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');

// Debug: Get all users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug: Get all profiles
router.get('/debug/profiles', async (req, res) => {
  try {
    const profiles = await Profile.findAll();
    res.json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug: Get user with profile
router.get('/debug/user/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] }
    });
    const profile = await Profile.findOne({
      where: { user_id: req.params.userId }
    });
    
    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug: Get database stats
router.get('/debug/stats', async (req, res) => {
  try {
    const userCount = await User.count();
    const profileCount = await Profile.count();
    
    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalProfiles: profileCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
