const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'subscription', 'referral', 'points'],
    required: true
  },
  method: {
    type: String,
    enum: ['stripe', 'binance', 'usdt', 'paypal', 'referral', 'system'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  transactionHash: {
    type: String
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise']
  },
  description: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);