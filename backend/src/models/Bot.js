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
  // إعدادات التكلفة
  pricing: {
    // هل يتم charging لكل رسالة
    isPaid: { type: Boolean, default: false },
    // السعر لكل رسالة
    pricePerMessage: { type: Number, default: 0 },
    // السعر لكل صورة
    pricePerImage: { type: Number, default: 0 },
    // العملة
    currency: { type: String, default: 'USD' },
    // الرصيد المطلوب
    requiredPoints: { type: Number, default: 0 },
    // هل المجاني
    isFree: { type: Boolean, default: true },
    // حد الرسائل المجانية
    freeMessages: { type: Number, default: 100 }
  },
  // إعدادات المحادثة
  chatSettings: {
    maxHistory: { type: Number, default: 20 },
    language: { type: String, default: 'en' },
    personality: { type: String, default: 'helpful' },
    // تفعيل/تعطيل
    isEnabled: { type: Boolean, default: true },
    // وضع الصمت
    isMuted: { type: Boolean, default: false }
  },
  // الإحصائيات
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    messagesToday: { type: Number, default: 0 },
    messagesThisMonth: { type: Number, default: 0 }
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
  // إعدادات الـ Webhook
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