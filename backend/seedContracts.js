require('dotenv').config();
const { User, Contract } = require('./src/entities');
const sequelize = require('./src/config/database');

async function seedContracts() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Find all active users
    const users = await User.findAll({ where: { status: 'active' } });

    let createdCount = 0;

    for (const user of users) {
      // Check if user already has an active contract
      const existingContract = await Contract.findOne({
        where: { user_id: user.id, status: 'active' }
      });

      if (!existingContract) {
        // Create new contract
        await Contract.create({
          user_id: user.id,
          contract_number: `HD-CT-${user.id}-${Date.now().toString().slice(-6)}`,
          contract_type: 'chính thức',
          employee_type: 'Full-time',
          start_date: '2026-01-01',
          end_date: '2028-01-01',
          basic_salary: 15000000 + (Math.floor(Math.random() * 10) * 1000000), // Random 15-24M
          status: 'active'
        });
        createdCount++;
        console.log(`Created contract for User ID: ${user.id} (${user.email})`);
      }
    }

    console.log(`\nSuccessfully created ${createdCount} new contracts.`);
  } catch (error) {
    console.error('Error seeding contracts:', error);
  } finally {
    process.exit(0);
  }
}

seedContracts();
