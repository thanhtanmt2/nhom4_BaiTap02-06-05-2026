const User = require('./User');
const Profile = require('./Profile');
const OTP = require('./OTP');
const Department = require('./Department');

// Define Associations
// 1 Phòng ban có nhiều Nhân viên
Department.hasMany(User, {
  foreignKey: 'department_id',
  as: 'users'
});

// 1 Nhân viên thuộc về 1 Phòng ban
User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department'
});

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

module.exports = {
  User,
  Profile,
  OTP,
  Department
};
