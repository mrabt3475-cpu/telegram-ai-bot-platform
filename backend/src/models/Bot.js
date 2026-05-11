const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  description: {
    type: String,
    maxLength: 500,
    default: ''
  },
  telegramToken: {
    type: String,
    required: true,
    unique: true
  },
  telegramUsername: String,
  telegramChatId: String,
  // AI Settings
  aiSettings: {
    modelName: { type: String, default: 'gpt-3.5-turbo' },
    systemPrompt: { type: String, default: 'You are a helpful Telegram bot assistant.' },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 1000 },
    personality: { type: String, default: 'helpful' },
    responseStyle: { type: String, default: 'friendly' }
  },
  // Pricing
  pricing: {
    isPaid: { type: Boolean, default: false },
    pricePerMessage: { type: Number, default: 0 },
    pricePerImage: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    requiredPoints: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    freeMessages: { type: Number, default: 100 }
  },
  // Chat Settings
  chatSettings: {
    maxHistory: { type: Number, default: 20 },
    language: { type: String, default: 'en' },
    personality: { type: String, default: 'helpful' },
    isEnabled: { type: Boolean, default: true },
    isMuted: { type: Boolean, default: false }
  },
  // Stats
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    messagesToday: { type: Number, default: 0 },
    messagesThisMonth: { type: Number, default: 0 }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // Custom Commands
  commands: [{
    name: String,
    description: String,
    response: String
  }],
  // Keywords
  keywords: [{
    trigger: String,
    response: String,
    isRegex: { type: Boolean, default: false }
  }],
  // Allowed Files
  allowedFiles: {
    images: { type: Boolean, default: true },
    documents: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    video: { type: Boolean, default: true }
  },
  // Limits
  limits: {
    messagesPerDay: { type: Number, default: 1000 },
    messagesPerUser: { type: Number, default: 100 }
  },
  // Webhook
  webhook: {
    url: String,
    events: [String],
    isEnabled: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

botSchema.index({ user: 1, name: 1 });
botSchema.index({ telegramUsername: 1 });
botSchema.index({ isActive: 1 });
botSchema.index({ 'pricing.isPaid': 1 });

botSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bot', botSchema);