const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const NotificationService = require('../services/notificationService');
const {
  authenticateToken,
  isManagerOrAdmin,
  isAdmin
} = require('../middleware/auth');
const {
  validateTicketCreation,
  validateTicketUpdate,
  validatePagination,
  validateId
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for ticket attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tickets';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, document, and archive files are allowed'));
    }
  }
});

// Helper function to check user permissions
const checkUserPermissions = async (user) => {
  try {
    // Check if user is an admin by email
    const admin = await Admin.findOne({ where: { email: user.email } });
    const superAdmin = await SuperAdmin.findOne({ where: { email: user.email } });
    const team = await Team.findOne({ where: { email: user.email } });

    if (admin) return { role: 'admin', adminId: admin.id };
    if (superAdmin) return { role: 'super_admin', superAdminId: superAdmin.id };
    if (team) return { role: 'team', teamId: team.id };

    return { role: 'user' };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return { role: 'user' };
  }
};

// Create new ticket
router.post('/', authenticateToken, validateTicketCreation, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      teamId,
      assignedTeamId,
      assignedTo,
      priority,
      projectId,
      expectedClosure,
      type,
      category,
      dueDate
    } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      console.error('User not authenticated:', req.user);
      return res.status(401).json({
        error: 'Authentication required. User not found.'
      });
    }

    // If user exists but ID is missing, try to use the ID from the token
    if (!req.user.id && req.user.email) {
      // Try to find the user by email
      const userByEmail = await User.findOne({ where: { email: req.user.email } });
      if (userByEmail) {
        req.user.id = userByEmail.id;
      } else {
        // Try other user types
        const adminByEmail = await Admin.findOne({ where: { email: req.user.email } });
        if (adminByEmail) {
          req.user.id = adminByEmail.id;
        } else {
          const teamByEmail = await Team.findOne({ where: { email: req.user.email } });
          if (teamByEmail) {
            req.user.id = teamByEmail.id;
          } else {
            const superAdminByEmail = await SuperAdmin.findOne({ where: { email: req.user.email } });
            if (superAdminByEmail) {
              req.user.id = superAdminByEmail.id;
            }
          }
        }
      }
    }

    if (!req.user.id) {
      console.error('User ID not found:', req.user);
      return res.status(401).json({
        error: 'Authentication required. User ID not found.'
      });
    }

    // Log user information for debugging
    console.log('Creating ticket with user:', {
      userId: req.user.id,
      userType: req.userType,
      userEmail: req.user.email
    });

    // Check user permissions
    const userPermissions = await checkUserPermissions(req.user);

    // Create ticket with explicit user ID
    const ticketData = {
      title,
      description,
      teamId,
      assignedTeamId: assignedTeamId || teamId, // Use assigned team or default to creator team
      createdBy: req.user.id, // This should be set by now
      assignedTo: assignedTo || null,
      priority: priority || 'MEDIUM',
      projectId: projectId || null,
      status: 'PENDING_APPROVAL',
      expectedClosure: expectedClosure || null,
      type,
      category,
      dueDate
    };

    console.log('Final ticket data being saved:', ticketData);

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      ticketData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));
    }

    const ticket = await Ticket.create(ticketData);

    // Use the notification service to create notifications
    const NotificationService = require('../services/notificationService');

    await NotificationService.createTicketNotification({
      ticketId: ticket.id,
      ticketTitle: title,
      type: 'TICKET_CREATED',
      message: `A new ticket "${title}" has been created and needs your approval`,
      // Send to admins and super admins for approval
      sendToAdmins: true,
      sendToSuperAdmins: true,
      // If created by a user, notify their team manager
      sendToTeamManager: userPermissions.role === 'user',
      // If assigned to a different team, notify that team's manager
      sendToAssignedTeamManager: assignedTeamId && assignedTeamId !== teamId,
      teamId: teamId,
      assignedTeamId: assignedTeamId,
      creatorId: req.user.id,
      priority: priority || 'medium'
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      error: 'Failed to create ticket',
      message: error.message
    });
  }
});

