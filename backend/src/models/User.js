const mongoose = require('mongoose');

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
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minLength: 6
  },
  subscription: { 
    type: String, 
    enum: ['free', 'basic', 'premium', 'enterprise'], 
    default: 'free' 
  },
  subscriptionExpiresAt: Date,
  points: { 
    type: Number, 
    default: 0,
    min: 0
  },
  referrals: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  referralCode: { 
    type: String, 
    unique: true 
  },
  telegramChatId: String,
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  apiRequestsThisMonth: { 
    type: Number, 
    default: 0 
  },
  apiLimit: { 
    type: Number, 
    default: 1000 
  },
  usage: {
    messages: { type: Number, default: 0 },
    images: { type: Number, default: 0 },
    apiRequests: { type: Number, default: 0 }
  },
  // إعدادات الـ AI Model المخصص
  aiConfig: {
    endpoint: String,
    apiKey: String,
    modelName: String,
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2048 }
  },
  // تكامل Telegram فقط
  integrations: {
    telegram: {
      botToken: String,
      botUsername: String,
      botName: String,
      isActive: { type: Boolean, default: false },
      connectedAt: Date
    }
  },
  webhooks: [{
    id: String,
    url: String,
    events: [String],
    createdAt: Date
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// تحديث timestamp تلقائياً
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// إنشاء referral code
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);