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
  // Telegram
  telegramToken: {
    type: String,
    required: true,
    unique: true
  },
  telegramUsername: String,
  telegramChatId: String,
  
  // AI Settings
  aiSettings: {
    modelName: { 
      type: String, 
      default: 'gpt-3.5-turbo',
      enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet']
    },
    systemPrompt: { 
      type: String, 
      default: 'You are a helpful Telegram bot assistant. Respond in Arabic unless asked otherwise.' 
    },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 1000, min: 1, max: 4000 },
    personality: { 
      type: String, 
      default: 'helpful',
      enum: ['helpful', 'professional', 'friendly', 'casual', 'custom']
    },
    responseStyle: { 
      type: String, 
      default: 'friendly',
      enum: ['formal', 'casual', 'friendly', 'humorous']
    },
    // ذاكرة المحادثة
    memoryEnabled: { type: Boolean, default: true },
    memoryLength: { type: Number, default: 10 },
    // نماذج AI بديلة
    customEndpoint: String,
    customApiKey: String
  },

  // Pricing - التسعير
  pricing: {
    isPaid: { type: Boolean, default: false },
    pricePerMessage: { type: Number, default: 0.001 },
    pricePerImage: { type: Number, default: 0.01 },
    pricePerVoice: { type: Number, default: 0.005 },
    pricePerApiCall: { type: Number, default: 0.001 },
    currency: { type: String, default: 'USD' },
    requiredPoints: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    freeMessages: { type: Number, default: 100 },
    // خطط الاشتراك
    subscription: {
      enabled: { type: Boolean, default: false },
      monthlyPrice: { type: Number, default: 0 },
      includedMessages: { type: Number, default: 1000 }
    }
  },

  // Chat Settings
  chatSettings: {
    maxHistory: { type: Number, default: 20 },
    language: { 
      type: String, 
      default: 'ar',
      enum: ['ar', 'en', 'es', 'fr', 'ru', 'zh']
    },
    personality: { type: String, default: 'helpful' },
    isEnabled: { type: Boolean, default: true },
    isMuted: { type: Boolean, default: false },
    // ردود الترحيب/وداع
    welcomeMessage: { type: String, default: '' },
    goodbyeMessage: { type: String, default: '' },
    // معالجة الوسائط
    allowImages: { type: Boolean, default: true },
    allowDocuments: { type: Boolean, default: true },
    allowVoice: { type: Boolean, default: true },
    allowVideo: { type: Boolean, default: true },
    // التفاعل
    typingIndicator: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: false }
  },

  // Stats
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    messagesToday: { type: Number, default: 0 },
    messagesThisMonth: { type: Number, default: 0 },
    messagesThisYear: { type: Number, default: 0 },
    // حسب النوع
    imageCount: { type: Number, default: 0 },
    voiceCount: { type: Number, default: 0 },
    commandCount: { type: Number, default: 0 },
    // المستخدمون
    users: [{ type: Number }],
    topUsers: [{ 
      userId: Number,
      messageCount: { type: Number, default: 0 }
    }]
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
  isVerified: {
    type: Boolean,
    default: false
  },

  // Custom Commands
  commands: [{
    name: { type: String, required: true },
    description: String,
    response: { type: String, required: true },
    usageCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
  }],

  // Keywords - الكلمات المفتاحية
  keywords: [{
    trigger: { type: String, required: true },
    response: { type: String, required: true },
    isRegex: { type: Boolean, default: false },
    isCaseSensitive: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false }
  }],

  // Allowed Files
  allowedFiles: {
    images: { type: Boolean, default: true },
    documents: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    video: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 10 } // MB
  },


  // Limits
  limits: {
    messagesPerDay: { type: Number, default: 1000 },
    messagesPerUser: { type: Number, default: 100 },
    maxMessageLength: { type: Number, default: 4000 },
    maxResponsesPerMinute: { type: Number, default: 30 }
  },

  // Webhook
  webhook: {
    url: String,
    events: [String],
    isEnabled: { type: Boolean, default: false },
    secretToken: String
  },

  // Appearance
  appearance: {
    nameColor: { type: String, default: '#FFFFFF' },
    backgroundColor: { type: String, default: '#6366F1' },
    buttonColor: { type: String, default: '#4F46E5' },
    customGreeting: String
  },

  // Advanced
  advanced: {
    // معالجة اللغة الطبيعية
    nlpEnabled: { type: Boolean, default: false },
    // التعلم من المحادثات
    learningEnabled: { type: Boolean, default: false },
    // دمج مع قواعد معرفة
    knowledgeBase: {
      enabled: { type: Boolean, default: false },
      sources: [String]
    }
  },

  // التسويق
  marketing: {
    welcomeNewUsers: { type: Boolean, default: true },
    broadcastEnabled: { type: Boolean, default: false },
    lastBroadcast: Date
  },

  // الفوترة
  billing: {
    stripeCustomerId: String,
    paypalAgreementId: String,
    cryptoAddress: String
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivity: Date
});

//Indexes
botSchema.index({ user: 1, name: 1 });
botSchema.index({ telegramUsername: 1 });
botSchema.index({ isActive: 1 });
botSchema.index({ 'pricing.isPaid': 1 });
botSchema.index({ isPublic: 1 });
botSchema.index({ createdAt: -1 });

// Pre-save
botSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for bot URL
botSchema.virtual('telegramUrl').get(function() {
  return `https://t.me/${this.telegramUsername}`;
});

// Method: Reset daily stats
botSchema.methods.resetDailyStats = async function() {
  this.stats.messagesToday = 0;
  this.stats.imageCount = 0;
  this.stats.voiceCount = 0;
  this.stats.commandCount = 0;
  await this.save();
};

// Method: Increment usage
botSchema.methods.incrementUsage = async function(type, userId) {
  const update = { $inc: {} };
  
  switch(type) {
    case 'message':
      update.$inc['stats.totalMessages'] = 1;
      update.$inc['stats.messagesToday'] = 1;
      update.$inc['stats.messagesThisMonth'] = 1;
      break;
    case 'image':
      update.$inc['stats.imageCount'] = 1;
      break;
    case 'voice':
      update.$inc['stats.voiceCount'] = 1;
      break;
    case 'command':
      update.$inc['stats.commandCount'] = 1;
      break;
  }

  // إضافة المستخدم إذا لم يكن موجوداً
  update.$addToSet = { 'stats.users': userId };
  
  this.lastActivity = new Date();
  update.$set = { lastActivity: new Date() };

  await this.updateOne(update);
};

// Method: Get usage summary
botSchema.methods.getUsageSummary = function() {
  return {
    total: this.stats.totalMessages,
    today: this.stats.messagesToday,
    thisMonth: this.stats.messagesThisMonth,
    users: this.stats.totalUsers,
    images: this.stats.imageCount,
    voice: this.stats.voiceCount,
    commands: this.stats.commandCount
  };
};

module.exports = mongoose.model('Bot', botSchema);