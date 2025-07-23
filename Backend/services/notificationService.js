const Notification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../models/Team');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const { Op } = require('sequelize');

/**
 * Centralized service for handling notifications
 */
class NotificationService {
  /**
   * Create a notification for a specific user
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(data) {
    try {
      return await Notification.create(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification for a ticket event
   * @param {Object} options - Notification options
   * @returns {Promise<Array>} Created notifications
   */
  static async createTicketNotification(options) {
    const {
      ticketId,
      ticketTitle,
      type,
      message,
      recipientId,
      recipientType,
      sendToCreator = false,
      sendToAssignee = false,
      sendToTeam = false,
      sendToTeamManager = false,
      sendToAssignedTeam = false,
      sendToAssignedTeamManager = false,
      sendToAdmins = false,
      sendToSuperAdmins = false,
      creatorId,
      assigneeId,
      teamId,
      assignedTeamId,
      priority = 'medium',
      metadata = {}
    } = options;

    const notifications = [];
    const notifiedUsers = new Set(); // Track already notified users to prevent duplicates

    try {
      // Validate notification type against ENUM values
      const validTypes = [
        'TICKET_CREATED',
        'TICKET_ASSIGNED',
        'TICKET_APPROVED',
        'TICKET_REJECTED',
        'TICKET_COMPLETED',
        'RESOURCE_REQUEST',
        'PROJECT_UPDATE',
        'SYSTEM_ANNOUNCEMENT'
      ];

      if (!validTypes.includes(type)) {
        throw new Error(`Invalid notification type: ${type}. Valid types are: ${validTypes.join(', ')}`);
      }

      // Helper function to create notification and avoid duplicates
      const createNotificationIfNotExists = async (userId, customMessage = null) => {
        // Skip if this user already received a notification
        if (notifiedUsers.has(userId)) {
          return null;
        }
        
        notifiedUsers.add(userId);
        
        const notificationData = {
          userId,
          ticketId,
          title: this.getNotificationTitle(type),
          message: customMessage || message || this.getDefaultMessage(type, ticketTitle),
          type,
          priority,
          isRead: false,
          metadata: JSON.stringify(metadata || {})
        };

        const notification = await this.createNotification(notificationData);
        notifications.push(notification);
        return notification;
      };

      // Create notification for specific recipient if provided
      if (recipientId) {
        await createNotificationIfNotExists(recipientId);
      }

      // Send to ticket creator if requested
      if (sendToCreator && creatorId) {
        await createNotificationIfNotExists(creatorId);
      }

      // Send to ticket assignee if requested
      if (sendToAssignee && assigneeId) {
        await createNotificationIfNotExists(assigneeId);
      }

      // Send to creator team if requested
      if (sendToTeam && teamId) {
        const team = await Team.findByPk(teamId);
        if (team) {
          // Get team manager's ID from the team record
          const teamManagerId = team.id; // Team record itself represents the manager
          await createNotificationIfNotExists(teamManagerId, 
            `A ticket in your team "${team.teamName}" has been ${this.getActionFromType(type)}.`);
        }
      }

      // Send to team manager specifically if requested
      if (sendToTeamManager && teamId) {
        const team = await Team.findByPk(teamId);
        if (team) {
          // Get team manager's ID from the team record
          const teamManagerId = team.id; // Team record itself represents the manager
          await createNotificationIfNotExists(teamManagerId, 
            `A ticket in your team "${team.teamName}" requires your attention.`);
        }
      }

      // Send to assigned team if requested
      if (sendToAssignedTeam && assignedTeamId) {
        const team = await Team.findByPk(assignedTeamId);
        if (team) {
          // Get team manager's ID from the team record
          const teamManagerId = team.id; // Team record itself represents the manager
          await createNotificationIfNotExists(teamManagerId, 
            `A ticket has been assigned to your team "${team.teamName}".`);
        }
      }

      // Send to assigned team manager specifically if requested
      if (sendToAssignedTeamManager && assignedTeamId) {
        const team = await Team.findByPk(assignedTeamId);
        if (team) {
          // Get team manager's ID from the team record
          const teamManagerId = team.id; // Team record itself represents the manager
          await createNotificationIfNotExists(teamManagerId, 
            `A ticket assigned to your team "${team.teamName}" requires your attention.`);
        }
      }

      // Send to all admins if requested
      if (sendToAdmins) {
        const admins = await Admin.findAll();
        for (const admin of admins) {
          await createNotificationIfNotExists(admin.id);
        }
      }

      // Send to all super admins if requested
      if (sendToSuperAdmins) {
        const superAdmins = await SuperAdmin.findAll();
        for (const superAdmin of superAdmins) {
          await createNotificationIfNotExists(superAdmin.id);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating ticket notification:', error);
      throw error;
    }
  }

  /**
   * Get default notification title based on type
   * @param {string} type - Notification type
   * @returns {string} Notification title
   */
  static getNotificationTitle(type) {
    switch (type) {
      case 'TICKET_CREATED':
        return 'New Ticket Created';
      case 'TICKET_ASSIGNED':
        return 'Ticket Assigned';
      case 'TICKET_APPROVED':
        return 'Ticket Approved';
      case 'TICKET_COMPLETED':
        return 'Ticket Completed';
      case 'RESOURCE_REQUEST':
        return 'Resource Request';
      case 'PROJECT_UPDATE':
        return 'Project Update';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'System Announcement';
      default:
        return 'Notification';
    }
  }

  /**
   * Get default notification message based on type and ticket title
   * @param {string} type - Notification type
   * @param {string} ticketTitle - Ticket title
   * @returns {string} Notification message
   */
  static getDefaultMessage(type, ticketTitle) {
    switch (type) {
      case 'TICKET_CREATED':
        return `A new ticket "${ticketTitle}" has been created and needs your attention.`;
      case 'TICKET_ASSIGNED':
        return `Ticket "${ticketTitle}" has been assigned to you.`;
      case 'TICKET_APPROVED':
        return `Ticket "${ticketTitle}" has been approved and is ready for processing.`;
      case 'TICKET_REJECTED':
        return `Ticket "${ticketTitle}" has been rejected.`;
      case 'TICKET_COMPLETED':
        return `Ticket "${ticketTitle}" has been completed.`;
      case 'RESOURCE_REQUEST':
        return `A resource request has been made for ticket "${ticketTitle}".`;
      case 'PROJECT_UPDATE':
        return `There's an update for the project related to ticket "${ticketTitle}".`;
      case 'SYSTEM_ANNOUNCEMENT':
        return `System announcement regarding ticket "${ticketTitle}".`;
      default:
        return `Notification regarding ticket "${ticketTitle}".`;
    }
  }
  
  /**
   * Get action text from notification type
   * @param {string} type - Notification type
   * @returns {string} Action text
   */
  static getActionFromType(type) {
    switch (type) {
      case 'TICKET_CREATED':
        return 'created';
      case 'TICKET_ASSIGNED':
        return 'assigned';
      case 'TICKET_APPROVED':
        return 'approved';
      case 'TICKET_REJECTED':
        return 'rejected';
      case 'TICKET_COMPLETED':
        return 'completed';
      default:
        return 'updated';
    }
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for permission check)
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Access denied');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of updated notifications
   */
  static async markAllAsRead(userId) {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true },
        {
          where: {
            userId,
            isRead: false
          }
        }
      );
      return updatedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for permission check)
   * @returns {Promise<boolean>} Success status
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Access denied');
      }

      await notification.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;