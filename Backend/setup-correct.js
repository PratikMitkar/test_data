const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
require('./models/associations');

const SuperAdmin = require('./models/SuperAdmin');
const Admin = require('./models/Admin');
const Team = require('./models/Team');
const User = require('./models/User');
const Project = require('./models/Project');
const Ticket = require('./models/Ticket');
const Notification = require('./models/Notification');

async function setupDatabase() {
  try {
    console.log('🚀 Starting fresh database setup...');
    
    // Sync all models (this will create tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully');
    
    // Create Super Admin
    const superAdmin = await SuperAdmin.create({
      name: 'Super Admin',
      email: 'superadmin@test.com',
      password: await bcrypt.hash('password123', 10),
      isActive: true
    });
    console.log('✅ Super Admin created:', superAdmin.email);
    
    // Create Admin
    const admin = await Admin.create({
      superAdminId: superAdmin.id,
      name: 'Admin User',
      email: 'admin@test.com',
      password: await bcrypt.hash('password123', 10),
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);
    
    // Create Team
    const team = await Team.create({
      teamName: 'Development Team',
      managerName: 'Team Manager',
      email: 'team@test.com',
      password: await bcrypt.hash('password123', 10),
      superAdminId: superAdmin.id,
      adminId: admin.id,
      isActive: true
    });
    console.log('✅ Team created:', team.email);
    
    // Create User
    const user = await User.create({
      teamId: team.id,
      username: 'testuser',
      name: 'Test User',
      email: 'user@test.com',
      password: await bcrypt.hash('password123', 10),
      isActive: true
    });
    console.log('✅ User created:', user.email);
    
    // Create Project
    const project = await Project.create({
      name: 'Demo Project',
      description: 'A project for testing ticket creation and approval workflow',
      code: 'DEMO1',
      startDate: '2024-07-01',
      endDate: '2025-12-31',
      priority: 'high',
      managerId: user.id
    });
    console.log('✅ Project created:', project.name, '(ID:', project.id, ')');
    
    // Create a test ticket
    const ticket = await Ticket.create({
      title: 'Test Ticket',
      description: 'This is a test ticket for verification',
      createdBy: user.id,
      teamId: team.id,
      projectId: project.id,
      priority: 'MEDIUM',
      status: 'PENDING_APPROVAL',
      type: 'bug',
      category: 'technical',
      department: 'IT',
      dueDate: '2025-12-31'
    });
    console.log('✅ Test ticket created:', ticket.title, '(ID:', ticket.id, ')');
    
    // Create notifications for admins and super admin
    await Notification.create({
      userId: admin.id,
      title: 'New Ticket Created',
      message: `A new ticket "${ticket.title}" has been created and needs your approval`,
      type: 'ticket_created',
      priority: 'medium',
      isRead: false,
      ticketId: ticket.id
    });
    
    await Notification.create({
      userId: superAdmin.id,
      title: 'New Ticket Created',
      message: `A new ticket "${ticket.title}" has been created and needs your approval`,
      type: 'ticket_created',
      priority: 'medium',
      isRead: false,
      ticketId: ticket.id
    });
    
    console.log('✅ Notifications created for admins');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Super Admin: superadmin@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    console.log('Team: team@test.com / password123');
    console.log('User: user@test.com / password123');
    console.log('\n📊 Test Data:');
    console.log(`- Project ID: ${project.id}`);
    console.log(`- Test Ticket ID: ${ticket.id}`);
    console.log(`- Team ID: ${team.id}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await sequelize.close();
  }
}

setupDatabase(); 