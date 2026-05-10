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
  // إعدادات الـ AI
  aiSettings: {
    modelName: { type: String, default: 'custom-ai' },
    systemPrompt: { type: String, default: 'You are a helpful Telegram bot assistant.' },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2048 }
  },
  // إعدادات المحادثة
  chatSettings: {
    maxHistory: { type: Number, default: 20 },
    language: { type: String, default: 'en' },
    personality: { type: String, default: 'helpful' }
  },
  // الإحصائيات
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }
  },
  // الحالة
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // الأوامر المخصصة
  commands: [{
    name: String,
    description: String,
    response: String
  }],
  // الكلمات المفتاحية
  keywords: [{
    trigger: String,
    response: String,
    isRegex: { type: Boolean, default: false }
  }],
  // الملفات المسموحة
  allowedFiles: {
    images: { type: Boolean, default: true },
    documents: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    video: { type: Boolean, default: true }
  },
  // القيود
  limits: {
    messagesPerDay: { type: Number, default: 1000 },
    messagesPerUser: { type: Number, default: 100 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

botSchema.index({ user: 1, name: 1 });
botSchema.index({ telegramUsername: 1 });
botSchema.index({ isActive: 1 });

botSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bot', botSchema);