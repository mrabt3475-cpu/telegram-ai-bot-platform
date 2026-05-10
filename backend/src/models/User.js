const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
  subscriptionExpiresAt: Date,
  points: { type: Number, default: 0 },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true },
  telegramChatId: String,
  apiKey: String,
  apiRequestsThisMonth: { type: Number, default: 0 },
  apiLimit: { type: Number, default: 1000 },
  usage: {
    messages: { type: Number, default: 0 },
    images: { type: Number, default: 0 },
    apiRequests: { type: Number, default: 0 }
  },
  aiApiKeys: {
    'gpt-4': String,
    'gpt-3.5-turbo': String,
    'claude-3': String,
    'gemini-pro': String,
    dalle: String,
    openai: String
  },
  integrations: {
    github: {
      accessToken: String,
      username: String,
      avatar: String
    },
    discord: {
      accessToken: String,
      username: String,
      avatar: String
    },
    slack: {
      accessToken: String,
      teamId: String,
      teamName: String
    },
    google: {
      accessToken: String,
      refreshToken: String
    },
    telegram: {
      botToken: String,
      botUsername: String,
      botName: String
    },
    whatsapp: {
      phoneNumberId: String,
      accessToken: String
    }
  },
  webhooks: [{
    id: String,
    url: String,
    events: [String],
    createdAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);