const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const User = require('../models/User');
const Team = require('../models/Team');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const {
  authenticateToken,
  isManagerOrAdmin,
  isAdmin
} = require('../middleware/auth');
const {
  validateUserUpdate,
  validatePagination,
  validateId
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for user avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to check user permissions
const checkUserPermissions = async (user) => {
  try {
    const admin = await Admin.findOne({ where: { email: user.email } });
    const superAdmin = await SuperAdmin.findOne({ where: { email: user.email } });

    if (admin) return { role: 'admin', adminId: admin.id };
    if (superAdmin) return { role: 'super_admin', superAdminId: superAdmin.id };

    return { role: 'user' };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return { role: 'user' };
  }
};

// Get teams for registration (public endpoint)
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      attributes: ['id', 'teamName', 'managerName'],
      order: [['teamName', 'ASC']]
    });

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      error: 'Failed to get teams',
      message: error.message
    });
  }
});

// Get users for dropdowns (authenticated users only - limited data)
router.get('/dropdown', authenticateToken, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);
    
    // For regular users, only return users from their team
    let whereClause = { isActive: true };
    
    if (userPermissions.role === 'user' && req.user.teamId) {
      whereClause.teamId = req.user.teamId;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'teamId'],
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users dropdown error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Get super admins for admin registration (public endpoint)
router.get('/super-admins', async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']]
    });

    res.json(superAdmins);
  } catch (error) {
    console.error('Get super admins error:', error);
    res.status(500).json({
      error: 'Failed to get super admins',
      message: error.message
    });
  }
});

// Get all users of all types (Admin/Manager only)
router.get('/all', authenticateToken, isManagerOrAdmin, async (req, res) => {
  try {
    const { search } = req.query;

    // Build search conditions
    const searchCondition = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Fetch all user types
    const [users, teams, admins, superAdmins] = await Promise.all([
      User.findAll({
        where: searchCondition,
        include: [
          {
            model: Team,
            as: 'team',
            attributes: ['id', 'teamName']
          }
        ],
        attributes: { exclude: ['password'] }
      }),
      Team.findAll({
        where: searchCondition,
        attributes: { exclude: ['password'] }
      }),
      Admin.findAll({
        where: searchCondition,
        include: [
          {
            model: SuperAdmin,
            as: 'superAdmin',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password'] }
      }),
      SuperAdmin.findAll({
        where: searchCondition,
        attributes: { exclude: ['password'] }
      })
    ]);

    // Combine all users with their roles
    const allUsers = [
      ...users.map(user => ({ ...user.toJSON(), role: 'user' })),
      ...teams.map(team => ({
        ...team.toJSON(),
        role: 'team',
        name: team.teamName,
        teamName: team.teamName
      })),
      ...admins.map(admin => ({ ...admin.toJSON(), role: 'admin' })),
      ...superAdmins.map(superAdmin => ({ ...superAdmin.toJSON(), role: 'super_admin' }))
    ];

    res.json({ users: allUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Get team members by team ID (for ticket assignment)
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({
        error: 'Team ID is required'
      });
    }

    const users = await User.findAll({
      where: { 
        teamId: teamId,
        isActive: true 
      },
      attributes: ['id', 'username', 'name', 'email'],
      order: [['name', 'ASC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      error: 'Failed to get team members',
      message: error.message
    });
  }
});

// Get users for ticket creation (all authenticated users)
router.get('/for-tickets', authenticateToken, async (req, res) => {
  try {
    // Only fetch admins and super admins for ticket assignment
    const [admins, superAdmins] = await Promise.all([
      Admin.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'email'],
        order: [['name', 'ASC']]
      }),
      SuperAdmin.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'email'],
        order: [['name', 'ASC']]
      })
    ]);

    // Combine admins and super admins with their roles
    const assignableUsers = [
      ...admins.map(admin => ({ 
        id: admin.id, 
        name: admin.name, 
        email: admin.email, 
        role: 'admin',
        teamId: null
      })),
      ...superAdmins.map(superAdmin => ({ 
        id: superAdmin.id, 
        name: superAdmin.name, 
        email: superAdmin.email, 
        role: 'super_admin',
        teamId: null
      }))
    ];

    res.json({ users: assignableUsers });
  } catch (error) {
    console.error('Get users for tickets error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Get all users (Admin/Manager only)
router.get('/', authenticateToken, isManagerOrAdmin, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      isActive,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }

    if (department) whereClause.department = department;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName']
        }
      ],
      attributes: { exclude: ['password'] },
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);

    // Check if user can access this profile
    if (userPermissions.role === 'user' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'managerName']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

