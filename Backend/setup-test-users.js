const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
require('./models/associations');

const SuperAdmin = require('./models/SuperAdmin');
const Admin = require('./models/Admin');
const Team = require('./models/Team');
const User = require('./models/User');

async function setupTestUsers() {
  try {
    console.log('Setting up test users...');
    
    // Sync database
    await sequelize.sync({ force: false });
    console.log('Database synced');
    
    // Create Super Admin
    const superAdminExists = await SuperAdmin.findOne({ where: { email: 'superadmin@test.com' } });
    if (!superAdminExists) {
      const superAdmin = await SuperAdmin.create({
        name: 'Super Admin',
        email: 'superadmin@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: true
      });
      console.log('Super Admin created:', superAdmin.email);
    } else {
      console.log('Super Admin already exists');
    }
    
    // Create Admin
    const adminExists = await Admin.findOne({ where: { email: 'admin@test.com' } });
    if (!adminExists) {
      const admin = await Admin.create({
        superAdminId: 1, // Assuming super admin ID is 1
        name: 'Admin User',
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: true
      });
      console.log('Admin created:', admin.email);
    } else {
      console.log('Admin already exists');
    }
    
    // Create Team
    const teamExists = await Team.findOne({ where: { email: 'team@test.com' } });
    if (!teamExists) {
      const team = await Team.create({
        teamName: 'Test Team',
        managerName: 'Team Manager',
        email: 'team@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: true
      });
      console.log('Team created:', team.email);
    } else {
      console.log('Team already exists');
    }
    
    // Create User
    const userExists = await User.findOne({ where: { email: 'user@test.com' } });
    if (!userExists) {
      const user = await User.create({
        teamId: 1, // Assuming team ID is 1
        username: 'testuser',
        name: 'Test User',
        email: 'user@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: true
      });
      console.log('User created:', user.email);
    } else {
      console.log('User already exists');
    }
    
    console.log('\nTest users setup complete!');
    console.log('Login credentials:');
    console.log('Super Admin: superadmin@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    console.log('Team: team@test.com / password123');
    console.log('User: user@test.com / password123');
    
  } catch (error) {
    console.error('Error setting up test users:', error);
  } finally {
    await sequelize.close();
  }
}

setupTestUsers(); 