const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Payment Gateway Manager - بوابات الدفع
 */
class PaymentGateway {
  constructor() {
    this.gateways = {};
  }

  /**
   * Initialize gateway
   */
  async init(gateway, config) {
    switch (gateway) {
      case 'stripe':
        this.gateways.stripe = await this.initStripe(config);
        break;
      case 'paypal':
        this.gateways.paypal = await this.initPayPal(config);
        break;
      case 'crypto':
        this.gateways.crypto = await this.initCrypto(config);
        break;
      default:
        throw new Error(`Unknown gateway: ${gateway}`);
    }
  }

  async initStripe(config) {
    const stripe = require('stripe')(config.secretKey);
    return {
      name: 'stripe',
      stripe,
      createPaymentIntent: async (amount, currency, metadata) => {
        return await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency,
          metadata
        });
      },
      confirmPayment: async (paymentIntentId) => {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
      },
      createCustomer: async (email, name) => {
        return await stripe.customers.create({ email, name });
      }
    };
  }

  async initPayPal(config) {
    return {
      name: 'paypal',
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      createOrder: async (amount, currency) => {
        // TODO: تنفيذ إنشاء طلب PayPal
        return { id: uuidv4(), status: 'created' };
      },
      captureOrder: async (orderId) => {
        return { id: orderId, status: 'completed' };
      }
    };
  }

  async initCrypto(config) {
    return {
      name: 'crypto',
      wallets: config.wallets || {},
      generateAddress: async (currency) => {
        // TODO: توليد عنوان محفظة
        return { address: uuidv4(), currency };
      },
      verifyPayment: async (address, amount) => {
        return { confirmed: true, amount };
      }
    };
  }

  /**
   * Process payment
   */
  async processPayment(gateway, amount, currency, user, metadata) {
    const gw = this.gateways[gateway];
    if (!gw) {
      throw new Error(`Gateway ${gateway} not initialized`);
    }

    switch (gateway) {
      case 'stripe':
        return await gw.createPaymentIntent(amount, currency, {
          userId: user._id.toString(),
          ...metadata
        });
      case 'paypal':
        return await gw.createOrder(amount, currency);
      case 'crypto':
        return await gw.generateAddress(currency);
      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(gateway, paymentId) {
    const gw = this.gateways[gateway];
    if (!gw) {
      throw new Error(`Gateway ${gateway} not initialized`);
    }

    switch (gateway) {
      case 'stripe':
        return await gw.confirmPayment(paymentId);
      case 'paypal':
        return await gw.captureOrder(paymentId);
      default:
        return { verified: true };
    }
  }
}

/**
 * Points System - نظام النقاط
 */
class PointsSystem {
  constructor() {
    this.rates = {
      message: 1,
      image: 10,
      voice: 5,
      api_call: 1,
      video: 20
    };
  }

  /**
   * Calculate cost for operation
   */
  calculateCost(type, options = {}) {
    const baseRate = this.rates[type] || 1;
    let multiplier = 1;

    // تعديل حسب الخيارات
    if (options.length) {
      multiplier = Math.ceil(options.length / 100);
    }

    return {
      points: baseRate * multiplier,
      type,
      description: this.getDescription(type)
    };
  }

  getDescription(type) {
    const descriptions = {
      message: 'رسالة نصية',
      image: 'صورة مولدة',
      voice: 'صوت مولد',
      api_call: 'استدعاء API',
      video: 'فيديو مولد'
    };
    return descriptions[type] || 'عملية عامة';
  }

  /**
   * Convert points to currency
   */
  pointsToCurrency(points, rate = 0.01) {
    return points * rate;
  }

  /**
   * Convert currency to points
   */
  currencyToPoints(amount, rate = 0.01) {
    return Math.ceil(amount / rate);
  }

  /**
   * Get package prices
   */
  getPackages() {
    return [
      { points: 100, price: 1, bonus: 0 },
      { points: 500, price: 5, bonus: 25 },
      { points: 1000, price: 10, bonus: 100 },
      { points: 5000, price: 50, bonus: 500 },
      { points: 10000, price: 100, bonus: 1500 }
    ];
  }
}

/**
 * Subscription Manager - إدارة الاشتراكات
 */
class SubscriptionManager {
  constructor() {
    this.plans = {
      free: {
        name: 'Free',
        price: 0,
        limits: {
          bots: 1,
          messagesPerMonth: 100,
          aiCallsPerDay: 10,
          storage: 100 // MB
        }
      },
      starter: {
        name: 'Starter',
        price: 9.99,
        limits: {
          bots: 3,
          messagesPerMonth: 1000,
          aiCallsPerDay: 100,
          storage: 1000
        }
      },
      pro: {
        name: 'Pro',
        price: 29.99,
        limits: {
          bots: 10,
          messagesPerMonth: 10000,
          aiCallsPerDay: 1000,
          storage: 10000
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 99.99,
        limits: {
          bots: -1, // unlimited
          messagesPerMonth: -1,
          aiCallsPerDay: -1,
          storage: -1
        }
      }
    };
  }

  /**
   * Get plan details
   */
  getPlan(planName) {
    return this.plans[planName.toLowerCase()] || this.plans.free;
  }

  /**
   * Check if user can access feature
   */
  canAccess(userPlan, feature) {
    const plan = this.getPlan(userPlan);
    const limits = plan.limits;

    switch (feature) {
      case 'unlimited_bots':
        return plan.name === 'Enterprise';
      case 'api_access':
        return plan.name !== 'Free';
      case 'custom_ai':
        return plan.name === 'Pro' || plan.name === 'Enterprise';
      case 'analytics':
        return plan.name !== 'Free';
      case 'priority_support':
        return plan.name === 'Enterprise';
      default:
        return true;
    }
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(used, limit) {
    if (limit === -1) return 0;
    return Math.round((used / limit) * 100);
  }

  /**
   * Check if limit exceeded
   */
  isLimitExceeded(used, limit) {
    if (limit === -1) return false;
    return used >= limit;
  }
}

module.exports = {
  PaymentGateway,
  PointsSystem,
  SubscriptionManager
};