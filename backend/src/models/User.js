const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minLength: [3, 'Username must be at least 3 characters'],
    maxLength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  fullName: {
    type: String,
    trim: true,
    maxLength: [50, 'Full name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  // Subscription
  subscription: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise', 'admin'],
    default: 'free'
  },
  subscriptionExpires: {
    type: Date
  },
  // Points/Balance
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  // AI Configuration
  aiConfig: {
    endpoint: String,
    apiKey: String,
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    maxTokens: {
      type: Number,
      default: 2048
    }
  },
  // Role
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
  // Security
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  // Two Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  // API Keys
  apiKeys: [{
    name: String,
    key: String,
    permissions: [String],
    lastUsed: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Referral
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referrals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Notifications
  notificationSettings: {
    email: { type: Boolean, default: true },
    telegram: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false }
  },
  telegramChatId: String,
  // Stats
  stats: {
    totalBots: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  // Metadata
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    enum: ['ar', 'en', 'es', 'fr', 'ru', 'zh'],
    default: 'ar'
  },
  lastActivity: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ createdAt: -1 });

// Virtual: Bot count
userSchema.virtual('botCount', {
  ref: 'Bot',
  localField: '_id',
  foreignField: 'user',
  count: true
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT Token
userSchema.methods.generateToken = function(payload = {}) {
  return jwt.sign(
    { id: this._id, ...payload },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) }; // 15 minutes
  }
  
  return this.updateOne(updates);
};

// Static: Find by email or username
userSchema.statics.findByCredentials = async function(identifier, password) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (!await user.comparePassword(password)) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked()) {
    throw new Error('Account is temporarily locked');
  }
  
  // Reset login attempts on successful login
  await user.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
  
  return user;
};

module.exports = mongoose.model('User', userSchema);