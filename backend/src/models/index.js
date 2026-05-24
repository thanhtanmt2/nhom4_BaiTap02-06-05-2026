const User = require('./User');
const Profile = require('./Profile');
const OTP = require('./OTP');
const ActivityLog = require('./ActivityLog');

// Define Associations
User.hasOne(Profile, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasMany(OTP, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

OTP.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasMany(ActivityLog, {
  foreignKey: 'user_id',
  onDelete: 'SET NULL'
});

ActivityLog.belongsTo(User, {
  foreignKey: 'user_id'
});

module.exports = {
  User,
  Profile,
  OTP,
  ActivityLog
};