// Get tickets that need approval from current user (Admin, Super Admin, or Team Manager)
router.get('/approval-tasks', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'PENDING_APPROVAL',
      priority,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Check user permissions
    const userPermissions = await checkUserPermissions(req.user);

    // Build where clause for tickets that need approval
    let whereClause = {};

    if (userPermissions.role === 'super_admin') {
      // Super admin can see all tickets that need approval
      whereClause.status = status;
    } else if (userPermissions.role === 'admin') {
      // Admin can see all tickets that need approval
      whereClause.status = status;
    } else if (userPermissions.role === 'team') {
      // Team manager can see tickets assigned to their team
      const team = await Team.findOne({ where: { email: req.user.email } });
      if (team) {
        // Show tickets assigned to the team based on status
        if (status === 'PENDING_APPROVAL') {
          // Show tickets needing manager approval
          whereClause = {
            assignedTeamId: team.id,
            status: 'PENDING_APPROVAL'
          };
        } else if (status === 'APPROVED') {
          // Show approved tickets that are not yet assigned to a team member
          whereClause = {
            assignedTeamId: team.id,
            status: 'APPROVED',
            assignedTo: null
          };
        } else if (status === 'IN_PROGRESS') {
          // Show tickets that are assigned to team members and in progress
          whereClause = {
            assignedTeamId: team.id,
            status: 'IN_PROGRESS'
          };
        } else if (status === 'COMPLETED') {
          // Show completed tickets from the team
          whereClause = {
            assignedTeamId: team.id,
            status: 'COMPLETED'
          };
        } else if (status === 'REJECTED') {
          // Show rejected tickets
          whereClause = {
            assignedTeamId: team.id,
            status: 'REJECTED'
          };
        } else {
          // Show all tickets assigned to the team
          whereClause = {
            assignedTeamId: team.id
          };
        }
      } else {
        // If team not found, return empty results
        whereClause = { id: -1 };
      }
    } else {
      // Regular users cannot access approval tasks
      return res.status(403).json({
        error: 'Access denied. Only administrators and team managers can access approval tasks.'
      });
    }

    if (priority) whereClause.priority = priority;

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { project: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'creatorTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Team,
          as: 'assignedTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get approval tasks error:', error);
    res.status(500).json({
      error: 'Failed to get approval tasks',
      message: error.message
    });
  }
});

// Assign ticket to team member (Team Manager only)
router.put('/:id/assign-member', authenticateToken, validateId, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        error: 'assignedTo is required'
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check if user is team manager for the assigned team
    const userPermissions = await checkUserPermissions(req.user);

    if (userPermissions.role === 'team') {
      const team = await Team.findOne({ where: { email: req.user.email } });
      if (!team || ticket.assignedTeamId !== team.id) {
        return res.status(403).json({
          error: 'Access denied. You can only assign tickets assigned to your team.'
        });
      }
    } else if (userPermissions.role !== 'admin' && userPermissions.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied. Only team managers, admins, and super admins can assign tickets to team members.'
      });
    }

    // Handle assignment logic based on user role
    if (userPermissions.role === 'team') {
      const team = await Team.findOne({ where: { email: req.user.email } });
      
      // Check if assigning to team manager themselves (using team ID)
      if (parseInt(assignedTo) === team.id) {
        // Team manager is assigning to themselves
        // This is allowed - we'll use the team ID as the assignedTo value
        console.log('Team manager assigning ticket to themselves');
      } else {
        // Assigning to a regular team member
        const assignedUser = await User.findByPk(assignedTo);
        
        if (!assignedUser) {
          return res.status(404).json({
            error: 'Assigned user not found'
          });
        }

        if (assignedUser.teamId !== ticket.assignedTeamId) {
          return res.status(400).json({
            error: 'User must belong to the assigned team'
          });
        }
      }
    } else if (userPermissions.role === 'admin' || userPermissions.role === 'super_admin') {
      // Admins and super admins can assign to anyone in the assigned team
      const assignedUser = await User.findByPk(assignedTo);
      
      if (!assignedUser) {
        return res.status(404).json({
          error: 'Assigned user not found'
        });
      }

      if (assignedUser.teamId !== ticket.assignedTeamId) {
        return res.status(400).json({
          error: 'User must belong to the assigned team'
        });
      }
    }

    // Update ticket with assigned user
    await ticket.update({
      assignedTo: assignedTo,
      assignedBy: req.user.id,
      assignedAt: new Date()
    });

    // Use the notification service to create notifications
    const NotificationService = require('../services/notificationService');

    // Determine the appropriate message based on who is being assigned
    let notificationMessage;
    if (userPermissions.role === 'team') {
      const team = await Team.findOne({ where: { email: req.user.email } });
      if (parseInt(assignedTo) === team.id) {
        notificationMessage = `You have assigned ticket "${ticket.title}" to yourself`;
      } else {
        notificationMessage = `You have been assigned ticket "${ticket.title}" by your team manager`;
      }
    } else {
      notificationMessage = `You have been assigned ticket "${ticket.title}" by an administrator`;
    }

    await NotificationService.createTicketNotification({
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      type: 'TICKET_ASSIGNED',
      message: notificationMessage,
      recipientId: assignedTo, // Send directly to the assigned user
      priority: 'medium'
    });

    const updatedTicket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'creatorTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Team,
          as: 'assignedTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json({
      message: 'Ticket assigned to team member successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Assign ticket to member error:', error);
    res.status(500).json({
      error: 'Failed to assign ticket to team member',
      message: error.message
    });
  }
});

