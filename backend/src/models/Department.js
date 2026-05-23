const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Tên phòng ban (Ví dụ: Phòng Kế toán, Phòng IT, Nhân sự)
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    // Mô tả sơ lược về chức năng của phòng ban
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Trạng thái hoạt động của phòng ban (active: đang hoạt động, inactive: đã giải tán/ngưng hoạt động)
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'departments',
    timestamps: false, // Ta tự quản lý created_at và updated_at
  }
);

module.exports = Department;
