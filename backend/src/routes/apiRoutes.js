const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Bot = require('../models/Bot');
const User = require('../models/User');
const Cost = require('../models/Cost');

// ============ Bot Builder ============

// Generate bot configuration using AI
router.post('/generate-config', protect, async (req, res) => {
  try {
    const { requirements } = req.body;
    const user = await User.findById(req.user.id);
    
    // Use AI to generate config
    const BotGenerator = require('../ai/botGenerator');
    const generator = new BotGenerator(user.aiConfig?.apiKey || process.env.OPENAI_API_KEY);
    
    const config = await generator.generateBotConfig(requirements);
    
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create bot from generated config
router.post('/create-from-config', protect, async (req, res) => {
  try {
    const { config, telegramToken } = req.body;
    
    // Validate Telegram token
    const botInfo = await axios.get(`https://api.telegram.org/bot${telegramToken}/getMe`);
    if (!botInfo.data.ok) {
      return res.status(400).json({ message: 'Invalid Telegram token' });
    }

    const bot = new Bot({
      user: req.user.id,
      name: config.name,
      description: config.description,
      telegramToken,
      telegramUsername: botInfo.data.result.username,
      aiSettings: {
        systemPrompt: config.systemPrompt,
        personality: config.personality,
        responseStyle: config.responseStyle
      }
    });

    await bot.save();
    res.status(201).json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Bot Management ============

// List user's bots
router.get('/', protect, async (req, res) => {
  try {
    const bots = await Bot.find({ user: req.user.id })
      .select('-telegramToken')
      .sort({ createdAt: -1 });
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single bot
router.get('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id })
      .select('-telegramToken');
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create bot manually
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, telegramToken, aiSettings, pricing, chatSettings } = req.body;

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
      aiSettings,
      pricing,
      chatSettings
    });

    await bot.save();
    res.status(201).json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update bot
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, aiSettings, pricing, chatSettings, commands, keywords, isActive, isPublic } = req.body;

    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, description, aiSettings, pricing, chatSettings, commands, keywords, isActive, isPublic },
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

// Delete bot
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

// Get bot stats
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

// ============ Telegram Integration ============

// Set webhook
router.post('/:id/set-webhook', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const webhookUrl = `${process.env.BASE_URL}/api/bots/webhook/${bot.telegramToken}`;
    
    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/setWebhook`, {
      url: webhookUrl
    });

    await Bot.findByIdAndUpdate(bot._id, {
      'webhook.isEnabled': true,
      'webhook.url': webhookUrl
    });

    res.json({ success: true, webhookUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete webhook
router.post('/:id/delete-webhook', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/deleteWebhook`);

    await Bot.findByIdAndUpdate(bot._id, {
      'webhook.isEnabled': false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test bot
router.post('/:id/test', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const { chatId, message } = req.body;
    
    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/sendMessage`, {
      chat_id: chatId,
      text: message || 'Test message from your bot!'
    });

    res.json({ success: true, message: 'Test message sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;