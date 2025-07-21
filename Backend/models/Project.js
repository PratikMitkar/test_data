const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Description cannot exceed 1000 characters'
      },
      customValidator(value) {
        // Only validate if description is provided and not empty
        if (value && value.trim() !== '' && value.trim().length < 10) {
          throw new Error('Description must be at least 10 characters');
        }
      }
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'on-hold', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  departments: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('departments');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('departments', JSON.stringify(value));
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
  client: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('client');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('client', JSON.stringify(value));
    }
  },
  risks: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('risks');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('risks', JSON.stringify(value));
    }
  },
  documents: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('documents');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('documents', JSON.stringify(value));
    }
  },
  milestones: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('milestones');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('milestones', JSON.stringify(value));
    }
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teams',
      key: 'id'
    }
  }
}, {
  tableName: 'projects'
});

// Instance methods
Project.prototype.calculateProgress = function() {
  // This would need to be implemented based on requirements
  return this.progress;
};

Project.prototype.getSummary = function() {
  return {
    id: this.id,
    name: this.name,
    code: this.code,
    status: this.status,
    progress: this.progress,
    startDate: this.startDate,
    endDate: this.endDate,
    manager: this.manager,
    teamSize: this.team ? this.team.length : 0,
    requirementsCount: this.requirements ? this.requirements.length : 0,
    completedRequirements: this.requirements ? this.requirements.filter(req => req.status === 'completed').length : 0
  };
};

module.exports = Project; 