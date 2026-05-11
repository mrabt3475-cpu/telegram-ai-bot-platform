const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware - حماية المسارات
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // التحقق من الـ Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized, no token provided',
        code: 'NO_TOKEN'
      });
    }

    // التحقق من الـ token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // جلب المستخدم
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ 
          message: 'Not authorized, user not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // التحقق من حالة المستخدم
      if (!user.isActive) {
        return res.status(401).json({ 
          message: 'Account is deactivated',
          code: 'ACCOUNT_DISABLED'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired, please login again',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        message: 'Not authorized, invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

/**
 * Admin Middleware - التحقق من صلاحيات الأدمن
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Not authorized',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied, admin privileges required',
      code: 'NOT_ADMIN'
    });
  }

  next();
};

/**
 * Bot Owner Middleware - التحقق من ملكية البوت
 */
const botOwner = async (req, res, next) => {
  try {
    const Bot = require('../models/Bot');
    const botId = req.params.botId || req.params.id;

    const bot = await Bot.findById(botId);
    
    if (!bot) {
      return res.status(404).json({ 
        message: 'Bot not found',
        code: 'BOT_NOT_FOUND'
      });
    }

    // التحقق من الملكية (أدمن أو مالك البوت)
    if (req.user.role !== 'admin' && bot.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to access this bot',
        code: 'NOT_BOT_OWNER'
      });
    }

    req.bot = bot;
    next();
  } catch (error) {
    console.error('Bot owner middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Subscription Middleware - التحقق من الاشتراك
 */
const requireSubscription = (requiredPlan = 'pro') => {
  const plans = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3
  };

  return (req, res, next) => {
    const userPlan = req.user?.subscription || 'free';
    const userLevel = plans[userPlan] || 0;
    const requiredLevel = plans[requiredPlan] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        message: `This feature requires ${requiredPlan} plan or higher`,
        code: 'INSUFFICIENT_PLAN',
        currentPlan: userPlan,
        requiredPlan
      });
    }

    next();
  };
};

/**
 * Rate Limit Check - التحقق من حدود الاستخدام
 */
const checkRateLimit = async (req, res, next) => {
  try {
    const Cost = require('../models/Cost');
    const User = require('../models/User');
    const PricingPlan = require('../models/PricingPlan');

    const user = await User.findById(req.user._id);
    const plan = await PricingPlan.findOne({ name: user.subscription });

    // التحقق من الرصيد
    if ((user.points || 0) < 1) {
      return res.status(402).json({ 
        message: 'Insufficient points balance',
        code: 'INSUFFICIENT_POINTS',
        balance: user.points
      });
    }

    // التحقق من حد الرسائل الشهرية
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await Cost.countDocuments({
      user: user._id,
      type: 'message',
      createdAt: { $gte: startOfMonth }
    });

    const monthlyLimit = plan?.limits?.messagesPerMonth || 100;
    
    if (monthlyUsage >= monthlyLimit) {
      return res.status(429).json({ 
        message: 'Monthly message limit reached',
        code: 'MONTHLY_LIMIT_REACHED',
        used: monthlyUsage,
        limit: monthlyLimit
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next(); // Allow request if check fails
  }
};

/**
 * API Key Authentication - للمكالمات من أنظمة خارجية
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      message: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }

  // التحقق من صحة الـ API key
  // TODO: التحقق من قاعدة البيانات
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ 
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

/**
 * Webhook Signature Verification
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-telegram-bot-api-secret-token'];
  
  // التحقق من توقيع الـ webhook
  // TODO: تنفيذ التحقق
  next();
};

module.exports = {
  protect,
  admin,
  botOwner,
  requireSubscription,
  checkRateLimit,
  apiKeyAuth,
  verifyWebhookSignature
};