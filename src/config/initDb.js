require('dotenv').config();
const { Sequelize } = require('sequelize');
const createAdminAccount = require('../utils/createAdmin');

const initializeDatabase = async () => {
  try {
    // Create connection without database to execute CREATE DATABASE
    const sequelizeAdmin = new Sequelize(
      '',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      }
    );

    try {
      // Create database if not exists
      const dbName = process.env.DB_NAME || 'nhom4_baitap';
      await sequelizeAdmin.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`✓ Database '${dbName}' được tạo hoặc đã tồn tại`);
    } finally {
      // Close the admin connection
      await sequelizeAdmin.close();
    }

    // Now connect to the actual database
    const sequelize = require('./database');
    await sequelize.authenticate();
    console.log('✓ Kết nối database thành công');

    // Sync models - dung alter:true de tu dong cap nhat schema khi co thay doi
    await sequelize.sync({ alter: true });
    console.log('✓ Database da duoc khoi tao thanh cong');

    // Create admin account
    await createAdminAccount();
    
    console.log('✓ Database initialization hoàn tất');
  } catch (error) {
    console.error('✗ Lỗi kết nối database:', error.message);
    throw error;
  }
};

module.exports = initializeDatabase;
