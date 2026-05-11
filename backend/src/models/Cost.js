const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot'
  },
  type: {
    type: String,
    enum: ['message', 'image', 'voice', 'video', 'api_call', 'custom', 'keyword', 'subscription'],
    required: true
  },
  description: {
    type: String,
    maxLength: 500
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  points: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe', 'paypal', 'crypto', 'free'],
    default: 'points'
  },
  externalPaymentId: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For subscriptions
  subscription: {
    plan: String,
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
costSchema.index({ user: 1, createdAt: -1 });
costSchema.index({ user: 1, status: 1 });
costSchema.index({ bot: 1, createdAt: -1 });
costSchema.index({ type: 1 });

// Virtual for formatted amount
costSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(4)}`;
});

// Static: Calculate user spending
costSchema.statics.calculateUserSpending = async function(userId, period = 'month') {
  let startDate = new Date();
  
  switch(period) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0);
      break;
  }
  
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: 'paid',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  return result[0] || { total: 0, count: 0 };
};

// Static: Get user usage by type
costSchema.statics.getUserUsageByType = async function(userId) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: 'paid'
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        points: { $sum: '$points' }
      }
    }
  ]);
};

module.exports = mongoose.model('Cost', costSchema);