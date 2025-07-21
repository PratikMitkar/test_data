const sequelize = require('./config/database');
const Project = require('./models/Project');

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Force sync only the Project model
    await Project.sync({ alter: true });
    
    console.log('Schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();