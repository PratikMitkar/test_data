const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const Team = require('../models/Team');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({ 
        error: 'Invalid token format. Missing required fields.' 
      });
    }
    
    // Check for different user types based on role
    let user = null;
    let userType = null;

    if (decoded.role === 'super_admin') {
      const superAdmin = await SuperAdmin.findByPk(decoded.id);
      if (superAdmin) {
        user = superAdmin; // SuperAdmin is the user in this case
        userType = 'super_admin';
      }
    } else if (decoded.role === 'admin') {
      const admin = await Admin.findByPk(decoded.id);
      if (admin) {
        user = admin; // Admin is the user in this case
        userType = 'admin';
      }
    } else if (decoded.role === 'team') {
      const team = await Team.findByPk(decoded.id);
      if (team) {
        user = team; // Team is the user in this case
        userType = 'team';
      }
    } else {
      // Regular user
      user = await User.findByPk(decoded.id);
      userType = 'user';
    }
    
    // Ensure user has an ID property
    if (user && !user.id && decoded.id) {
      user.id = decoded.id;
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    if (userType === 'user' && !user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated.' 
      });
    }

    req.user = user;
    req.userType = userType;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    return res.status(500).json({ 
      error: 'Token verification failed.' 
    });
  }
};

// Middleware to check if user has required role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.userType)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Middleware to check if user is manager or admin
const isManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }

  if (!['admin', 'super_admin', 'team'].includes(req.userType)) {
    return res.status(403).json({ 
      error: 'Access denied. Manager or admin privileges required.' 
    });
  }

  next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }

  if (!['admin', 'super_admin'].includes(req.userType)) {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

// Middleware to check if user can access resource (owner or manager/admin)
const canAccessResource = (resourceField = 'requester') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    // Admin and managers can access all resources
    if (['admin', 'super_admin'].includes(req.userType)) {
      return next();
    }

    // Check if user is the resource owner
    if (req.params.id || req.body[resourceField]) {
      const resourceOwner = req.params.id || req.body[resourceField];
      if (resourceOwner.toString() === req.user.id.toString()) {
        return next();
      }
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.' 
    });
  };
};

// Middleware to check if user can manage project
const canManageProject = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    // Admin can manage all projects
    if (['admin', 'super_admin'].includes(req.userType)) {
      return next();
    }

    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required.' 
      });
    }

    const Project = require('../models/Project');
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found.' 
      });
    }

    // Check if user is project manager
    if (project.managerId && project.managerId.toString() === req.user.id.toString()) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only manage projects you are assigned to.' 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Error checking project permissions.' 
    });
  }
};

// Middleware to check if user can manage ticket
const canManageTicket = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    // Admin can manage all tickets
    if (['admin', 'super_admin'].includes(req.userType)) {
      return next();
    }

    const ticketId = req.params.id || req.body.ticketId;
    if (!ticketId) {
      return res.status(400).json({ 
        error: 'Ticket ID is required.' 
      });
    }

    const Ticket = require('../models/Ticket');
    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        error: 'Ticket not found.' 
      });
    }

    // Check if user is ticket assignee
    if (ticket.assignedTo && ticket.assignedTo.toString() === req.user.id.toString()) {
      return next();
    }

    // Check if user is ticket creator
    if (ticket.createdBy.toString() === req.user.id.toString()) {
      return next();
    }

    // Check if user is in the same team
    if (req.userType === 'user' && ticket.teamId === req.user.teamId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only manage tickets assigned to you or in your team.' 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Error checking ticket permissions.' 
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRole,
  isManagerOrAdmin,
  isAdmin,
  canAccessResource,
  canManageProject,
  canManageTicket
}; 