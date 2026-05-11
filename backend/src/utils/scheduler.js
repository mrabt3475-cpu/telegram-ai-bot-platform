const cron = require('node-cron');
const User = require('../models/User');
const Bot = require('../models/Bot');
const Cost = require('../models/Cost');
const Invoice = require('../models/Invoice');
const { logger } = require('../utils/logger');

/**
 * Scheduled Tasks - المهام المجدولة
 */
class Scheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    logger.info('Initializing scheduled tasks...');
    
    // Reset daily bot stats - كل يوم في منتصف الليل
    this.dailyStatsReset();

    // Monthly subscription check - كل يوم أول في الشهر
    this.monthlySubscriptionCheck();

    // Cleanup old data - كل أسبوع
    this.weeklyCleanup();


    // Update bot activity - كل ساعة
    this.hourlyActivityUpdate();

    // Generate reports - كل يوم
    this.dailyReportGeneration();

    logger.info('Scheduled tasks initialized');
  }

  /**
   * Reset daily stats for all bots
   */
  dailyStatsReset() {
    const task = cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Resetting daily bot stats...');
        
        await Bot.updateMany({}, {
          $set: { 'stats.messagesToday': 0 }
        });

        logger.info('Daily stats reset completed');
      } catch (error) {
        logger.error('Error resetting daily stats', { error: error.message });
      }
    });

    this.tasks.push(task);
  }

  /**
   * Check and process monthly subscriptions
   */
  monthlySubscriptionCheck() {
    const task = cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('Running monthly subscription check...');
        
        const users = await User.find({ 
          subscription: { $ne: 'free' },
          'subscription.expiresAt': { $lte: new Date() }
        });

        for (const user of users) {
          // إنشاء فاتورة للتجديد
          const invoice = new Invoice({
            user: user._id,
            type: 'subscription',
            items: [{
              description: `Monthly subscription - ${user.subscription}`,
              quantity: 1,
              unitPrice: 0, // TODO: جلب السعر من خطة التسعير
              total: 0
            }],
            subtotal: 0,
            total: 0,
            status: 'pending',
            notes: 'Auto-renewal invoice'
          });

          await invoice.save();
          logger.info(`Created renewal invoice for user ${user._id}`);
        }

        logger.info(`Processed ${users.length} subscription renewals`);
      } catch (error) {
        logger.error('Error in subscription check', { error: error.message });
      }
    });

    this.tasks.push(task);
  }

  /**
   * Cleanup old/unused data
   */
  weeklyCleanup() {
    const task = cron.schedule('0 2 * * 0', async () => {
      try {
        logger.info('Running weekly cleanup...');
        
        // حذف التكاليف القديمة (أقدم من 90 يوم)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const deletedCosts = await Cost.deleteMany({
          createdAt: { $lt: ninetyDaysAgo },
          status: 'paid'
        });


        logger.info(`Deleted ${deletedCosts.deletedCount} old cost records`);

        // حذف الفواتير المدفوعة القديمة (أقدم من سنة)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const deletedInvoices = await Invoice.deleteMany({
          createdAt: { $lt: oneYearAgo },
          status: 'paid'
        });

        logger.info(`Deleted ${deletedInvoices.deletedCount} old invoices`);

        // تعطيل البوتات غير النشطة
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        await Bot.updateMany(
          { lastActivity: { $lt: sixMonthsAgo }, isActive: true },
          { $set: { isActive: false } }
        );

        logger.info('Weekly cleanup completed');
      } catch (error) {
        logger.error('Error in weekly cleanup', { error: error.message });
      }
    });


    this.tasks.push(task);
  }

  /**
   * Update bot activity status hourly
   */
  hourlyActivityUpdate() {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // تحديث حالة النشاط
        await Bot.updateMany(
          { lastActivity: { $lt: oneHourAgo } },
          { $set: { 'stats.isOnline': false } }
        );


        await Bot.updateMany(
          { lastActivity: { $gte: oneHourAgo } },
          { $set: { 'stats.isOnline': true } }
        );
      } catch (error) {
        logger.error('Error in activity update', { error: error.message });
      }
    });

    this.tasks.push(task);
  }

  /**
   * Generate daily reports
   */
  dailyReportGeneration() {
    const task = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('Generating daily reports...');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);


        // إحصائيات الأمس
        const stats = await Cost.aggregate([
          {
            $match: {
              createdAt: { $gte: yesterday, $lt: today }
            }
          },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              total: { $sum: '$amount' }
            }
          }
        ]);

        logger.info('Daily stats:', stats);
        
        // TODO: إرسال التقرير للإدمن
      } catch (error) {
        logger.error('Error generating daily report', { error: error.message });
      }
    });

    this.tasks.push(task);
  }

  /**
   * Stop all tasks
   */
  stopAll() {
    this.tasks.forEach(task => task.stop());
    logger.info('All scheduled tasks stopped');
  }
}

module.exports = new Scheduler();