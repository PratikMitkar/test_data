const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('department')
    .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design'])
    .withMessage('Please select a valid department'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required'),
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('department')
    .optional()
    .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design'])
    .withMessage('Please select a valid department'),
  body('position')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Position cannot be empty'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Project validation rules
const validateProjectCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // If description is provided and not empty, validate its length
      if (value && value.trim().length > 0 && value.trim().length < 10) {
        throw new Error('Description must be at least 10 characters');
      }
      if (value && value.trim().length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
      }
      return true;
    }),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Project code must be between 2 and 20 characters'),
  body('startDate')
    .optional({ nullable: true, checkFalsy: true })
    .if((value) => value && value.trim().length > 0)
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional({ nullable: true, checkFalsy: true })
    .if((value) => value && value.trim().length > 0)
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Please select a valid priority'),
  body('budget')
    .optional({ nullable: true })
    .if((value) => value !== null && value !== undefined && value !== '')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  body('departments.*')
    .optional()
    .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design'])
    .withMessage('Please select valid departments'),
  handleValidationErrors
];

// Ticket validation rules
const validateTicketCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .custom((value) => {
      if (!value || value.trim().length < 10) {
        throw new Error('Description must be at least 10 characters');
      }
      if (value.trim().length > 2000) {
        throw new Error('Description cannot exceed 2000 characters');
      }
      return true;
    }),
  body('type')
    .isIn(['bug', 'feature', 'task', 'improvement', 'support', 'requirement'])
    .withMessage('Please select a valid ticket type'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'])
    .withMessage('Please select a valid priority'),
  body('category')
    .isIn(['technical', 'business', 'infrastructure', 'security', 'performance', 'ui/ux', 'database', 'api'])
    .withMessage('Please select a valid category'),
  body('teamId')
    .isInt()
    .withMessage('Please provide a valid team ID'),
  body('projectId')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Please provide a valid project ID'),
  body('assignedTo')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Please provide a valid assigned user ID'),
  body('assignedTeamId')
    .isInt()
    .withMessage('Please provide a valid assigned team ID'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('estimatedHours')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors
];

const validateTicketUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'])
    .withMessage('Please select a valid priority'),
  body('status')
    .optional()
    .isIn(['PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ON_HOLD'])
    .withMessage('Please select a valid status'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('actualHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual hours must be a positive number'),
  body('resolution')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolution cannot exceed 1000 characters'),
  handleValidationErrors
];

// Resource validation rules
const validateResourceCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Resource name must be between 3 and 100 characters'),
  body('type')
    .isIn(['hardware', 'software', 'human', 'budget', 'time', 'equipment', 'space'])
    .withMessage('Please select a valid resource type'),
  body('category')
    .isIn(['development', 'testing', 'deployment', 'infrastructure', 'support', 'training'])
    .withMessage('Please select a valid category'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('unit')
    .isIn(['hours', 'days', 'weeks', 'months', 'pieces', 'licenses', 'users', 'gb', 'mb'])
    .withMessage('Please select a valid unit'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Please select a valid priority'),
  body('departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  body('departments.*')
    .optional()
    .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Engineering', 'Design'])
    .withMessage('Please select valid departments'),
  body('cost.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  handleValidationErrors
];

// Comment validation rules
const validateCommentCreation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean'),
  handleValidationErrors
];

// Requirement validation rules
const validateRequirementCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Requirement title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Requirement description must be between 10 and 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Please select a valid priority'),
  body('category')
    .optional()
    .isIn(['functional', 'non-functional', 'technical', 'business'])
    .withMessage('Please select a valid category'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  handleValidationErrors
];

// Resource request validation rules
const validateResourceRequest = [
  body('type')
    .isIn(['hardware', 'software', 'human', 'budget', 'time'])
    .withMessage('Please select a valid resource type'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('quantity')
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be a positive number'),
  body('unit')
    .optional()
    .isIn(['hours', 'days', 'weeks', 'months', 'pieces', 'licenses', 'users', 'gb', 'mb'])
    .withMessage('Please select a valid unit'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Please select a valid priority'),
  handleValidationErrors
];

// Query validation for pagination and filtering
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'priority', 'status', 'dueDate'])
    .withMessage('Please select a valid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  handleValidationErrors
];

// ID validation
const validateId = [
  param('id')
    .isInt()
    .withMessage('Please provide a valid ID'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserUpdate,
  validateProjectCreation,
  validateTicketCreation,
  validateTicketUpdate,
  validateResourceCreation,
  validateCommentCreation,
  validateRequirementCreation,
  validateResourceRequest,
  validatePagination,
  validateId
}; 