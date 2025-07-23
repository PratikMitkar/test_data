const express = require('express');
const { Op } = require('sequelize');
const Team = require('../models/Team');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const { 
  authenticateToken, 
  isManagerOrAdmin,
  isAdmin 
} = require('../middleware/auth');
const { 
  validatePagination,
  validateId 
} = require('../middleware/validation');

const router = express.Router();

// Get team members for team manager
router.get('/members', authenticateToken, async (req, res) => {
  try {
    // Check user permissions
    const userPermissions = await checkUserPermissions(req.user);
    
    if (userPermissions.role === 'team') {
      // Team manager can see their team members
      const team = await Team.findOne({ where: { email: req.user.email } });
      if (team) {
        const members = await User.findAll({
          where: { teamId: team.id },
          attributes: ['id', 'name', 'email'],
          order: [['name', 'ASC']]
        });
        
        // Always include the team manager themselves in the list
        // First, try to find the team manager user record
        let teamManager = await User.findOne({
          where: { email: req.user.email },
          attributes: ['id', 'name', 'email']
        });
        
        let allMembers = [...members];
        
        // If team manager has a user record and isn't already in the list, add them
        if (teamManager && !members.find(member => member.id === teamManager.id)) {
          allMembers.push(teamManager);
        } else if (!teamManager) {
          // If team manager doesn't have a user record, create a virtual entry using team data
          // This allows the team manager to assign tickets to themselves
          teamManager = {
            id: team.id, // Use team ID as user ID for assignment
            name: team.managerName,
            email: team.email,
            isTeamManager: true // Flag to identify this is a team manager
          };
          allMembers.push(teamManager);
        }
        
        // Sort again after adding team manager
        allMembers.sort((a, b) => a.name.localeCompare(b.name));
        
        res.json({ members: allMembers });
      } else {
        res.json({ members: [] });
      }
    } else if (userPermissions.role === 'admin' || userPermissions.role === 'super_admin') {
      // Admin and super admin can see all users
      const members = await User.findAll({
        attributes: ['id', 'name', 'email', 'teamId'],
        include: [{
          model: Team,
          as: 'team',
          attributes: ['teamName']
        }],
        order: [['name', 'ASC']]
      });
      
      res.json({ members });
    } else {
      return res.status(403).json({
        error: 'Access denied. Only team managers, admins, and super admins can access team members.'
      });
    }
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      error: 'Failed to get team members',
      message: error.message
    });
  }
});

// Get teams for dropdowns (authenticated users only - limited data)
router.get('/dropdown', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      attributes: ['id', 'teamName', 'managerName'],
      order: [['teamName', 'ASC']]
    });

    res.json({ teams });
  } catch (error) {
    console.error('Get teams dropdown error:', error);
    res.status(500).json({
      error: 'Failed to get teams',
      message: error.message
    });
  }
});

// Helper function to check user permissions
const checkUserPermissions = async (user) => {
  try {
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

// Get all teams
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { teamName: { [Op.like]: `%${search}%` } },
        { managerName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: teams } = await Team.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    // Get member count for each team
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await User.count({ where: { teamId: team.id } });
        return {
          ...team.toJSON(),
          memberCount
        };
      })
    );

    res.json({
      teams: teamsWithMemberCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      error: 'Failed to get teams',
      message: error.message
    });
  }
});

// Get team by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username', 'name', 'email', 'isActive', 'createdAt']
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      error: 'Failed to get team',
      message: error.message
    });
  }
});

// Update team status (Admin only)
router.put('/:id/status', authenticateToken, validateId, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive must be a boolean value'
      });
    }

    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    await team.update({ isActive });

    res.json({
      message: `Team ${isActive ? 'activated' : 'deactivated'} successfully`,
      team: {
        id: team.id,
        teamName: team.teamName,
        managerName: team.managerName,
        email: team.email,
        isActive: team.isActive
      }
    });
  } catch (error) {
    console.error('Update team status error:', error);
    res.status(500).json({
      error: 'Failed to update team status',
      message: error.message
    });
  }
});

// Update team
router.put('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);
    
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    // Check permissions - only super admin, admin, or the team itself can update
    if (userPermissions.role === 'user' || 
        (userPermissions.role === 'team' && req.user.id !== team.id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    await team.update(updateData);

    const updatedTeam = await Team.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      error: 'Failed to update team',
      message: error.message
    });
  }
});

// Get team statistics
router.get('/:id/stats', authenticateToken, validateId, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    const Ticket = require('../models/Ticket');

    // Get team statistics
    const totalMembers = await User.count({ where: { teamId: team.id } });
    const activeMembers = await User.count({ 
      where: { 
        teamId: team.id,
        isActive: true
      }
    });
    const totalTickets = await Ticket.count({ where: { teamId: team.id } });
    const pendingTickets = await Ticket.count({ 
      where: { 
        teamId: team.id,
        status: 'PENDING_APPROVAL'
      }
    });
    const completedTickets = await Ticket.count({ 
      where: { 
        teamId: team.id,
        status: 'COMPLETED'
      }
    });

    const stats = {
      totalMembers,
      activeMembers,
      totalTickets,
      pendingTickets,
      completedTickets,
      completionRate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      error: 'Failed to get team statistics',
      message: error.message
    });
  }
});

// Delete team (Super Admin only)
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const userPermissions = await checkUserPermissions(req.user);
    
    if (userPermissions.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Only Super Admin can delete teams'
      });
    }

    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    // Check if team has active members
    const activeMembers = await User.count({
      where: {
        teamId: team.id,
        isActive: true
      }
    });

    if (activeMembers > 0) {
      return res.status(400).json({
        error: 'Cannot delete team with active members',
        activeMembers
      });
    }

    await team.destroy();

    res.json({
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      error: 'Failed to delete team',
      message: error.message
    });
  }
});

module.exports = router;