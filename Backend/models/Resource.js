const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');

const Resource = sequelize.define('Resource', {
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
  type: {
    type: DataTypes.ENUM('hardware', 'software', 'human', 'budget', 'time', 'equipment', 'space'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('development', 'testing', 'deployment', 'infrastructure', 'support', 'training'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 500]
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit: {
    type: DataTypes.ENUM('hours', 'days', 'weeks', 'months', 'pieces', 'licenses', 'users', 'gb', 'mb'),
    allowNull: false
  },
  availableQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: function() { return this.quantity; }
  },
  allocatedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('cost');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('cost', JSON.stringify(value));
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'allocated', 'maintenance', 'out_of_stock', 'discontinued'),
    defaultValue: 'available'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  location: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('location');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('location', JSON.stringify(value));
    }
  },
  specifications: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('specifications');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('specifications', JSON.stringify(value));
    }
  },
  supplier: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('supplier');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('supplier', JSON.stringify(value));
    }
  },
  maintenance: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({}),
    get() {
      const rawValue = this.getDataValue('maintenance');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('maintenance', JSON.stringify(value));
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
  projects: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('projects');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('projects', JSON.stringify(value));
    }
  },
  requests: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('requests');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('requests', JSON.stringify(value));
    }
  },
  history: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([]),
    get() {
      const rawValue = this.getDataValue('history');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('history', JSON.stringify(value));
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  managedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'resources'
});

// Instance methods
Resource.prototype.allocate = function(quantity, projectId, allocatedBy) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient available quantity');
  }
  
  this.availableQuantity -= quantity;
  this.allocatedQuantity += quantity;
  
  const projects = this.projects || [];
  projects.push({
    project: projectId,
    allocatedQuantity: quantity,
    allocatedBy: allocatedBy,
    allocatedAt: new Date()
  });
  this.projects = projects;
  
  const history = this.history || [];
  history.push({
    action: 'allocated',
    quantity: quantity,
    description: `Allocated ${quantity} ${this.unit} to project`,
    performedBy: allocatedBy,
    performedAt: new Date()
  });
  this.history = history;
  
  return this.save();
};

Resource.prototype.deallocate = function(quantity, projectId, deallocatedBy) {
  this.availableQuantity += quantity;
  this.allocatedQuantity -= quantity;
  
  const projects = this.projects || [];
  const projectIndex = projects.findIndex(p => p.project === projectId);
  if (projectIndex > -1) {
    projects.splice(projectIndex, 1);
  }
  this.projects = projects;
  
  const history = this.history || [];
  history.push({
    action: 'deallocated',
    quantity: quantity,
    description: `Deallocated ${quantity} ${this.unit} from project`,
    performedBy: deallocatedBy,
    performedAt: new Date()
  });
  this.history = history;
  
  return this.save();
};

Resource.prototype.approveRequest = function(requestIndex, approvedBy, reason) {
  const requests = this.requests || [];
  if (requests[requestIndex]) {
    requests[requestIndex].status = 'approved';
    requests[requestIndex].approvedBy = approvedBy;
    requests[requestIndex].approvedAt = new Date();
    requests[requestIndex].reason = reason;
    this.requests = requests;
  }
  return this.save();
};

Resource.prototype.denyRequest = function(requestIndex, deniedBy, reason) {
  const requests = this.requests || [];
  if (requests[requestIndex]) {
    requests[requestIndex].status = 'denied';
    requests[requestIndex].approvedBy = deniedBy;
    requests[requestIndex].approvedAt = new Date();
    requests[requestIndex].reason = reason;
    this.requests = requests;
  }
  return this.save();
};

// Static methods
Resource.getAvailable = function(filters = {}) {
  return this.findAll({
    where: {
      ...filters,
      status: 'available',
      availableQuantity: {
        [sequelize.Op.gt]: 0
      }
    }
  });
};

Resource.getStatistics = async function() {
  const stats = await Resource.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalResources'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.col('allocatedQuantity')), 'totalAllocated'],
      [sequelize.fn('SUM', sequelize.col('availableQuantity')), 'totalAvailable']
    ],
    raw: true
  });
  
  return stats[0] || { totalResources: 0, totalQuantity: 0, totalAllocated: 0, totalAvailable: 0 };
};

module.exports = Resource; 