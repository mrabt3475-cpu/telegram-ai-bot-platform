const { validationResult, body, param, query } = require('express-validator');

/**
 * Validation Middleware - التحقق من المدخلات
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ==================== Auth Validations ====================
const authValidations = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number'),
    validate
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ]
};

// ==================== Bot Validations ====================
const botValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Bot name must be 2-50 characters'),
    body('telegramToken')
      .notEmpty()
      .withMessage('Telegram token is required')
      .matches(/^\d+:[A-Za-z0-9_-]+$/)
      .withMessage('Invalid Telegram token format'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    validate
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Bot name must be 2-50 characters'),
    body('aiSettings.temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('aiSettings.maxTokens')
      .optional()
      .isInt({ min: 1, max: 4000 })
      .withMessage('Max tokens must be between 1 and 4000'),
    body('pricing.pricePerMessage')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be positive'),
    validate
  ]
};

// ==================== Cost Validations ====================
const costValidations = {
  create: [
    body('type')
      .isIn(['message', 'image', 'voice', 'api_call', 'custom'])
      .withMessage('Invalid cost type'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be positive'),
    body('points')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Points must be positive'),
    validate
  ],

  calculate: [
    body('type')
      .isIn(['message', 'image', 'voice', 'api_call'])
      .withMessage('Invalid cost type'),
    body('messageLength')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Message length must be positive'),
    validate
  ]
};

// ==================== Invoice Validations ====================
const invoiceValidations = {
  create: [
    body('type')
      .isIn(['subscription', 'topup', 'custom', 'usage'])
      .withMessage('Invalid invoice type'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.description')
      .notEmpty()
      .withMessage('Item description is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be positive'),
    validate
  ]
};

// ==================== Integration Validations ====================
const integrationValidations = {
  connect: [
    body('provider')
      .isIn(['telegram', 'discord', 'slack', 'whatsapp', 'webhook'])
      .withMessage('Invalid provider'),
    body('config')
      .isObject()
      .withMessage('Config must be an object'),
    validate
  ],

  webhook: [
    body('url')
      .isURL()
      .withMessage('Valid webhook URL is required'),
    body('events')
      .optional()
      .isArray()
      .withMessage('Events must be an array'),
    validate
  ]
};

// ==================== AI Validations ====================
const aiValidations = {
  chat: [
    body('message')
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage('Message must be 1-4000 characters'),
    body('botId')
      .optional()
      .isMongoId()
      .withMessage('Invalid bot ID'),
    body('temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('maxTokens')
      .optional()
      .isInt({ min: 1, max: 4000 })
      .withMessage('Max tokens must be between 1 and 4000'),
    validate
  ],

  generateImage: [
    body('prompt')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Prompt must be 1-1000 characters'),
    body('model')
      .optional()
      .isIn(['dall-e-3', 'dall-e-2', 'stable-diffusion'])
      .withMessage('Invalid model'),
    body('size')
      .optional()
      .isIn(['256x256', '512x512', '1024x1024'])
      .withMessage('Invalid size'),
    validate
  ]
};

// ==================== User Validations ====================
const userValidations = {
  updateProfile: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('aiConfig.endpoint')
      .optional()
      .isURL()
      .withMessage('Invalid AI endpoint URL'),
    validate
  ],

  updatePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number'),
    validate
  ]
};

// ==================== ID Parameter Validation ====================
const idParam = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  ...authValidations,
  ...botValidations,
  ...costValidations,
  ...invoiceValidations,
  ...integrationValidations,
  ...aiValidations,
  ...userValidations,
  idParam
};