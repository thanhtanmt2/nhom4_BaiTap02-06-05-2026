const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveRequest = sequelize.define(
  'LeaveRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.STRING, // Đổi từ ENUM sang STRING để bộc lộ rõ lỗ hổng của Controller
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_days: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ot_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'leave_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = LeaveRequest;
