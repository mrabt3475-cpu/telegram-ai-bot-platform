const mongoose = require('mongoose');

/**
 * Activity Log Model - سجل النشاط
 */
const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user.login',
      'user.logout',
      'user.register',
      'user.password_change',
      'bot.create',
      'bot.update',
      'bot.delete',
      'bot.toggle',
      'payment.create',
      'payment.verify',
      'api.call',
      'settings.update'
    ]
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  error: String
}, {
  timestamps: true
});

// Indexes
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

/**
 * API Key Model - مفاتيح API
 */
const apiKeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  prefix: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'admin']
  }],
  rateLimit: {
    perMinute: { type: Number, default: 60 },
    perHour: { type: Number, default: 1000 }
  },
  expiresAt: Date,
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
apiKeySchema.index({ user: 1, isActive: 1 });

const APIKey = mongoose.model('APIKey', apiKeySchema);

/**
 * Webhook Subscription Model - اشتراكات Webhook
 */
const webhookSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot'
  },
  url: {
    type: String,
    required: true
  },
  events: [{
    type: String,
    enum: [
      'message.new',
      'message.edited',
      'callback.query',
      'bot.started',
      'bot.stopped',
      'user.joined',
      'payment.received'
    ]
  }],
  secret: String,
  isActive: {
    type: Boolean,
    default: true
  },
  headers: mongoose.Schema.Types.Mixed,
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 1000 }
  },
  lastTriggered: Date,
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
webhookSubscriptionSchema.index({ user: 1, isActive: 1 });

const WebhookSubscription = mongoose.model('WebhookSubscription', webhookSubscriptionSchema);

/**
 * Session Model - جلسات المستخدم
 */
const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: String,
  device: {
    type: String,
    default: 'unknown'
  },
  browser: String,
  os: String,
  ipAddress: String,
  location: {
    country: String,
    city: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  lastActivity: Date
}, {
  timestamps: true
});

// Index
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

/**
 * Notification Model - الإشعارات
 */
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'payment.success',
      'payment.failed',
      'usage.warning',
      'limit.exceeded',
      'bot.offline',
      'bot.error',
      'subscription.renewal',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: mongoose.Schema.Types.Mixed,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Index
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  ActivityLog,
  APIKey,
  WebhookSubscription,
  Session,
  Notification
};