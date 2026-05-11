const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Bot = require('../models/Bot');
const Cost = require('../models/Cost');
const Invoice = require('../models/Invoice');
const PricingPlan = require('../models/PricingPlan');

// لوحة التحكم الرئيسية
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // إحصائيات المستخدم
    const [user, bots, recentCosts, pendingInvoices] = await Promise.all([
      User.findById(userId),
      Bot.find({ user: userId }),
      Cost.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      Invoice.find({ user: userId, status: 'pending' })
    ]);

    // إحصائيات التكاليف
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await Cost.aggregate([
      { $match: { user: userId, createdAt: { $gte: startOfMonth } } },
      { $group: { 
        _id: '$type', 
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        points: { $sum: '$points' }
      }}
    ]);

    // إجمالي كل الوقت
    const totalStats = await Cost.aggregate([
      { $match: { user: userId, status: 'paid' } },
      { $group: { 
        _id: null, 
        totalSpent: { $sum: '$amount' },
        totalMessages: { $sum: { $cond: [{ $eq: ['$type', 'message'] }, 1, 0] } },
        totalImages: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } }
      }}
    ]);

    // إحصائيات البوتات
    const botStats = bots.map(bot => ({
      id: bot._id,
      name: bot.name,
      isActive: bot.isActive,
      messages: bot.stats?.totalMessages || 0,
      users: bot.stats?.totalUsers || 0,
      revenue: bot.stats?.totalRevenue || 0
    }));

    // خطة التسعير
    const plan = await PricingPlan.findOne({ name: user.subscription });

    res.json({
      success: true,
      data: {
        user: {
          username: user.username,
          email: user.email,
          points: user.points || 0,
          subscription: user.subscription,
          referralCode: user.referralCode
        },
        bots: {
          total: bots.length,
          active: bots.filter(b => b.isActive).length,
          list: botStats
        },
        costs: {
          thisMonth: monthlyStats,
          total: totalStats[0] || { totalSpent: 0, totalMessages: 0, totalImages: 0 },
          recent: recentCosts
        },
        invoices: {
          pending: pendingInvoices.length,
          list: pendingInvoices
        },
        plan: plan
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إحصائيات مفصلة للتكاليف
router.get('/costs/analytics', protect, async (req, res) => {
  try {
    const { period = 'month', botId } = req.query;
    const userId = req.user.id;

    let startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    const matchQuery = { user: userId, createdAt: { $gte: startDate } };
    if (botId) matchQuery.bot = botId;

    // التكاليف اليومية
    const dailyCosts = await Cost.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          points: { $sum: '$points' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // التكاليف حسب النوع
    const typeCosts = await Cost.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          points: { $sum: '$points' }
        }
      }
    ]);

    // أعلى التكاليف
    const topCosts = await Cost.find(matchQuery)
      .sort({ amount: -1 })
      .limit(10)
      .populate('bot', 'name');

    // مقارنة مع الفترة السابقة
    const prevStartDate = new Date(startDate);
    if (period === 'day') prevStartDate.setDate(prevStartDate.getDate() - 1);
    else if (period === 'week') prevStartDate.setDate(prevStartDate.getDate() - 7);
    else if (period === 'month') prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    else if (period === 'year') prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);

    const prevPeriodCosts = await Cost.aggregate([
      { $match: { user: userId, createdAt: { $gte: prevStartDate, $lt: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentPeriodTotal = dailyCosts.reduce((sum, d) => sum + d.total, 0);
    const previousPeriodTotal = prevPeriodCosts[0]?.total || 0;
    const changePercent = previousPeriodTotal > 0 
      ? ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        period,
        daily: dailyCosts,
        byType: typeCosts,
        topCosts,
        summary: {
          currentPeriod: currentPeriodTotal,
          previousPeriod: previousPeriodTotal,
          change: changePercent,
          currency: 'USD'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إحصائيات البوتات
router.get('/bots/analytics', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const bots = await Bot.find({ user: userId });

    // إحصائيات كل بوت
    const botAnalytics = await Promise.all(bots.map(async (bot) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyMessages = await Cost.countDocuments({
        bot: bot._id,
        type: 'message',
        createdAt: { $gte: startOfMonth }
      });

      return {
        id: bot._id,
        name: bot.name,
        username: bot.telegramUsername,
        isActive: bot.isActive,
        stats: {
          totalMessages: bot.stats?.totalMessages || 0,
          totalUsers: bot.stats?.totalUsers || 0,
          totalRevenue: bot.stats?.totalRevenue || 0,
          messagesThisMonth: monthlyMessages,
          avgResponseTime: bot.stats?.avgResponseTime || 0
        },
        pricing: bot.pricing
      };
    }));

    // إجمالي الإحصائيات
    const totalStats = botAnalytics.reduce((acc, bot) => ({
      messages: acc.messages + bot.stats.totalMessages,
      users: acc.users + bot.stats.totalUsers,
      revenue: acc.revenue + bot.stats.totalRevenue
    }), { messages: 0, users: 0, revenue: 0 });

    res.json({
      success: true,
      data: {
        bots: botAnalytics,
        total: totalStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تقارير الإيرادات
router.get('/revenue', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    // الإيرادات من الفواتير المدفوعة
    const revenue = await Invoice.aggregate([
      { 
        $match: { 
          user: userId, 
          status: 'paid',
          paidAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // الإيرادات حسب النوع
    const byType = await Invoice.aggregate([
      { $match: { user: userId, status: 'paid', paidAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // إجمالي الإيرادات
    const totalRevenue = revenue.reduce((sum, r) => sum + r.total, 0);

    res.json({
      success: true,
      data: {
        period,
        revenue,
        byType,
        total: totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تنبيهات الاستخدام
router.get('/alerts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plan = await PricingPlan.findOne({ name: user.subscription });
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await Cost.aggregate([
      { $match: { user: user._id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const alerts = [];
    
    // التحقق من حد الرسائل
    const messageUsage = usage.find(u => u._id === 'message')?.count || 0;
    const messageLimit = plan?.limits?.messagesPerMonth || 100;
    const messagePercent = (messageUsage / messageLimit) * 100;
    
    if (messagePercent >= 90) {
      alerts.push({
        type: 'danger',
        title: 'اقتربت من حد الرسائل',
        message: `استخدمت ${messageUsage} من ${messageLimit} رسالة (${messagePercent.toFixed(0)}%)`
      });
    } else if (messagePercent >= 75) {
      alerts.push({
        type: 'warning',
        title: 'تحذير: استخدام عالي',
        message: `استخدمت ${messageUsage} من ${messageLimit} رسالة (${messagePercent.toFixed(0)}%)`
      });
    }

    // التحقق من الرصيد
    if ((user.points || 0) < 10) {
      alerts.push({
        type: 'warning',
        title: 'رصيد منخفض',
        message: `رصيدك ${user.points} نقاط فقط. فكر في إضافة رصيد.`
      });
    }

    // التحقق من البوتات
    const bots = await Bot.find({ user: user._id });
    const activeBots = bots.filter(b => b.isActive).length;
    const botLimit = plan?.limits?.bots || 1;
    
    if (activeBots >= botLimit) {
      alerts.push({
        type: 'info',
        title: 'حد البوتات',
        message: `لديك ${activeBots} من ${botLimit} بوتات نشطة`
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        usage: {
          messages: messageUsage,
          limit: messageLimit,
          percent: messagePercent.toFixed(0)
        },
        points: user.points || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;