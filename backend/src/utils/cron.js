const cron = require('node-cron');
const logger = require('./logger');
const Bot = require('../models/Bot');
const Cost = require('../models/Cost');
const User = require('../models/User');


const jobs = {};


// Daily: Reset daily stats
jobs.resetDailyStats = cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Running daily stats reset...');
    await Bot.updateMany({}, { $set: { 'stats.messagesToday': 0 } });
    logger.info('Daily stats reset completed');
  } catch (error) {
    logger.error('Error resetting daily stats:', error);
  }
}, { timezone: 'UTC' });

// Monthly: Reset monthly stats
jobs.resetMonthlyStats = cron.schedule('0 0 1 * *', async () => {
  try {
    logger.info('Running monthly stats reset...');
    await Bot.updateMany({}, { $set: { 'stats.messagesThisMonth': 0 } });
    logger.info('Monthly stats reset completed');
  } catch (error) {
    logger.error('Error resetting monthly stats:', error);
  }
}, { timezone: 'UTC' });

// Hourly: Cleanup old pending costs
jobs.cleanupOldCosts = cron.schedule('0 * * * *', async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Cost.deleteMany({
      status: 'pending',
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} old pending costs`);
    }
  } catch (error) {
    logger.error('Error cleaning up old costs:', error);
  }
});

// Weekly: Send reports
jobs.weeklyReport = cron.schedule('0 9 * * 1', async () => {
  try {
    logger.info('Generating weekly report...');
    const users = await User.find({ 'notificationSettings.weeklyReport': true });
    for (const user of users) {
      logger.info(`Weekly report for user ${user._id}`);
    }
    logger.info('Weekly reports sent');
  } catch (error) {
    logger.error('Error generating weekly report:', error);
  }
}, { timezone: 'UTC' });

// Every 5 min: Check inactive bots
jobs.checkInactiveBots = cron.schedule('*/5 * * * *', async () => {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const inactiveBots = await Bot.find({
      isActive: true,
      lastActivity: { $lt: oneHourAgo }
    });
    
    if (inactiveBots.length > 0) {
      logger.warn(`${inactiveBots.length} bots inactive for >1 hour`);
    }
  } catch (error) {
    logger.error('Error checking inactive bots:', error);
  }
});

cron.start = () => {
  logger.info('Starting cron jobs...');
  Object.values(jobs).forEach(job => job.start());
  logger.info('All cron jobs started');
};

cron.stop = () => {
  logger.info('Stopping cron jobs...');
  Object.values(jobs).forEach(job => job.stop());
  logger.info('All cron jobs stopped');
};

module.exports = cron;