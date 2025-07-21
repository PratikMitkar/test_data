const sequelize = require('./config/database');

async function updateSchema() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    console.log('Updating database schema...');
    
    // Check if team_id column exists in projects table
    const [columns] = await sequelize.query(`PRAGMA table_info(projects)`);
    const teamIdExists = columns.some(column => column.name === 'team_id');
    
    // Add teamId column to projects table if it doesn't exist
    if (!teamIdExists) {
      await sequelize.query(`
        ALTER TABLE projects 
        ADD COLUMN team_id INTEGER REFERENCES teams(id)
      `);
      console.log('Added team_id column to projects table');
    } else {
      console.log('team_id column already exists in projects table');
    }
    
    console.log('Schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();