// Get tickets assigned to current user by other teams
router.get('/assigned', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Check user permissions to determine how to filter tickets
    const userPermissions = await checkUserPermissions(req.user);
    
    // Build where clause for tickets assigned to current user
    let whereClause;
    
    if (userPermissions.role === 'team') {
      // For team managers, only show tickets specifically assigned to them as individuals
      // This ensures they only see tickets that were explicitly assigned to them
      const team = await Team.findOne({ where: { email: req.user.email } });
      
      // Find the user record for the team manager (if it exists)
      const teamManagerUser = await User.findOne({ where: { email: req.user.email } });
      
      if (teamManagerUser) {
        // If team manager has a user record, show tickets assigned to their user ID
        whereClause = {
          assignedTo: teamManagerUser.id,
          // Exclude tickets created by the current user (only show tickets assigned by others)
          createdBy: { [Op.ne]: req.user.id }
        };
      } else {
        // If team manager doesn't have a user record, show tickets assigned to their team ID
        // but only when explicitly assigned to the team manager (not the whole team)
        whereClause = {
          assignedTo: team ? team.id : null,
          // Exclude tickets created by the current user (only show tickets assigned by others)
          createdBy: { [Op.ne]: req.user.id }
        };
      }
    } else {
      // For regular users, show tickets assigned to their user ID only
      whereClause = {
        assignedTo: req.user.id,
        // Exclude tickets created by the current user (only show tickets assigned by others)
        createdBy: { [Op.ne]: req.user.id }
      };
    }

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { project: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'creatorTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Team,
          as: 'assignedTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get assigned tickets error:', error);
    res.status(500).json({
      error: 'Failed to get assigned tickets',
      message: error.message
    });
  }
});

// Get all tickets with filtering and pagination
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      team,
      assignedTo,
      createdBy,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Check user permissions
    const userPermissions = await checkUserPermissions(req.user);

    // Build where clause
    const whereClause = {};

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (team) whereClause.teamId = team;
    if (assignedTo) whereClause.assignedTo = assignedTo;
    if (createdBy) whereClause.createdBy = createdBy;

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { project: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role-based filtering - Show only tickets created by current user
    if (userPermissions.role === 'user') {
      // Regular users can only see tickets they created
      whereClause.createdBy = req.user.id;
    } else if (userPermissions.role === 'team') {
      // Team managers can see tickets created by their team members
      const user = await User.findOne({ where: { email: req.user.email } });
      if (user && user.teamId) {
        whereClause.teamId = user.teamId;
      } else {
        // If team manager's email is found directly in Team model
        const team = await Team.findOne({ where: { email: req.user.email } });
        if (team) {
          whereClause.teamId = team.id;
        }
      }
    } else if (userPermissions.role === 'admin') {
      // Admin can see tickets from teams they manage
      const managedTeam = await Team.findOne({ where: { adminId: userPermissions.adminId } });
      if (managedTeam) {
        whereClause.teamId = managedTeam.id;
      }
    }
    // Super admins can see all tickets (no filter)

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'creatorTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Team,
          as: 'assignedTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      error: 'Failed to get tickets',
      message: error.message
    });
  }
});

