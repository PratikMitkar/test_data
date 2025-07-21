const sequelize = require('./config/database');
require('./models/associations'); // Import associations

const SuperAdmin = require('./models/SuperAdmin');
const Admin = require('./models/Admin');
const Team = require('./models/Team');
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Notification = require('./models/Notification');
const Project = require('./models/Project');
const Resource = require('./models/Resource');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database tables created successfully');

    // Create Super Admin
    const superAdmin = await SuperAdmin.create({
      name: 'Super Administrator',
      email: 'superadmin@example.com',
      password: await bcrypt.hash('superadmin123', 10),
      isActive: true
    });

    // Create Admin
    const admin = await Admin.create({
      superAdminId: superAdmin.id,
      name: 'Administrator',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      isActive: true
    });

    // Create Teams
    const team1 = await Team.create({
      teamName: 'Development Team',
      managerName: 'John Manager',
      email: 'dev-team@example.com',
      password: await bcrypt.hash('team123', 10),
      isActive: true
    });

    const team2 = await Team.create({
      teamName: 'Support Team',
      managerName: 'Jane Manager',
      email: 'support-team@example.com',
      password: await bcrypt.hash('team123', 10),
      isActive: true
    });

    // Create regular users
    const user1 = await User.create({
      teamId: team1.id,
      username: 'developer1',
      name: 'John Developer',
      email: 'john@example.com',
      password: await bcrypt.hash('user123', 10),
      isActive: true
    });

    const user2 = await User.create({
      teamId: team1.id,
      username: 'developer2',
      name: 'Jane Developer',
      email: 'jane@example.com',
      password: await bcrypt.hash('user123', 10),
      isActive: true
    });

    const user3 = await User.create({
      teamId: team2.id,
      username: 'support1',
      name: 'Mike Support',
      email: 'mike@example.com',
      password: await bcrypt.hash('user123', 10),
      isActive: true
    });

    // Create sample projects
    const project1 = await Project.create({
      name: 'Web Application Development',
      description: 'Developing a modern web application with React and Node.js',
      code: 'WEB-APP-001',
      status: 'active',
      priority: 'high',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      budget: 50000.00,
      progress: 25,
      departments: ['IT', 'Engineering'],
      tags: ['web', 'react', 'nodejs'],
      client: {
        name: 'Tech Corp',
        email: 'contact@techcorp.com',
        phone: '+1234567890'
      },
      managerId: user1.id
    });

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Creating a mobile application for iOS and Android platforms',
      code: 'MOBILE-APP-001',
      status: 'active',
      priority: 'medium',
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      budget: 75000.00,
      progress: 10,
      departments: ['IT', 'Design'],
      tags: ['mobile', 'ios', 'android'],
      client: {
        name: 'Mobile Solutions',
        email: 'info@mobilesolutions.com',
        phone: '+1987654321'
      },
      managerId: user2.id
    });

    // Create sample tickets
    const ticket1 = await Ticket.create({
      title: 'Fix Login Bug',
      description: 'Users are unable to login with their credentials. Need to investigate and fix the authentication issue.',
      type: 'bug',
      category: 'technical',
      department: 'IT',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: user1.id,
      teamId: team1.id,
      projectId: project1.id,
      assignedTo: user2.id,
      priority: 'HIGH',
      status: 'PENDING_APPROVAL',
      expectedClosure: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: 8.0,
      project: 'Web Application'
    });

    const ticket2 = await Ticket.create({
      title: 'Update Documentation',
      description: 'Update API documentation to reflect the latest changes in the authentication system.',
      type: 'task',
      category: 'business',
      department: 'IT',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      createdBy: user2.id,
      teamId: team1.id,
      projectId: project1.id,
      assignedTo: user1.id,
      priority: 'MEDIUM',
      status: 'APPROVED',
      approvedBy: user1.id,
      approvedAt: new Date(),
      expectedClosure: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      estimatedHours: 4.0,
      project: 'Documentation'
    });

    const ticket3 = await Ticket.create({
      title: 'Customer Support Request',
      description: 'Customer reported an issue with the payment system. Need to investigate and provide a solution.',
      type: 'support',
      category: 'business',
      department: 'Operations',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      createdBy: user3.id,
      teamId: team2.id,
      projectId: project2.id,
      assignedTo: user3.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      approvedBy: user1.id,
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Approved 2 days ago
      expectedClosure: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 12.0,
      project: 'Customer Support'
    });

    const ticket4 = await Ticket.create({
      title: 'Database Optimization',
      description: 'Optimize database queries to improve application performance.',
      type: 'improvement',
      category: 'performance',
      department: 'Engineering',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      createdBy: user1.id,
      teamId: team1.id,
      projectId: project1.id,
      assignedTo: user1.id,
      priority: 'LOW',
      status: 'REJECTED',
      approvedBy: user1.id,
      approvedAt: new Date(),
      rejectionReason: 'This task is not a priority at the moment. Focus on critical bugs first.',
      expectedClosure: null,
      estimatedHours: 16.0,
      project: 'Performance'
    });

    // Create sample resources
    const resource1 = await Resource.create({
      name: 'Development Server',
      type: 'hardware',
      category: 'development',
      description: 'High-performance server for development and testing',
      quantity: 5,
      unit: 'pieces',
      availableQuantity: 3,
      allocatedQuantity: 2,
      cost: {
        amount: 5000,
        currency: 'USD',
        perUnit: true
      },
      status: 'available',
      priority: 'high',
      location: {
        building: 'Main Office',
        floor: '2nd Floor',
        room: 'Server Room 201'
      },
      specifications: {
        cpu: 'Intel Xeon E5-2680',
        ram: '64GB DDR4',
        storage: '2TB SSD',
        network: '10Gbps'
      },
      supplier: {
        name: 'Tech Supplies Inc',
        contact: 'sales@techsupplies.com',
        phone: '+1234567890'
      },
      tags: ['server', 'development', 'high-performance'],
      departments: ['IT', 'Engineering'],
      createdBy: user1.id,
      managedBy: user1.id
    });

    const resource2 = await Resource.create({
      name: 'Software Licenses',
      type: 'software',
      category: 'development',
      description: 'Development tools and software licenses',
      quantity: 20,
      unit: 'licenses',
      availableQuantity: 15,
      allocatedQuantity: 5,
      cost: {
        amount: 500,
        currency: 'USD',
        perUnit: true
      },
      status: 'available',
      priority: 'medium',
      specifications: {
        type: 'Development Tools',
        includes: ['IDE', 'Version Control', 'Testing Tools']
      },
      supplier: {
        name: 'Software Corp',
        contact: 'licenses@softwarecorp.com',
        phone: '+1987654321'
      },
      tags: ['software', 'licenses', 'development'],
      departments: ['IT'],
      createdBy: user1.id,
      managedBy: user2.id
    });

    // Create sample notifications
    await Notification.create({
      userId: user1.id,
      ticketId: ticket1.id,
      title: 'New Ticket Created',
      message: 'Your ticket "Fix Login Bug" has been created and is pending approval.',
      type: 'TICKET_CREATED',
      priority: 'medium',
      isRead: false
    });

    await Notification.create({
      userId: user2.id,
      ticketId: ticket2.id,
      title: 'Ticket Assigned',
      message: 'You have been assigned to ticket "Update Documentation".',
      type: 'TICKET_ASSIGNED',
      priority: 'medium',
      isRead: false
    });

    await Notification.create({
      userId: user3.id,
      ticketId: ticket3.id,
      title: 'Ticket Approved',
      message: 'Your ticket "Customer Support Request" has been approved.',
      type: 'TICKET_APPROVED',
      priority: 'high',
      isRead: true
    });

    console.log('Database setup completed successfully!');
    console.log('\nDefault accounts created:');
    console.log('Super Admin - Email: superadmin@example.com, Password: superadmin123');
    console.log('Admin - Email: admin@example.com, Password: admin123');
    console.log('Team 1 - Email: dev-team@example.com, Password: team123');
    console.log('Team 2 - Email: support-team@example.com, Password: team123');
    console.log('User 1 - Email: john@example.com, Password: user123');
    console.log('User 2 - Email: jane@example.com, Password: user123');
    console.log('User 3 - Email: mike@example.com, Password: user123');
    console.log('\nSample projects, tickets, resources, and notifications created for testing.');

  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 