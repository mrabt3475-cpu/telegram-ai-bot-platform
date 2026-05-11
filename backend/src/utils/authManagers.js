const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * JWT Token Manager - إدارة الرموز
 */
class TokenManager {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    this.expireTime = '15m';
    this.refreshExpireTime = '7d';
  }

  /**
   * Generate access token
   */
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expireTime
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user._id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpireTime
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

/**
 * Password Manager - إدارة كلمات المرور
 */
class PasswordManager {
  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = await crypto.randomBytes(16).toString('hex');
    const hash = await crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  async verifyPassword(password, storedPassword) {
    const [salt, hash] = storedPassword.split(':');
    const verifyHash = await crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Generate random password
   */
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const values = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }
    return password;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      valid: score >= 4,
      score,
      checks,
      strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
  }
}

/**
 * Email Manager - إدارة البريد
 */
class EmailManager {
  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@example.com';
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text) {
    // TODO: تنفيذ إرسال البريد
    console.log(`Sending email to ${to}: ${subject}`);
    return { success: true, messageId: crypto.randomUUID() };
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user, token) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${url}">Verify Email</a>
    `;
    return this.sendEmail(user.email, 'Verify your email', html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, token) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;
    return this.sendEmail(user.email, 'Reset your password', html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to Telegram AI Bot Platform!</h1>
      <p>Hi ${user.username},</p>
      <p>Thank you for joining us. Start creating your first bot!</p>
    `;
    return this.sendEmail(user.email, 'Welcome!', html);
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(user, invoice) {
    const html = `
      <h1>New Invoice</h1>
      <p>Invoice #${invoice.invoiceNumber}</p>
      <p>Total: $${invoice.total}</p>
    `;
    return this.sendEmail(user.email, `Invoice #${invoice.invoiceNumber}`, html);
  }
}

/**
 * Notification Manager - إدارة الإشعارات
 */
class NotificationManager {
  constructor() {
    this.channels = ['email', 'telegram', 'push'];
  }

  /**
   * Send notification
   */
  async notify(userId, type, message, channels = ['email']) {
    const results = {};

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            results[channel] = await this.sendEmailNotification(userId, message);
            break;
          case 'telegram':
            results[channel] = await this.sendTelegramNotification(userId, message);
            break;
          case 'push':
            results[channel] = await this.sendPushNotification(userId, message);
            break;
        }
      } catch (error) {
        results[channel] = { success: false, error: error.message };
      }
    }

    return results;
  }

  async sendEmailNotification(userId, message) {
    console.log(`Sending email notification to user ${userId}`);
    return { success: true };
  }

  async sendTelegramNotification(userId, message) {
    console.log(`Sending telegram notification to user ${userId}`);
    return { success: true };
  }

  async sendPushNotification(userId, message) {
    console.log(`Sending push notification to user ${userId}`);
    return { success: true };
  }

  /**
   * Notify about usage limits
   */
  async notifyUsageLimit(user, usage, limit) {
    const percentage = (usage / limit) * 100;
    
    if (percentage >= 90) {
      await this.notify(user._id, 'usage_warning', 
        `You have used ${usage} out of ${limit} messages (${percentage.toFixed(0)}%)`,
        ['email', 'telegram']
      );
    }
  }

  /**
   * Notify about payment
   */
  async notifyPayment(user, amount, method) {
    await this.notify(user._id, 'payment',
      `Payment of $${amount} received via ${method}`,
      ['email']
    );
  }
}

module.exports = {
  TokenManager,
  PasswordManager,
  EmailManager,
  NotificationManager
};