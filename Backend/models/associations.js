const SuperAdmin = require('./SuperAdmin');
const Admin = require('./Admin');
const Team = require('./Team');
const User = require('./User');
const Ticket = require('./Ticket');
const Notification = require('./Notification');
const Project = require('./Project');
const Resource = require('./Resource');

// SuperAdmin associations
SuperAdmin.hasMany(Admin, { foreignKey: 'superAdminId', as: 'admins' });
Admin.belongsTo(SuperAdmin, { foreignKey: 'superAdminId', as: 'superAdmin' });

SuperAdmin.hasMany(Team, { foreignKey: 'superAdminId', as: 'teams' });
Team.belongsTo(SuperAdmin, { foreignKey: 'superAdminId', as: 'superAdmin' });

// Admin associations
Admin.hasMany(Team, { foreignKey: 'adminId', as: 'managedTeams' });
Team.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

// Team associations
Team.hasMany(User, { foreignKey: 'teamId', as: 'users' });
User.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// Ticket associations with teams
Team.hasMany(Ticket, { foreignKey: 'teamId', as: 'createdTickets' });
Ticket.belongsTo(Team, { foreignKey: 'teamId', as: 'creatorTeam' });

Team.hasMany(Ticket, { foreignKey: 'assignedTeamId', as: 'assignedTickets' });
Ticket.belongsTo(Team, { foreignKey: 'assignedTeamId', as: 'assignedTeam' });

// User associations
User.hasMany(Ticket, { foreignKey: 'createdBy', as: 'createdTickets' });
Ticket.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

User.hasMany(Ticket, { foreignKey: 'approvedBy', as: 'approvedTickets' });
Ticket.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Ticket.hasMany(Notification, { foreignKey: 'ticketId', as: 'notifications' });
Notification.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

// Project associations
Project.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(Project, { foreignKey: 'managerId', as: 'managedProjects' });

Project.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Team.hasMany(Project, { foreignKey: 'teamId', as: 'projects' });

Project.hasMany(Ticket, { foreignKey: 'projectId', as: 'tickets' });
Ticket.belongsTo(Project, { foreignKey: 'projectId', as: 'projectRef' });

// Resource associations
Resource.belongsTo(User, { foreignKey: 'createdBy', as: 'resourceCreator' });
User.hasMany(Resource, { foreignKey: 'createdBy', as: 'createdResources' });

Resource.belongsTo(User, { foreignKey: 'managedBy', as: 'resourceManager' });
User.hasMany(Resource, { foreignKey: 'managedBy', as: 'managedResources' });

module.exports = {
  SuperAdmin,
  Admin,
  Team,
  User,
  Ticket,
  Notification,
  Project,
  Resource
}; 