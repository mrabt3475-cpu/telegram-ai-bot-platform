const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
require('dotenv').config();

const plans = [
  {
    name: 'free',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    description: 'Perfect for testing and small projects',
    features: [
      '1 Telegram Bot',
      '100 messages/month',
      'Basic AI responses',
      'Community support',
      'Standard response time'
    ],
    limits: {
      bots: 1,
      messagesPerMonth: 100,
      imagesPerMonth: 10,
      storage: 100,
      apiCallsPerDay: 50
    },
    overageCosts: {
      message: 0.002,
      image: 0.02,
      apiCall: 0.002
    },
    isPublic: true,
    order: 1,
    isPopular: false,
    color: '#6B7280'
  },
  {
    name: 'basic',
    price: 9.99,
    currency: 'USD',
    period: 'monthly',
    description: 'For small businesses and hobbyists',
    features: [
      '3 Telegram Bots',
      '5,000 messages/month',
      'Custom AI prompts',
      'Priority support',
      'Analytics dashboard',
      'Basic integrations',
      'Fast response time'
    ],
    limits: {
      bots: 3,
      messagesPerMonth: 5000,
      imagesPerMonth: 100,
      storage: 500,
      apiCallsPerDay: 500
    },
    overageCosts: {
      message: 0.001,
      image: 0.01,
      apiCall: 0.001
    },
    isPublic: true,
    order: 2,
    isPopular: false,
    color: '#3B82F6'
  },
  {
    name: 'premium',
    price: 29.99,
    currency: 'USD',
    period: 'monthly',
    description: 'For growing businesses',
    features: [
      '10 Telegram Bots',
      '50,000 messages/month',
      'Advanced AI settings',
      '24/7 Priority support',
      'Advanced analytics',
      'All integrations',
      'Custom branding',
      'Webhooks',
      'API access',
      'Ultra-fast response'
    ],
    limits: {
      bots: 10,
      messagesPerMonth: 50000,
      imagesPerMonth: 1000,
      storage: 2000,
      apiCallsPerDay: 5000
    },
    overageCosts: {
      message: 0.0005,
      image: 0.005,
      apiCall: 0.0005
    },
    isPublic: true,
    order: 3,
    isPopular: true,
    color: '#8B5CF6'
  },
  {
    name: 'enterprise',
    price: 99.99,
    currency: 'USD',
    period: 'monthly',
    description: 'For large organizations',
    features: [
      'Unlimited Telegram Bots',
      'Unlimited messages',
      'Custom AI model',
      'Dedicated support',
      'Custom analytics',
      'All integrations',
      'White-label',
      'Advanced webhooks',
      'Full API access',
      'SLA guarantee',
      'Dedicated server',
      'Custom contracts'
    ],
    limits: {
      bots: -1,
      messagesPerMonth: -1,
      imagesPerMonth: -1,
      storage: -1,
      apiCallsPerDay: -1
    },
    overageCosts: {
      message: 0,
      image: 0,
      apiCall: 0
    },
    isPublic: true,
    order: 4,
    isPopular: false,
    color: '#F59E0B'
  }
];

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-ai-bot-platform');
    console.log('Connected to MongoDB');

    await PricingPlan.deleteMany({});
    console.log('Cleared existing plans');

    const insertedPlans = await PricingPlan.insertMany(plans);
    console.log(`✅ Seeded ${insertedPlans.length} pricing plans`);
    
    insertedPlans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price}/month`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedPlans();