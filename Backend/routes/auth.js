const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Helper function to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
};

// Super Admin Login
router.post('/super-admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const superAdmin = await SuperAdmin.findOne({ where: { email } });

    if (!superAdmin || !(await bcrypt.compare(password, superAdmin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'super_admin'
    });

    res.json({
      message: 'Super admin login successful',
      token,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: 'super_admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin'
    });

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Team Login
router.post('/team/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const team = await Team.findOne({ where: { email } });

    if (!team || !(await bcrypt.compare(password, team.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: team.id,
      email: team.email,
      role: 'team'
    });

    res.json({
      message: 'Team login successful',
      token,
      user: {
        id: team.id,
        teamName: team.teamName,
        managerName: team.managerName,
        email: team.email,
        role: 'team'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Login
router.post('/user/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'managerName']
        }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'user'
    });

    res.json({
      message: 'User login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        team: user.team,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// General Login Endpoint (auto-detects user type)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Try to find user in each table
    let user = null;
    let userType = null;

    // Check SuperAdmin first
    user = await SuperAdmin.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      userType = 'super_admin';
    } else {
      // Check Admin
      user = await Admin.findOne({ where: { email } });
      if (user && await bcrypt.compare(password, user.password)) {
        userType = 'admin';
      } else {
        // Check Team
        user = await Team.findOne({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
          userType = 'team';
        } else {
          // Check User
          user = await User.findOne({
            where: { email },
            include: [
              {
                model: Team,
                as: 'team',
                attributes: ['id', 'teamName', 'managerName']
              }
            ]
          });
          if (user && await bcrypt.compare(password, user.password)) {
            userType = 'user';
          }
        }
      }
    }

    if (!user || !userType) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: userType
    });

    // Prepare user data based on type
    let userData = {};
    if (userType === 'super_admin') {
      userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'super_admin'
      };
    } else if (userType === 'admin') {
      userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin'
      };
    } else if (userType === 'team') {
      userData = {
        id: user.id,
        teamName: user.teamName,
        managerName: user.managerName,
        email: user.email,
        role: 'team'
      };
    } else if (userType === 'user') {
      userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        team: user.team,
        role: 'user'
      };
    }

    res.json({
      message: `${userType.replace('_', ' ')} login successful`,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new super admin (public endpoint)
router.post('/register/super-admin', [
  body('name').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if super admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ where: { email } });
    if (existingSuperAdmin) {
      return res.status(400).json({ error: 'Super admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await SuperAdmin.create({
      name,
      email,
      password: hashedPassword,
      isActive: true
    });

    res.status(201).json({
      message: 'Super admin registered successfully',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email
      }
    });
  } catch (error) {
    console.error('Super admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new admin (public endpoint)
router.post('/register/admin', [
  body('name').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('superAdminId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, superAdminId } = req.body;

    // Check if super admin exists
    const superAdmin = await SuperAdmin.findByPk(superAdminId);
    if (!superAdmin) {
      return res.status(400).json({ error: 'Super admin not found' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      superAdminId,
      name,
      email,
      password: hashedPassword,
      isActive: true
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        superAdminId: admin.superAdminId
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new team (public endpoint)
router.post('/register/team', [
  body('teamName').isLength({ min: 3, max: 100 }),
  body('managerName').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teamName, managerName, email, password } = req.body;

    // Check if team already exists
    const existingTeam = await Team.findOne({ where: { email } });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const team = await Team.create({
      teamName,
      managerName,
      email,
      password: hashedPassword,
      isActive: true
    });

    res.status(201).json({
      message: 'Team registered successfully',
      team: {
        id: team.id,
        teamName: team.teamName,
        managerName: team.managerName,
        email: team.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register new user (public endpoint)
router.post('/register/user', [
  body('username').isLength({ min: 3, max: 50 }),
  body('name').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('teamId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, name, email, password, teamId } = req.body;

    // Check if team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(400).json({ error: 'Team not found' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      teamId,
      username,
      name,
      email,
      password: hashedPassword,
      isActive: true
    });

    // Fetch the created user with team information
    const userWithTeam = await User.findByPk(user.id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'managerName']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userWithTeam.id,
        username: userWithTeam.username,
        name: userWithTeam.name,
        email: userWithTeam.email,
        teamId: userWithTeam.teamId,
        team: userWithTeam.team
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userType = req.userType;
    let user = null;

    if (userType === 'user') {
      user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: require('../models/Team'),
            as: 'team',
            attributes: ['id', 'teamName', 'managerName']
          }
        ]
      });
    } else if (userType === 'admin') {
      user = await Admin.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: require('../models/SuperAdmin'),
            as: 'superAdmin',
            attributes: ['id', 'name', 'email']
          }
        ]
      });
    } else if (userType === 'team') {
      user = await Team.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    } else if (userType === 'super_admin') {
      user = await SuperAdmin.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add role to user object
    const userWithRole = {
      ...user.toJSON(),
      role: userType
    };

    res.json({ user: userWithRole });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

module.exports = router; 