// Get ticket statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check user permissions
    const userPermissions = await checkUserPermissions(req.user);

    // Build where clause based on user role
    const whereClause = {};

    if (userPermissions.role === 'user') {
      whereClause[Op.or] = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id },
        { teamId: req.user.teamId }
      ];
    } else if (userPermissions.role === 'admin') {
      const managedTeam = await Team.findOne({ where: { adminId: userPermissions.adminId } });
      if (managedTeam) {
        whereClause.teamId = managedTeam.id;
      }
    }

    // Get counts by status
    const totalTickets = await Ticket.count({ where: whereClause });
    const pendingTickets = await Ticket.count({ where: { ...whereClause, status: 'PENDING_APPROVAL' } });
    const approvedTickets = await Ticket.count({ where: { ...whereClause, status: 'APPROVED' } });
    const inProgressTickets = await Ticket.count({ where: { ...whereClause, status: 'IN_PROGRESS' } });
    const completedTickets = await Ticket.count({ where: { ...whereClause, status: 'COMPLETED' } });
    const rejectedTickets = await Ticket.count({ where: { ...whereClause, status: 'REJECTED' } });

    // Get counts by priority
    const highPriorityTickets = await Ticket.count({ where: { ...whereClause, priority: 'HIGH' } });
    const mediumPriorityTickets = await Ticket.count({ where: { ...whereClause, priority: 'MEDIUM' } });
    const lowPriorityTickets = await Ticket.count({ where: { ...whereClause, priority: 'LOW' } });

    res.json({
      totalTickets: totalTickets,
      pendingTickets: pendingTickets,
      approvedTickets: approvedTickets,
      inProgressTickets: inProgressTickets,
      completedTickets: completedTickets,
      rejectedTickets: rejectedTickets,
      highPriorityTickets: highPriorityTickets,
      mediumPriorityTickets: mediumPriorityTickets,
      lowPriorityTickets: lowPriorityTickets,
      myTickets: userPermissions.role === 'user' ?
        await Ticket.count({
          where: {
            [Op.or]: [
              { createdBy: req.user.id },
              { assignedTo: req.user.id }
            ]
          }
        }) : totalTickets
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      error: 'Failed to get ticket statistics',
      message: error.message
    });
  }
});

// Get ticket by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'creatorTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Team,
          as: 'assignedTeam',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check access permissions
    const userPermissions = await checkUserPermissions(req.user);

    if (userPermissions.role === 'user') {
      const canAccess = ticket.createdBy === req.user.id ||
        ticket.assignedTo === req.user.id ||
        ticket.teamId === req.user.teamId;

      if (!canAccess) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    } else if (userPermissions.role === 'admin') {
      const managedTeam = await Team.findOne({ where: { adminId: userPermissions.adminId } });
      if (managedTeam && ticket.teamId !== managedTeam.id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      error: 'Failed to get ticket',
      message: error.message
    });
  }
});

