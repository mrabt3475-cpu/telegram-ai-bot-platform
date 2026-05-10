const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bot = require('../models/Bot');
const axios = require('axios');

// قائمة البوتات
router.get('/', protect, async (req, res) => {
  try {
    const bots = await Bot.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تفاصيل بوت
router.get('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إنشاء بوت
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, telegramToken, aiSettings, pricing, chatSettings } = req.body;

    // التحقق من الـ Token
    const botInfo = await axios.get(`https://api.telegram.org/bot${telegramToken}/getMe`);
    if (!botInfo.data.ok) {
      return res.status(400).json({ message: 'Invalid Telegram token' });
    }

    const bot = new Bot({
      user: req.user.id,
      name,
      description,
      telegramToken,
      telegramUsername: botInfo.data.result.username,
      aiSettings: aiSettings || {},
      pricing: pricing || { isFree: true },
      chatSettings: chatSettings || {}
    });

    await bot.save();
    res.status(201).json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تحديث بوت
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, aiSettings, pricing, chatSettings, commands, keywords, allowedFiles, limits, isActive, isPublic } = req.body;

    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        description,
        aiSettings,
        pricing,
        chatSettings,
        commands,
        keywords,
        allowedFiles,
        limits,
        isActive,
        isPublic
      },
      { new: true }
    );

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف بوت
router.delete('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إحصائيات البوت
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, stats: bot.stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;