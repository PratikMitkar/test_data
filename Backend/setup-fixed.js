const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Connecting to SQLite database...');
    await sequelize.authenticate();
    console.log('Connected to SQLite database successfully');
    
    // Import models in order to avoid circular dependencies
    const User = require('./models/User');
    const Project = require('./models/Project');
    const Resource = require('./models/Resource');
    
    // Sync all models to create tables
    console.log('Creating database tables...');
    await sequelize.sync({ force: true }); // This will recreate all tables
    console.log('Database tables created successfully');

    // Create default admin user
    const adminExists = await User.findOne({ where: { email: 'admin@company.com' } });
    if (!adminExists) {
      const adminUser = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'admin',
        department: 'IT',
        position: 'System Administrator',
        employeeId: 'ADMIN001',
        isActive: true
      });

      console.log('Default admin user created: admin@company.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create default manager user
    const managerExists = await User.findOne({ where: { email: 'manager@company.com' } });
    if (!managerExists) {
      const managerUser = await User.create({
        firstName: 'Project',
        lastName: 'Manager',
        email: 'manager@company.com',
        password: 'manager123',
        role: 'manager',
        department: 'IT',
        position: 'Project Manager',
        employeeId: 'MGR001',
        isActive: true
      });

      console.log('Default manager user created: manager@company.com / manager123');
    } else {
      console.log('Manager user already exists');
    }

    // Create default employee user
    const employeeExists = await User.findOne({ where: { email: 'employee@company.com' } });
    if (!employeeExists) {
      const employeeUser = await User.create({
        firstName: 'John',
        lastName: 'Employee',
        email: 'employee@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'IT',
        position: 'Software Developer',
        employeeId: 'EMP001',
        isActive: true
      });

      console.log('Default employee user created: employee@company.com / employee123');
    } else {
      console.log('Employee user already exists');
    }

    // Create sample project
    const sampleProjectExists = await Project.findOne({ where: { code: 'SAMPLE' } });
    if (!sampleProjectExists) {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      const sampleProject = await Project.create({
        name: 'Sample Project',
        description: 'This is a sample project for demonstration purposes',
        code: 'SAMPLE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        priority: 'medium',
        managerId: adminUser.id,
        departments: ['IT'],
        tags: ['sample', 'demo']
      });

      console.log('Sample project created');
    } else {
      console.log('Sample project already exists');
    }

    // Create sample resources
    const sampleResources = [
      {
        name: 'Development Server',
        type: 'hardware',
        category: 'infrastructure',
        description: 'High-performance server for development work',
        quantity: 5,
        unit: 'pieces',
        priority: 'high',
        departments: ['IT'],
        tags: ['server', 'development']
      },
      {
        name: 'Software Licenses',
        type: 'software',
        category: 'development',
        description: 'Development software licenses',
        quantity: 20,
        unit: 'licenses',
        priority: 'medium',
        departments: ['IT'],
        tags: ['software', 'licenses']
      },
      {
        name: 'Developer Hours',
        type: 'human',
        category: 'development',
        description: 'Developer time allocation',
        quantity: 160,
        unit: 'hours',
        priority: 'high',
        departments: ['IT'],
        tags: ['human', 'time']
      }
    ];

    for (const resourceData of sampleResources) {
      const resourceExists = await Resource.findOne({ where: { name: resourceData.name } });
      if (!resourceExists) {
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        const resource = await Resource.create({
          ...resourceData,
          createdById: adminUser.id,
          managedById: adminUser.id
        });

        console.log(`Sample resource created: ${resourceData.name}`);
      }
    }

    console.log('Database setup completed successfully!');
    console.log('\nDefault users:');
    console.log('- Admin: admin@company.com / admin123');
    console.log('- Manager: manager@company.com / manager123');
    console.log('- Employee: employee@company.com / employee123');

  } catch (error) {
    console.error('Setup failed:', error);
    console.error('Error details:', error.message);
    if (error.parent) {
      console.error('Parent error:', error.parent.message);
    }
  } finally {
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 