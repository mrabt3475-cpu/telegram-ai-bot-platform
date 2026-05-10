const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telegramBotToken: {
    type: String,
    required: true,
    unique: true
  },
  telegramChatId: {
    type: String
  },
  aiProvider: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'custom'],
    default: 'openai'
  },
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  aiApiKey: {
    type: String
  },
  systemPrompt: {
    type: String,
    default: 'You are a helpful AI assistant in Telegram.'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    maxMessagesPerDay: {
      type: Number,
      default: 100
    },
    responseDelay: {
      type: Number,
      default: 0
    },
    welcomeMessage: {
      type: String,
      default: ''
    },
    fallbackMessage: {
      type: String,
      default: 'Sorry, I did not understand that.'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalUsers: {
      type: Number,
      default: 0
    },
    todayMessages: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  integrations: {
    github: {
      enabled: {
        type: Boolean,
        default: false
      },
      repo: String,
      events: [String]
    },
    discord: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    },
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bot', botSchema);