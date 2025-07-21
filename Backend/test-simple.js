const sequelize = require('./config/database');

async function testSimple() {
  try {
    console.log('Testing simple database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Define a simple User model inline to avoid import issues
    const { DataTypes } = require('sequelize');
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('employee', 'manager', 'admin'),
        defaultValue: 'employee'
      }
    }, {
      tableName: 'users'
    });
    
    console.log('Testing table creation...');
    await sequelize.sync({ force: true });
    console.log('Tables created successfully');
    
    console.log('Testing user creation...');
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'employee'
    });
    console.log('User created successfully:', user.id);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testSimple(); 