const sequelize = require('./config/database');
const Ticket = require('./models/Ticket');

async function updateSchema() {
  try {
    console.log('🔄 Starting database schema update...');

    // First, add the new column as nullable
    await sequelize.query(`
      ALTER TABLE tickets ADD COLUMN assigned_team_id INTEGER REFERENCES teams(id);
    `);

    // Update existing records to set assigned_team_id = team_id
    await sequelize.query(`
      UPDATE tickets SET assigned_team_id = team_id WHERE assigned_team_id IS NULL;
    `);

    // Make the column NOT NULL
    await sequelize.query(`
      CREATE TABLE tickets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        assigned_team_id INTEGER NOT NULL REFERENCES teams(id),
        due_date DATETIME NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        team_id INTEGER NOT NULL REFERENCES teams(id),
        project_id INTEGER REFERENCES projects(id),
        assigned_to INTEGER REFERENCES users(id),
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        status VARCHAR(20) DEFAULT 'PENDING_APPROVAL',
        approved_by INTEGER REFERENCES users(id),
        approved_at DATETIME,
        rejection_reason TEXT,
        expected_closure DATETIME,
        actual_closure DATETIME,
        estimated_hours FLOAT,
        actual_hours FLOAT,
        project VARCHAR(100),
        attachments TEXT DEFAULT '[]',
        comments TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Copy data to new table
    await sequelize.query(`
      INSERT INTO tickets_new 
      SELECT id, title, description, type, category, assigned_team_id, due_date, 
             created_by, team_id, project_id, assigned_to, priority, status, 
             approved_by, approved_at, rejection_reason, expected_closure, 
             actual_closure, estimated_hours, actual_hours, project, attachments, 
             comments, tags, created_at, updated_at 
      FROM tickets;
    `);

    // Drop old table and rename new table
    await sequelize.query(`DROP TABLE tickets;`);
    await sequelize.query(`ALTER TABLE tickets_new RENAME TO tickets;`);

    // Recreate indexes
    await sequelize.query(`CREATE INDEX tickets_team_id ON tickets(team_id);`);
    await sequelize.query(`CREATE INDEX tickets_assigned_team_id ON tickets(assigned_team_id);`);
    await sequelize.query(`CREATE INDEX tickets_created_by ON tickets(created_by);`);
    await sequelize.query(`CREATE INDEX tickets_assigned_to ON tickets(assigned_to);`);
    await sequelize.query(`CREATE INDEX tickets_status ON tickets(status);`);
    await sequelize.query(`CREATE INDEX tickets_priority ON tickets(priority);`);
    
    console.log('✅ Database schema updated successfully!');
    console.log('📋 Changes made:');
    console.log('   - Removed "department" field from tickets table');
    console.log('   - Added "assignedTeamId" field to tickets table');
    console.log('   - Updated associations for cross-team ticket assignment');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

updateSchema(); 