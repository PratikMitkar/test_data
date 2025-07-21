const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Resource = require('../models/Resource');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { 
  authenticateToken, 
  isManagerOrAdmin,
  isAdmin 
} = require('../middleware/auth');
const { 
  validateResourceCreation,
  validatePagination,
  validateId 
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for resource document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resources';
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

// Create new resource
router.post('/', authenticateToken, isManagerOrAdmin, validateResourceCreation, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      description,
      quantity,
      unit,
      priority,
      departments,
      tags,
      cost,
      location,
      specifications,
      supplier
    } = req.body;

    // Create resource
    const resourceData = {
      name,
      type,
      category,
      description,
      quantity,
      unit,
      priority,
      departments: Array.isArray(departments) ? departments : (departments ? [departments] : []),
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      cost: typeof cost === 'object' ? cost : {},
      location: typeof location === 'object' ? location : {},
      specifications: typeof specifications === 'object' ? specifications : {},
      supplier: typeof supplier === 'object' ? supplier : {},
      createdBy: req.user.id,
      managedBy: req.user.id
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      resourceData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        uploadedBy: req.user.id
      }));
    }

    const resource = await Resource.create(resourceData);

    res.status(201).json({
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      error: 'Failed to create resource',
      message: error.message
    });
  }
});

// Get all resources with filtering and pagination
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      status,
      priority,
      department,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build where clause
    const whereClause = {};
    
    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (department) whereClause.departments = department;

    // Search functionality
    if (search) {
      whereClause.$or = [
        { name: { $like: `%${search}%` } },
        { description: { $like: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'manager') {
      whereClause.departments = req.user.department;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: resources } = await Resource.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'resourceCreator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'resourceManager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      error: 'Failed to get resources',
      message: error.message
    });
  }
});

// Get available resources
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { type, category, department } = req.query;

    const whereClause = {
      status: 'available',
      availableQuantity: { $gt: 0 }
    };

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (department) whereClause.departments = department;

    const resources = await Resource.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'resourceManager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ resources });
  } catch (error) {
    console.error('Get available resources error:', error);
    res.status(500).json({
      error: 'Failed to get available resources',
      message: error.message
    });
  }
});

// Get resource by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'resourceCreator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'resourceManager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      error: 'Failed to get resource',
      message: error.message
    });
  }
});

// Update resource
router.put('/:id', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const updateData = { ...req.body };
    
    // Handle JSON fields
    if (updateData.departments) {
      updateData.departments = JSON.parse(updateData.departments);
    }
    if (updateData.tags) {
      updateData.tags = JSON.parse(updateData.tags);
    }
    if (updateData.cost) {
      updateData.cost = JSON.parse(updateData.cost);
    }
    if (updateData.location) {
      updateData.location = JSON.parse(updateData.location);
    }
    if (updateData.specifications) {
      updateData.specifications = JSON.parse(updateData.specifications);
    }
    if (updateData.supplier) {
      updateData.supplier = JSON.parse(updateData.supplier);
    }

    await resource.update(updateData);

    const updatedResource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'resourceCreator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'resourceManager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Resource updated successfully',
      resource: updatedResource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      error: 'Failed to update resource',
      message: error.message
    });
  }
});

// Allocate resource to project
router.post('/:id/allocate', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const { projectId, quantity, allocatedBy } = req.body;
    
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    if (resource.availableQuantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient available quantity'
      });
    }

    // Update resource quantities
    resource.availableQuantity -= quantity;
    resource.allocatedQuantity += quantity;

    // Add to projects array
    const projects = resource.projects || [];
    projects.push({
      project: projectId,
      allocatedQuantity: quantity,
      allocatedBy: allocatedBy || req.user.id,
      allocatedAt: new Date()
    });

    await resource.update({
      availableQuantity: resource.availableQuantity,
      allocatedQuantity: resource.allocatedQuantity,
      projects: projects
    });

    res.json({
      message: 'Resource allocated successfully',
      resource
    });
  } catch (error) {
    console.error('Allocate resource error:', error);
    res.status(500).json({
      error: 'Failed to allocate resource',
      message: error.message
    });
  }
});