// Update ticket status
router.patch('/:id/status', authenticateToken, validateId, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check permissions - assigned user can update status
    if (ticket.assignedTo !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. Only assigned user can update ticket status.'
      });
    }

    // Validate status transition
    const validTransitions = {
      'APPROVED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['COMPLETED', 'ON_HOLD'],
      'ON_HOLD': ['IN_PROGRESS']
    };

    if (validTransitions[ticket.status] && !validTransitions[ticket.status].includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${ticket.status} to ${status}`
      });
    }

    await ticket.update({ status });

    // Use the notification service to create notifications
    const NotificationService = require('../services/notificationService');

    // Determine notification type based on status
    let notificationType = 'TICKET_CREATED'; // Default
    if (status === 'IN_PROGRESS') {
      notificationType = 'TICKET_ASSIGNED';
    } else if (status === 'COMPLETED') {
      notificationType = 'TICKET_COMPLETED';
    }

    await NotificationService.createTicketNotification({
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      type: notificationType,
      message: `Ticket "${ticket.title}" status has been updated to ${status}`,
      // Notify the creator of the ticket
      sendToCreator: true,
      creatorId: ticket.createdBy,
      // Notify the team manager
      sendToTeamManager: true,
      teamId: ticket.teamId,
      // If completed, notify admins for visibility
      sendToAdmins: status === 'COMPLETED',
      priority: ticket.priority.toLowerCase() || 'medium'
    });

    res.json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      error: 'Failed to update ticket status',
      message: error.message
    });
  }
});

// Approve or reject ticket
router.put('/:id/approve', authenticateToken, validateId, async (req, res) => {
  try {
    console.log('Approve endpoint called with params:', req.params);
    console.log('Approve endpoint called with body:', req.body);

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check permissions - admin, super_admin, team manager, or assigned user can approve/reject tickets
    const userPermissions = await checkUserPermissions(req.user);

    let canApproveReject = userPermissions.role === 'admin' ||
      userPermissions.role === 'super_admin' ||
      ticket.assignedTo === req.user.id;

    // Also allow team managers to approve/reject tickets assigned to their team
    if (userPermissions.role === 'team') {
      const team = await Team.findOne({ where: { email: req.user.email } });
      if (team && ticket.assignedTeamId === team.id) {
        canApproveReject = true;
      }
    }

    if (!canApproveReject) {
      return res.status(403).json({
        error: 'Access denied. Only administrators, team managers, or assigned users can approve or reject tickets.'
      });
    }

    // Check if ticket is in pending approval state
    if (ticket.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        error: 'Ticket has already been processed and is no longer pending approval.'
      });
    }

    const { approved, priority, expectedClosure, rejectionReason } = req.body;

    const updateData = {
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      priority: priority || ticket.priority
    };

    if (expectedClosure) {
      updateData.expectedClosure = expectedClosure;
    }

    if (!approved && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await ticket.update(updateData);
    console.log('Ticket updated with data:', updateData);

    // Skip trying to load associations that are causing errors
    // Just get the basic ticket data without associations

    // Use the notification service to create notifications
    const NotificationService = require('../services/notificationService');

    await NotificationService.createTicketNotification({
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      type: approved ? 'TICKET_APPROVED' : 'TICKET_REJECTED',
      message: approved
        ? `Your ticket "${ticket.title}" has been approved.`
        : `Your ticket "${ticket.title}" has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
      // Always notify the creator of the ticket
      sendToCreator: true,
      creatorId: ticket.createdBy,
      // Notify the team that created the ticket
      sendToTeamManager: true,
      teamId: ticket.teamId,
      // If assigned to a different team, notify that team's manager when approved
      sendToAssignedTeamManager: approved && ticket.assignedTeamId && ticket.assignedTeamId !== ticket.teamId,
      assignedTeamId: ticket.assignedTeamId,
      // If the ticket is approved, also notify admins for visibility
      sendToAdmins: approved,
      // If the ticket is rejected, include the rejection reason in the notification
      metadata: !approved && rejectionReason ? { rejectionReason } : undefined,
      priority: ticket.priority.toLowerCase() || 'medium'
    });

    // Make sure we have a valid ticket object to return
    const ticketToReturn = await Ticket.findByPk(req.params.id);

    res.json({
      message: approved ? 'Ticket approved successfully' : 'Ticket rejected successfully',
      ticket: ticketToReturn
    });
  } catch (error) {
    console.error('Approve/reject ticket error:', error);
    res.status(500).json({
      error: 'Failed to process ticket approval',
      message: error.message
    });
  }
});

