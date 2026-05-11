const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const botRoutes = require('./routes/botRoutes');
const aiRoutes = require('./routes/aiRoutes');
const costRoutes = require('./routes/costRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const telegramRoutes = require('./routes/telegramRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import utilities
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const cron = require('./utils/cron');

const app = express();

// ============ Security Middlewares ============

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Sanitize
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ API Routes ============
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/telegram', telegramRoutes);

// Static Files
app.use('/uploads', express.static('uploads'));


// Root Endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Telegram AI Bot Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bots: '/api/bots',
      ai: '/api/ai',
      costs: '/api/costs',
      analytics: '/api/analytics',
      integrations: '/api/integrations',
      telegram: '/api/telegram'
    }
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error Handler
app.use(errorHandler);

// ============ Server Start ============
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
    
    cron.start();
    logger.info('Cron jobs started');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  cron.stop();
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


startServer();

module.exports = app;