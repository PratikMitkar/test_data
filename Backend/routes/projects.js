const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Project = require('../models/Project');
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
  validateProjectCreation,
  validatePagination,
  validateId 
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for project document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/projects';
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
      cb(new Error('Only document and image files are allowed'));
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

// Create new project
router.post('/', authenticateToken, isManagerOrAdmin, validateProjectCreation, async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      startDate,
      endDate,
      priority = 'medium',
      budget,
      departments,
      tags,
      client,
      managerId
    } = req.body;

    // Check if project code already exists
    const existingProject = await Project.findOne({ where: { code } });
    if (existingProject) {
      return res.status(400).json({
        error: 'Project code already exists'
      });
    }

    // Create project data with proper handling of empty values
    const projectData = {
      name,
      code,
      priority,
      managerId: managerId || req.user.id,
      teamId: req.userType === 'team' ? req.user.id : (req.body.teamId || null)
    };
    
    // Only add fields if they have values
    if (description !== undefined) {
      projectData.description = description;
    }
    
    if (startDate) {
      projectData.startDate = startDate;
    }
    
    if (endDate) {
      projectData.endDate = endDate;
    }
    
    if (budget) {
      projectData.budget = budget;
    }

    // Handle array and object fields properly
    if (departments) {
      projectData.departments = Array.isArray(departments) ? departments : [departments];
    }
    if (tags) {
      projectData.tags = Array.isArray(tags) ? tags : [tags];
    }
    if (client) {
      projectData.client = typeof client === 'object' ? client : {};
    }

    const project = await Project.create(projectData);

    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Project created successfully',
      project: createdProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project',
      message: error.message
    });
  }
});

// Get projects for dropdowns (authenticated users only - limited data)
router.get('/dropdown', authenticateToken, async (req, res) => {
  try {
    // Get all projects for dropdown without filtering
    const projects = await Project.findAll({
      attributes: ['id', 'name', 'code', 'teamId'],
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects dropdown error:', error);
    res.status(500).json({
      error: 'Failed to get projects',
      message: error.message
    });
  }
});

// Get all projects
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      department,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const userPermissions = await checkUserPermissions(req.user);

    // Build where clause
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (department) {
      whereClause.departments = {
        [Op.like]: `%"${department}"%`
      };
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (userPermissions.role === 'user') {
      whereClause.managerId = req.user.id;
    } else if (userPermissions.role === 'team') {
      // Team managers can only see projects for their team
      whereClause.teamId = req.user.id;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to get projects',
      message: error.message
    });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const userPermissions = await checkUserPermissions(req.user);
    
    // Check access permissions
    if (userPermissions.role === 'user' && project.managerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Failed to get project',
      message: error.message
    });
  }
});

// Update project
router.put('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const userPermissions = await checkUserPermissions(req.user);
    
    // Check permissions
    if (userPermissions.role === 'user' && project.managerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updateData = { ...req.body };
    
    // Handle array and object fields
    if (updateData.departments) {
      updateData.departments = Array.isArray(updateData.departments) ? updateData.departments : [updateData.departments];
    }
    if (updateData.tags) {
      updateData.tags = Array.isArray(updateData.tags) ? updateData.tags : [updateData.tags];
    }
    if (updateData.client) {
      updateData.client = typeof updateData.client === 'object' ? updateData.client : {};
    }

    await project.update(updateData);

    const updatedProject = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project',
      message: error.message
    });
  }
});

// Upload project document
router.post('/:id/documents', authenticateToken, validateId, upload.array('documents', 5), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const userPermissions = await checkUserPermissions(req.user);
    
    // Check permissions
    if (userPermissions.role === 'user' && project.managerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const documents = project.documents || [];
    
    req.files.forEach(file => {
      documents.push({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      });
    });

    await project.update({ documents });

    res.json({
      message: 'Documents uploaded successfully',
      documents: req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      }))
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      error: 'Failed to upload documents',
      message: error.message
    });
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, validateId, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const userPermissions = await checkUserPermissions(req.user);
    
    // Check permissions
    if (userPermissions.role === 'user' && project.managerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const Ticket = require('../models/Ticket');

    // Get project statistics
    const totalTickets = await Ticket.count({ where: { projectId: project.id } });
    const completedTickets = await Ticket.count({ 
      where: { 
        projectId: project.id,
        status: 'COMPLETED'
      }
    });
    const inProgressTickets = await Ticket.count({ 
      where: { 
        projectId: project.id,
        status: 'IN_PROGRESS'
      }
    });
    const pendingTickets = await Ticket.count({ 
      where: { 
        projectId: project.id,
        status: 'PENDING_APPROVAL'
      }
    });

    const stats = {
      totalTickets,
      completedTickets,
      inProgressTickets,
      pendingTickets,
      completionRate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : 0,
      progress: project.progress,
      daysRemaining: Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      error: 'Failed to get project statistics',
      message: error.message
    });
  }
});

// Delete project (Admin only)
router.delete('/:id', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Check if project has active tickets
    const Ticket = require('../models/Ticket');
    const activeTickets = await Ticket.count({
      where: {
        projectId: project.id,
        status: {
          [Op.in]: ['PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS']
        }
      }
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        error: 'Cannot delete project with active tickets',
        activeTickets
      });
    }

    // Delete project documents
    const documents = project.documents || [];
    documents.forEach(doc => {
      if (fs.existsSync(doc.path)) {
        fs.unlinkSync(doc.path);
      }
    });

    await project.destroy();

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error.message
    });
  }
});

module.exports = router;