// Update ticket
router.put('/:id', authenticateToken, validateId, validateTicketUpdate, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check permissions
    const userPermissions = await checkUserPermissions(req.user);

    if (userPermissions.role === 'user') {
      const canUpdate = ticket.createdBy === req.user.id ||
        ticket.assignedTo === req.user.id;

      if (!canUpdate) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    } else if (userPermissions.role === 'admin') {
      const managedTeam = await Team.findOne({ where: { adminId: userPermissions.adminId } });
      if (managedTeam && ticket.teamId !== managedTeam.id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const updateData = { ...req.body };

    // Handle status changes
    if (updateData.status && updateData.status !== ticket.status) {
      if (updateData.status === 'APPROVED' || updateData.status === 'REJECTED') {
        updateData.approvedBy = req.user.id;
        updateData.approvedAt = new Date();
      }

      if (updateData.status === 'COMPLETED') {
        updateData.actualClosure = new Date();
      }
    }

    // Only Admin, SuperAdmin, or assigned user can approve/reject and set priority/expectedClosure if ticket is PENDING_APPROVAL
    if (
      (updateData.status === 'APPROVED' || updateData.status === 'REJECTED' || updateData.priority || updateData.expectedClosure)
    ) {
      if (ticket.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({
          error: 'Ticket has already been approved or rejected. No further changes allowed.'
        });
      }

      // Check if user has permission to approve/reject
      let canApproveReject = userPermissions.role === 'admin' ||
        userPermissions.role === 'super_admin' ||
        ticket.assignedTo === req.user.id;

      // Also allow team managers to approve/reject tickets assigned to their team
      if (userPermissions.role === 'team') {
        const team = await Team.findOne({ where: { email: req.user.email } });
        if (team && ticket.assignedTeamId === team.id) {
          canApproveReject = true;
        }
      }

      if (!canApproveReject) {
        return res.status(403).json({
          error: 'Only Admin, SuperAdmin, team managers, or assigned users can approve/reject and set priority or expected closure.'
        });
      }
    }

    await ticket.update(updateData);

    const updatedTicket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName']
        },
        {
          model: Project,
          as: 'projectRef',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      error: 'Failed to update ticket',
      message: error.message
    });
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticateToken, validateId, async (req, res) => {
  try {
    const { content, isInternal } = req.body;

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check permissions
    const userPermissions = await checkUserPermissions(req.user);

    if (userPermissions.role === 'user') {
      const canComment = ticket.createdBy === req.user.id ||
        ticket.assignedTo === req.user.id ||
        ticket.teamId === req.user.teamId;

      if (!canComment) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const comments = ticket.comments || [];
    comments.push({
      content,
      isInternal: isInternal || false,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await ticket.update({ comments });

    res.json({
      message: 'Comment added successfully',
      ticket
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
});

// Request resource for ticket
router.post('/:id/resources', authenticateToken, validateId, async (req, res) => {
  try {
    const { resourceId, quantity, reason } = req.body;

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check permissions
    const userPermissions = await checkUserPermissions(req.user);

    if (userPermissions.role === 'user') {
      const canRequest = ticket.createdBy === req.user.id ||
        ticket.assignedTo === req.user.id;

      if (!canRequest) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const resourceRequests = ticket.resourceRequests || [];
    resourceRequests.push({
      resourceId,
      quantity,
      reason,
      requestedBy: req.user.id,
      requestedAt: new Date(),
      status: 'pending'
    });

    await ticket.update({ resourceRequests });

    res.json({
      message: 'Resource request added successfully',
      ticket
    });
  } catch (error) {
    console.error('Add resource request error:', error);
    res.status(500).json({
      error: 'Failed to add resource request',
      message: error.message
    });
  }
});

// Approve/deny resource request
router.put('/:id/resources/:index', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' or 'deny'

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    const resourceRequests = ticket.resourceRequests || [];
    const index = parseInt(req.params.index);

    if (index < 0 || index >= resourceRequests.length) {
      return res.status(404).json({
        error: 'Resource request not found'
      });
    }

    const request = resourceRequests[index];
    request.status = action;
    request.processedBy = req.user.id;
    request.processedAt = new Date();

    if (action === 'deny') {
      request.reason = reason;
    }

    await ticket.update({ resourceRequests });

    res.json({
      message: `Resource request ${action}d successfully`,
      ticket
    });
  } catch (error) {
    console.error('Process resource request error:', error);
    res.status(500).json({
      error: 'Failed to process resource request',
      message: error.message
    });
  }
});

// Get ticket statistics
router.get('/stats/overview', authenticateToken, isManagerOrAdmin, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);

    let whereClause = {};

    // Role-based filtering
    if (userPermissions.role === 'admin') {
      const managedTeam = await Team.findOne({ where: { adminId: userPermissions.adminId } });
      if (managedTeam) {
        whereClause.teamId = managedTeam.id;
      }
    }

    const totalTickets = await Ticket.count({ where: whereClause });
    const pendingTickets = await Ticket.count({
      where: { ...whereClause, status: 'PENDING_APPROVAL' }
    });
    const inProgressTickets = await Ticket.count({
      where: { ...whereClause, status: 'IN_PROGRESS' }
    });
    const completedTickets = await Ticket.count({
      where: { ...whereClause, status: 'COMPLETED' }
    });
    const rejectedTickets = await Ticket.count({
      where: { ...whereClause, status: 'REJECTED' }
    });

    // Get tickets by priority
    const ticketsByPriority = await Ticket.findAll({
      where: whereClause,
      attributes: [
        'priority',
        [Ticket.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['priority']
    });

    const stats = {
      total: totalTickets,
      pending: pendingTickets,
      inProgress: inProgressTickets,
      completed: completedTickets,
      rejected: rejectedTickets,
      byPriority: ticketsByPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      error: 'Failed to get ticket statistics',
      message: error.message
    });
  }
});

// Delete ticket (admin only)
router.delete('/:id', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check if ticket is in progress or completed
    if (['IN_PROGRESS', 'COMPLETED'].includes(ticket.status)) {
      return res.status(400).json({
        error: 'Cannot delete ticket that is in progress or completed'
      });
    }

    await ticket.destroy();

    res.json({
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      error: 'Failed to delete ticket',
      message: error.message
    });
  }
});

module.exports = router; 