// Update user
router.put('/:id', authenticateToken, validateId, validateUserUpdate, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);

    // Check permissions
    if (userPermissions.role === 'user' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updateData = { ...req.body };

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.params.id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'managerName']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// Upload user avatar
router.post('/:id/avatar', authenticateToken, validateId, upload.single('avatar'), async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);

    // Check permissions
    if (userPermissions.role === 'user' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete old avatar if exists
    if (user.avatar && fs.existsSync(user.avatar)) {
      fs.unlinkSync(user.avatar);
    }

    await user.update({
      avatar: req.file.path
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: req.file.path
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      message: error.message
    });
  }
});

// Get user statistics
router.get('/:id/stats', authenticateToken, validateId, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);

    // Check permissions
    if (userPermissions.role === 'user' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const Ticket = require('../models/Ticket');
    const Project = require('../models/Project');

    // Get user statistics
    const createdTickets = await Ticket.count({ where: { createdBy: user.id } });
    const assignedTickets = await Ticket.count({ where: { assignedTo: user.id } });
    const completedTickets = await Ticket.count({
      where: {
        assignedTo: user.id,
        status: 'COMPLETED'
      }
    });
    const managedProjects = await Project.count({ where: { managerId: user.id } });

    const stats = {
      createdTickets,
      assignedTickets,
      completedTickets,
      managedProjects,
      completionRate: assignedTickets > 0 ? ((completedTickets / assignedTickets) * 100).toFixed(1) : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      message: error.message
    });
  }
});

// Get users by department
router.get('/department/:department', authenticateToken, isManagerOrAdmin, async (req, res) => {
  try {
    const { department } = req.params;

    const users = await User.findAll({
      where: {
        department,
        isActive: true
      },
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName']
        }
      ],
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by department error:', error);
    res.status(500).json({
      error: 'Failed to get users by department',
      message: error.message
    });
  }
});

// Activate/Deactivate user (Admin only)
router.put('/:id/status', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await user.update({ isActive });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

// Delete any user type (Admin only)
router.delete('/:id', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    let userToDelete = null;
    let userType = null;

    // Try to find the user in each table
    userToDelete = await User.findByPk(userId);
    if (userToDelete) {
      userType = 'user';
    } else {
      userToDelete = await Team.findByPk(userId);
      if (userToDelete) {
        userType = 'team';
      } else {
        userToDelete = await Admin.findByPk(userId);
        if (userToDelete) {
          userType = 'admin';
        } else {
          userToDelete = await SuperAdmin.findByPk(userId);
          if (userToDelete) {
            userType = 'super_admin';
          }
        }
      }
    }

    if (!userToDelete) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Prevent super admin from deleting themselves
    if (userType === 'super_admin' && req.user.id === parseInt(userId)) {
      return res.status(400).json({
        error: 'Cannot delete yourself'
      });
    }

    // Check if user has active tickets or projects
    const Ticket = require('../models/Ticket');
    const Project = require('../models/Project');

    let activeTickets = 0;
    let activeProjects = 0;

    if (userType === 'user') {
      activeTickets = await Ticket.count({
        where: {
          [Op.or]: [
            { createdBy: userId },
            { assignedTo: userId }
          ],
          status: {
            [Op.in]: ['PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS']
          }
        }
      });

      activeProjects = await Project.count({
        where: {
          managerId: userId,
          status: 'active'
        }
      });
    } else if (userType === 'team') {
      // Check if team has active members or tickets
      const teamMembers = await User.count({ where: { teamId: userId } });
      if (teamMembers > 0) {
        return res.status(400).json({
          error: 'Cannot delete team with active members',
          details: { teamMembers }
        });
      }
    } else if (userType === 'admin') {
      // Check if admin has managed any active resources
      activeTickets = await Ticket.count({
        where: {
          assignedTo: userId,
          status: {
            [Op.in]: ['PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS']
          }
        }
      });
    }

    if (activeTickets > 0 || activeProjects > 0) {
      return res.status(400).json({
        error: `Cannot delete ${userType} with active tickets or projects`,
        details: {
          activeTickets,
          activeProjects
        }
      });
    }

    // Delete avatar file if exists (for users)
    if (userType === 'user' && userToDelete.avatar && fs.existsSync(userToDelete.avatar)) {
      fs.unlinkSync(userToDelete.avatar);
    }

    await userToDelete.destroy();

    res.json({
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

module.exports = router;