const express = require('express');
const router = express.Router();

// Test route to verify API is working
router.get('/', (req, res) => {
  res.json({
    message: 'Ticketing System API is running!',
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Test database connection
router.get('/db', async (req, res) => {
  try {
    const sequelize = require('../config/database');
    await sequelize.authenticate();
    res.json({
      message: 'Database connection successful',
      database: 'SQLite'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

module.exports = router; 