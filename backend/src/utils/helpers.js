const axios = require('axios');

/**
 * Cache Manager - إدارة التخزين المؤقت
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get value from cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean expired items
   */
  clean() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Response Cache Middleware
 */
const cacheResponse = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cache = global.responseCache || new CacheManager();
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    if (cached) {
      return res.status(200).json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, duration * 1000);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Rate Limiter with Redis-like functionality
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.min(...validRequests) + windowMs - now
      };
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      allowed: true,
      remaining: limit - validRequests.length,
      reset: windowMs
    };
  }

  /**
   * Reset limit for a key
   */
  reset(key) {
    this.requests.delete(key);
  }
}

/**
 * HTTP Client with retry logic
 */
const httpClient = axios.create({
  timeout: 30000,
  retries: 3
});

httpClient.interceptors.response.use(
  null,
  async (error) => {
    const config = error.config;
    
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;
    config.__retryCount += 1;

    // Exponential backoff
    const delay = Math.pow(2, config.__retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return httpClient(config);
  }
);

/**
 * Utility Functions
 */
const utils = {
  // Generate random string
  randomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${this.randomString(8)}`;
  },

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  },

  // Format date
  formatDate(date, locale = 'ar') {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  // Sanitize HTML
  sanitizeHTML(str) {
    return str.replace(/[<>]/g, '');
  },

  // Parse query params
  parseQuery(query) {
    const params = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(value)) params[key] = Number(value);
      else params[key] = value;
    }
    return params;
  },

  // Paginate
  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return { skip, limit: parseInt(limit) };
  }
};

module.exports = {
  CacheManager,
  RateLimiter,
  cacheResponse,
  httpClient,
  utils
};