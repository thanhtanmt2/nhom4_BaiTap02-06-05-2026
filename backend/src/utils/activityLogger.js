const ActivityLog = require('../models/ActivityLog');

const getClientIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req?.socket?.remoteAddress || req?.ip || null;
};

const logActivity = async ({ userId, action, detail, req }) => {
  try {
    await ActivityLog.create({
      user_id: userId || null,
      action,
      detail: detail || null,
      ip: getClientIp(req),
      user_agent: req?.headers?.['user-agent'] || null,
    });
  } catch (error) {
    console.error('Activity Log Error:', error.message);
  }
};

module.exports = { logActivity };
