const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Cost = require('../models/Cost');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Bot = require('../models/Bot');

// ============ التكاليف ============

// قائمة تكاليف المستخدم
router.get('/costs', protect, async (req, res) => {
  try {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const costs = await Cost.find(query)
      .populate('bot', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Cost.countDocuments(query);

    res.json({
      success: true,
      costs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إضافة تكلفة
router.post('/costs', protect, async (req, res) => {
  try {
    const { type, description, amount, points, botId, metadata } = req.body;

    const cost = new Cost({
      user: req.user.id,
      type,
      description,
      amount,
      points,
      bot: botId,
      metadata
    });

    await cost.save();
    res.status(201).json({ success: true, cost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// احتساب تكلفة الرسالة
router.post('/costs/calculate', protect, async (req, res) => {
  try {
    const { type, botId, messageLength, hasImage } = req.body;
    const user = await User.findById(req.user.id);
    
    // الحصول على خطة التسعير
    const plan = await require('../models/PricingPlan').findOne({ name: user.subscription });
    const overage = plan?.overageCosts || {};

    let cost = 0;
    let points = 0;

    switch (type) {
      case 'message':
        cost = overage.message || 0.001;
        points = Math.ceil(messageLength / 100);
        break;
      case 'image':
        cost = overage.image || 0.01;
        points = 10;
        break;
      case 'api_call':
        cost = overage.apiCall || 0.001;
        points = 1;
        break;
    }

    res.json({ success: true, cost, points, currency: 'USD' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ الفواتير ============

// قائمة الفواتير
router.get('/invoices', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تفاصيل فاتورة
router.get('/invoices/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إنشاء فاتورة
router.post('/invoices', protect, async (req, res) => {
  try {
    const { type, items, notes } = req.body;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal;

    const invoice = new Invoice({
      user: req.user.id,
      type,
      items,
      subtotal,
      total,
      notes,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوم
    });

    await invoice.save();
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ الرصيد (Points) ============

// رصيد المستخدم
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // حساب إجمالي الإنفاق
    const totalSpent = await Cost.aggregate([
      { $match: { user: req.user.id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // تكاليف هذا الشهر
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCosts = await Cost.aggregate([
      { $match: { user: req.user.id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      balance: {
        points: user.points || 0,
        totalSpent: totalSpent[0]?.total || 0,
        monthlyCosts,
        subscription: user.subscription
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إضافة رصيد
router.post('/balance/add', protect, async (req, res) => {
  try {
    const { points, paymentMethod, paymentId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { points: points } },
      { new: true }
    );

    // تسجيل العملية
    const cost = new Cost({
      user: req.user.id,
      type: 'custom',
      description: `Added ${points} points`,
      amount: 0,
      points,
      status: 'paid',
      paymentMethod,
      externalPaymentId: paymentId,
      paidAt: new Date()
    });
    await cost.save();

    res.json({ success: true, points: user.points });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ الخطط ============

// قائمة الخطط
router.get('/plans', async (req, res) => {
  try {
    const plans = await require('../models/PricingPlan').find({ isPublic: true }).sort({ order: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تخصيص خطة
router.post('/plans/custom', protect, async (req, res) => {
  try {
    const { limits, overageCosts, customPrice } = req.body;
    
    // إنشاء طلب تخصيص
    const invoice = new Invoice({
      user: req.user.id,
      type: 'custom',
      items: [{
        description: 'Custom Plan Request',
        quantity: 1,
        unitPrice: customPrice || 0,
        total: customPrice || 0
      }],
      subtotal: customPrice || 0,
      total: customPrice || 0,
      notes: JSON.stringify({ limits, overageCosts }),
      status: 'pending'
    });

    await invoice.save();
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;