const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');


const protect = async (req, res, next) => {
  try {
    let token;


    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }


      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const botOwner = async (req, res, next) => {
  try {
    const Bot = require('../models/Bot');
    const botId = req.params.id || req.params.botId;

    if (!botId) {
      return res.status(400).json({
        success: false,
        message: 'Bot ID required'
      });
    }

    const bot = await Bot.findById(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    if (bot.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this bot'
      });
    }

    req.bot = bot;
    next();
  } catch (error) {
    logger.error('Bot owner middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests'
  } = options;

  const rateLimit = require('express-rate-limit')({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false
  });

  return rateLimit;
};

const checkSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    const allowedPlans = ['pro', 'enterprise'];
    
    if (!allowedPlans.includes(user.subscription) && user.subscription !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Pro subscription required for this feature',
        upgradeUrl: '/pricing'
      });
    }

    next();
  } catch (error) {
    logger.error('Check subscription middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  protect,
  admin,
  botOwner,
  createRateLimiter,
  checkSubscription
};