// Deallocate resource from project
router.post('/:id/deallocate', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const { projectId, quantity } = req.body;
    
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const projects = resource.projects || [];
    const projectIndex = projects.findIndex(p => p.project === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        error: 'Project allocation not found'
      });
    }

    const projectAllocation = projects[projectIndex];
    if (projectAllocation.allocatedQuantity < quantity) {
      return res.status(400).json({
        error: 'Cannot deallocate more than allocated quantity'
      });
    }

    // Update quantities
    resource.availableQuantity += quantity;
    resource.allocatedQuantity -= quantity;

    // Update or remove project allocation
    if (projectAllocation.allocatedQuantity === quantity) {
      projects.splice(projectIndex, 1);
    } else {
      projectAllocation.allocatedQuantity -= quantity;
    }

    await resource.update({
      availableQuantity: resource.availableQuantity,
      allocatedQuantity: resource.allocatedQuantity,
      projects: projects
    });

    res.json({
      message: 'Resource deallocated successfully',
      resource
    });
  } catch (error) {
    console.error('Deallocate resource error:', error);
    res.status(500).json({
      error: 'Failed to deallocate resource',
      message: error.message
    });
  }
});

// Approve resource request
router.put('/:id/requests/:index/approve', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const requests = resource.requests || [];
    const index = parseInt(req.params.index);

    if (index < 0 || index >= requests.length) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    const request = requests[index];
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();

    await resource.update({ requests });

    res.json({
      message: 'Request approved successfully',
      resource
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      error: 'Failed to approve request',
      message: error.message
    });
  }
});

// Deny resource request
router.put('/:id/requests/:index/deny', authenticateToken, validateId, isManagerOrAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    const requests = resource.requests || [];
    const index = parseInt(req.params.index);

    if (index < 0 || index >= requests.length) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    const request = requests[index];
    request.status = 'denied';
    request.deniedBy = req.user.id;
    request.deniedAt = new Date();
    request.reason = reason;

    await resource.update({ requests });

    res.json({
      message: 'Request denied successfully',
      resource
    });
  } catch (error) {
    console.error('Deny request error:', error);
    res.status(500).json({
      error: 'Failed to deny request',
      message: error.message
    });
  }
});

// Upload resource document
router.post('/:id/documents', authenticateToken, validateId, isManagerOrAdmin, upload.array('attachments', 5), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const attachments = resource.attachments || [];
    const newAttachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    }));

    attachments.push(...newAttachments);
    await resource.update({ attachments });

    res.json({
      message: 'Documents uploaded successfully',
      resource
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      error: 'Failed to upload documents',
      message: error.message
    });
  }
});

// Get resource statistics
router.get('/stats/overview', authenticateToken, isManagerOrAdmin, async (req, res) => {
  try {
    const totalResources = await Resource.count();
    const availableResources = await Resource.count({
      where: { status: 'available' }
    });
    const allocatedResources = await Resource.count({
      where: { status: 'allocated' }
    });
    const maintenanceResources = await Resource.count({
      where: { status: 'maintenance' }
    });

    const stats = {
      total: totalResources,
      available: availableResources,
      allocated: allocatedResources,
      maintenance: maintenanceResources,
      utilization: totalResources > 0 ? (allocatedResources / totalResources) * 100 : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get resource stats error:', error);
    res.status(500).json({
      error: 'Failed to get resource statistics',
      message: error.message
    });
  }
});

// Get resources by type
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const resources = await Resource.findAll({
      where: { type: req.params.type },
      include: [
        {
          model: User,
          as: 'resourceManager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ resources });
  } catch (error) {
    console.error('Get resources by type error:', error);
    res.status(500).json({
      error: 'Failed to get resources by type',
      message: error.message
    });
  }
});

// Delete resource (admin only)
router.delete('/:id', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found'
      });
    }

    // Check if resource is allocated
    if (resource.allocatedQuantity > 0) {
      return res.status(400).json({
        error: 'Cannot delete resource that is currently allocated'
      });
    }

    await resource.destroy();

    res.json({
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      error: 'Failed to delete resource',
      message: error.message
    });
  }
});

module.exports = router; 