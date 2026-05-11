const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Cost = require('../models/Cost');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Bot = require('../models/Bot');
const mongoose = require('mongoose');

// لوحة تحكم متقدمة - الإحصائيات
router.get('/dashboard-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);


    // إحصائيات البوتات
    const botsCount = await Bot.countDocuments({ user: userId });
    const activeBots = await Bot.countDocuments({ user: userId, isActive: true });

    // إحصائيات التكاليف
    const [dailyCosts, weeklyCosts, monthlyCosts, totalCosts] = await Promise.all([
      Cost.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Cost.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Cost.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Cost.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // إحصائيات الفواتير
    const pendingInvoices = await Invoice.countDocuments({ user: userId, status: 'pending' });
    const paidInvoices = await Invoice.countDocuments({ user: userId, status: 'paid' });

    // الرصيد
    const user = await User.findById(userId);

    // تكاليف آخر 7 أيام للرسوم البيانية
    const last7Days = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayCosts = await Cost.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: date, $lt: nextDate } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        return {
          date: date.toISOString().split('T')[0],
          amount: dayCosts[0]?.total || 0,
          count: dayCosts[0]?.count || 0
        };
      })
    );

    // أكثر البوتات تكلفة
    const topBots = await Cost.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), bot: { $ne: null } } },
      { $group: { _id: '$bot', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'bots',
          localField: '_id',
          foreignField: '_id',
          as: 'botInfo'
        }
      },
      { $unwind: '$botInfo' },
      { $project: { botName: '$botInfo.name', total: 1, count: 1 } }
    ]);

    // توزيع التكاليف حسب النوع
    const costDistribution = await Cost.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$type', value: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        bots: { total: botsCount, active: activeBots },
        costs: {
          daily: dailyCosts.reduce((sum, c) => sum + c.total, 0),
          weekly: weeklyCosts.reduce((sum, c) => sum + c.total, 0),
          monthly: monthlyCosts.reduce((sum, c) => sum + c.total, 0),
          total: totalCosts[0]?.total || 0,
          byType: monthlyCosts
        },
        invoices: { pending: pendingInvoices, paid: paidInvoices },
        balance: { points: user.points || 0 },
        charts: {
          last7Days,
          costDistribution,
          topBots
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تقارير التكاليف المفصلة
router.get('/costs/report', protect, async (req, res) => {
  try {
    const { startDate, endDate, type, botId, groupBy = 'day' } = req.query;
    const userId = req.user.id;

    const match = { user: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    if (type) match.type = type;
    if (botId) match.bot = new mongoose.Types.ObjectId(botId);


    let groupStage;
    switch (groupBy) {
      case 'hour':
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        };
        break;
      case 'month':
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        };
        break;
      default: // day
        groupStage = {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        };
    }

    const report = await Cost.aggregate([
      { $match: match },
      { $group: groupStage },
      { $sort: { _id: -1 } },
      { $limit: 100 }
    ]);

    // المجموع
    const totals = await Cost.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      report,
      totals: totals[0] || { totalAmount: 0, totalPoints: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تنبيهات الاستخدام
router.get('/alerts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plan = await require('../models/PricingPlan').findOne({ name: user.subscription });
    
    const alerts = [];
    
    // التحقق من الرصيد
    if ((user.points || 0) < 50) {
      alerts.push({
        type: 'warning',
        title: 'Low Balance',
        message: `You only have ${user.points} points remaining. Add more to avoid interruption.`,
        priority: 'high'
      });
    }

    // التحقق من حدود الخطة
    const monthlyCosts = await Cost.countDocuments({
      user: req.user.id,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    const limit = plan?.limits?.messagesPerMonth || 100;
    const usagePercent = (monthlyCosts / limit) * 100;

    if (usagePercent >= 90) {
      alerts.push({
        type: 'danger',
        title: 'Usage Limit Warning',
        message: `You've used ${usagePercent.toFixed(0)}% of your monthly limit.`,
        priority: 'high'
      });
    } else if (usagePercent >= 75) {
      alerts.push({
        type: 'warning',
        title: 'Usage Notice',
        message: `You've used ${usagePercent.toFixed(0)}% of your monthly limit.`,
        priority: 'medium'
      });
    }

    // التحقق من البوتات
    const inactiveBots = await Bot.countDocuments({ user: req.user.id, isActive: false });
    if (inactiveBots > 0) {
      alerts.push({
        type: 'info',
        title: 'Inactive Bots',
        message: `You have ${inactiveBots} inactive bots.`,
        priority: 'low'
      });
    }

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تصدير التقرير
router.get('/costs/export', protect, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    const match = { user: req.user.id };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const costs = await Cost.find(match)
      .populate('bot', 'name')
      .sort({ createdAt: -1 })
      .lean();


    if (format === 'csv') {
      const csv = [
        'Date,Type,Description,Amount,Points,Status,Bot',
        ...costs.map(c => 
          `${new Date(c.createdAt).toISOString()},${c.type},"${c.description || ''}",${c.amount},${c.points},${c.status},${c.bot?.name || ''}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=costs-report.csv');
      return res.send(csv);
    }

    res.json({ success: true, costs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ميزانية المستخدم
router.get('/budget', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const plan = await require('../models/PricingPlan').findOne({ name: user.subscription });
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const monthlySpend = await Cost.aggregate([
      { $match: { user: req.user.id, createdAt: { $gte: startOfMonth }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const budget = plan?.price || 0;
    const spent = monthlySpend[0]?.total || 0;
    const remaining = Math.max(0, budget - spent);
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

    res.json({
      success: true,
      budget: {
        limit: budget,
        spent,
        remaining,
        percentUsed,
        currency: 'USD'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تعيين ميزانية مخصصة
router.post('/budget', protect, async (req, res) => {
  try {
    const { monthlyLimit } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      budget: { monthlyLimit, resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) }
    });

    res.json({ success: true, message: 'Budget updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;