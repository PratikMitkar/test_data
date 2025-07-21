const sequelize = require('./config/database');
const User = require('./models/User');

async function testSetup() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    console.log('Testing table creation...');
    await sequelize.sync({ force: true });
    console.log('Tables created successfully');
    
    console.log('Testing user creation...');
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'employee',
      department: 'IT',
      position: 'Developer',
      employeeId: 'TEST001',
      isActive: true
    });
    console.log('User created successfully:', user.id);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testSetup(); 