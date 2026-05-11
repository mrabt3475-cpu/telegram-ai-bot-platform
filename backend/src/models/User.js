const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  // Points/Balance
  points: {
    type: Number,
    default: 100 // Free starter points
  },
  // Subscription
  subscription: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise', 'vip_king'],
    default: 'free'
  },
  subscriptionExpiresAt: Date,
  // AI Configuration
  aiConfig: {
    endpoint: String,
    apiKey: String,
    modelName: { type: String, default: 'gpt-3.5-turbo' }
  },
  // Payment Configuration
  paymentConfig: {
    stripeCustomerId: String,
    paypalEmail: String,
    cryptoAddress: String,
    cryptoCurrency: String
  },
  // Budget
  budget: {
    monthlyLimit: { type: Number, default: 0 },
    resetDate: Date
  },
  // Profile
  profile: {
    avatar: String,
    bio: String,
    timezone: { type: String, default: 'UTC' }
  },
  // Settings
  settings: {
    emailNotifications: { type: Boolean, default: true },
    telegramNotifications: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' }
  },
  // Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.updatedAt = new Date();
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    points: this.points,
    subscription: this.subscription,
    profile: this.profile,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);