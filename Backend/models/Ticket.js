const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('bug', 'feature', 'task', 'improvement', 'support', 'requirement'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('technical', 'business', 'infrastructure', 'security', 'performance', 'ui/ux', 'database', 'api'),
    allowNull: false
  },
  department: {
    type: DataTypes.ENUM('IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design'),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'),
    defaultValue: 'MEDIUM'
  },
  status: {
    type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'),
    defaultValue: 'PENDING_APPROVAL'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expectedClosure: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualClosure: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  actualHours: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  // Additional fields for enhanced functionality
  project: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  attachments: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('attachments');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('attachments', JSON.stringify(value));
    }
  },
  comments: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('comments');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('comments', JSON.stringify(value));
    }
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tickets',
  timestamps: true
});

module.exports = Ticket; 