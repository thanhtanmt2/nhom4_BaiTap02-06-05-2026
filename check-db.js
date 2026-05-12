const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkDatabase() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'nhom4_baitap',
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
    await sequelize.authenticate();
    console.log('✓ Kết nối database thành công\n');

    // Get all tables
    const tables = await sequelize.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA='${process.env.DB_NAME || 'nhom4_baitap'}'
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('📊 Các bảng trong database:');
    tables.forEach(t => console.log('  -', t.TABLE_NAME));
    console.log('');

    // Get Users columns info
    const usersColumns = await sequelize.query('DESC Users', 
      { type: Sequelize.QueryTypes.SELECT });
    console.log('📋 Cấu trúc bảng Users:');
    console.table(usersColumns);
    console.log('');

    // Get Users data (tất cả cột)
    const users = await sequelize.query('SELECT * FROM Users LIMIT 10', 
      { type: Sequelize.QueryTypes.SELECT });
    console.log(`👤 Users (${users.length} record):`);
    console.table(users);
    console.log('');

    // Get Profiles data
    const profiles = await sequelize.query('SELECT * FROM Profiles', 
      { type: Sequelize.QueryTypes.SELECT });
    console.log(`📋 Profiles (${profiles.length} record):`);
    console.table(profiles);
    console.log('');

    // Get OTPs data
    const otps = await sequelize.query('SELECT id, email, status, createdAt FROM OTPs', 
      { type: Sequelize.QueryTypes.SELECT });
    console.log(`🔐 OTPs (${otps.length} record):`);
    console.table(otps);

    await sequelize.close();
  } catch (error) {
    console.error('✗ Lỗi:', error.message);
    process.exit(1);
  }
}

checkDatabase();
