const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'starter', 'pro', 'enterprise', 'vip']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['month', 'year', 'lifetime'],
    default: 'month'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isVip: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // Limits
  limits: {
    bots: { type: Number, default: 1 },
    messagesPerMonth: { type: Number, default: 100 },
    imagesPerMonth: { type: Number, default: 10 },
    storage: { type: Number, default: 100 }, // MB
    apiCalls: { type: Number, default: 1000 },
    usersPerBot: { type: Number, default: 100 },
    customCommands: { type: Number, default: 5 },
    keywords: { type: Number, default: 10 }
  },
  // Features
  features: [String],
  // Overage costs
  overageCosts: {
    message: { type: Number, default: 0.001 },
    image: { type: Number, default: 0.01 },
    voice: { type: Number, default: 0.005 },
    apiCall: { type: Number, default: 0.001 }
  },
  // Support
  supportLevel: {
    type: String,
    enum: ['community', 'email', 'priority', '24/7'],
    default: 'community'
  },
  // Stripe
  stripePriceId: String,
  stripeProductId: String,
  // PayPal
  paypalPlanId: String
}, {
  timestamps: true
});

pricingPlanSchema.index({ order: 1 });
pricingPlanSchema.index({ isPublic: 1 });

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);