const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxInsuranceConfig = sequelize.define(
  'TaxInsuranceConfig',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    social_insurance_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 8.0,
    },
    health_insurance_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.5,
    },
    unemployment_insurance_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    base_salary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 2340000.00,
    },
    max_insurance_salary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 46800000.00,
    },
    personal_deduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 11000000.00,
    },
    dependent_deduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 4400000.00,
    },
  },
  {
    tableName: 'tax_insurance_configs',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
  }
);

module.exports = TaxInsuranceConfig;
