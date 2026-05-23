const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const testUserEmail = process.env.TEST_USER_EMAIL || 'user@example.com';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'User@123456';

  try {
    // Luôn đảm bảo tài khoản admin tồn tại và đúng mật khẩu
    const adminExists = await User.findOne({ where: { email: adminEmail } });
    if (adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await adminExists.update({ password: hashedPassword, role: 'admin', status: 'active' });
      console.log(`✓ Cập nhật tài khoản admin: ${adminEmail}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({ email: adminEmail, password: hashedPassword, role: 'admin', status: 'active' });
      console.log(`✓ Tài khoản admin đã được tạo: ${adminEmail}`);
    }

    // Luôn đảm bảo tài khoản user test tồn tại và đúng mật khẩu
    const testUserExists = await User.findOne({ where: { email: testUserEmail } });
    if (testUserExists) {
      const hashedTestPw = await bcrypt.hash(testUserPassword, 10);
      await testUserExists.update({ password: hashedTestPw, role: 'employee', status: 'active' });
      console.log(`✓ Cập nhật tài khoản employee test: ${testUserEmail}`);
    } else {
      const hashedTestPw = await bcrypt.hash(testUserPassword, 10);
      await User.create({ email: testUserEmail, password: hashedTestPw, role: 'employee', status: 'active' });
      console.log(`✓ Tài khoản employee test đã được tạo: ${testUserEmail}`);
    }
  } catch (error) {
    console.error('✗ Lỗi khi tạo admin:', error.message);
  }
}

module.exports = createAdminAccount;
