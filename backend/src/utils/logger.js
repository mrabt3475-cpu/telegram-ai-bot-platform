const logger = {
  // مستويات التسجيل
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },

  currentLevel: process.env.LOG_LEVEL || 'info',

  // لون الـ console
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  },

  // تسجيل
  log(level, message, meta = {}) {
    const levelNum = this.levels[level] || 4;
    const currentLevelNum = this.levels[this.currentLevel] || 2;

    if (levelNum > currentLevelNum) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };


    // console.log(JSON.stringify(logEntry));
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
  },

  error(message, meta) {
    this.log('error', message, meta);
  },

  warn(message, meta) {
    this.log('warn', message, meta);
  },

  info(message, meta) {
    this.log('info', message, meta);
  },

  http(message, meta) {
    this.log('http', message, meta);
  },

  debug(message, meta) {
    this.log('debug', message, meta);
  }
};

/**
 * Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};

/**
 * Error Logger Middleware
 */
const errorLogger = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};