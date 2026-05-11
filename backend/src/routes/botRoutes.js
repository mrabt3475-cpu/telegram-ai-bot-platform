const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bot = require('../models/Bot');
const Cost = require('../models/Cost');
const axios = require('axios');

// قائمة البوتات
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const userId = req.user.id;

    const query = { user: userId };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { telegramUsername: { $regex: search, $options: 'i' } }
      ];
    }

    const bots = await Bot.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Bot.countDocuments(query);

    res.json({
      success: true,
      bots,
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

// إنشاء بوت جديد
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
      aiSettings: aiSettings || {
        systemPrompt: 'You are a helpful Telegram bot assistant.',
        temperature: 0.7,
        maxTokens: 2048
      },
      pricing: pricing || { isFree: true },
      chatSettings: chatSettings || { isEnabled: true }
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
        isPublic,
        updatedAt: new Date()
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
    res.json({ success: true, message: 'Bot deleted successfully' });
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

    // إحصائيات التكلفة
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const costs = await Cost.aggregate([
      { $match: { bot: bot._id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        ...bot.stats,
        monthlyCosts: costs
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تفعيل/تعطيل البوت
router.post('/:id/toggle', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    bot.isActive = !bot.isActive;
    await bot.save();

    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تعيين Webhook
router.post('/:id/webhook', protect, async (req, res) => {
  try {
    const { url, events } = req.body;
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    // تعيين webhook على Telegram
    if (url) {
      const webhookUrl = `${url}?token=${bot.telegramToken}`;
      await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/setWebhook`, {
        url: webhookUrl
      });

      bot.webhook = {
        url,
        events: events || ['message'],
        isEnabled: true
      };
      await bot.save();
    }

    res.json({ success: true, webhook: bot.webhook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف Webhook
router.delete('/:id/webhook', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, user: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/deleteWebhook`);
    
    bot.webhook = { isEnabled: false };
    await bot.save();

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Telegram Bot Handler - يستقبل الرسائل من Telegram
router.post('/telegram/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;
    const update = message || callback_query;
    
    if (!update) return res.ok();

    const chatId = update.from?.id || update.message?.chat?.id;
    const text = message?.text || callback_query?.data;
    const botToken = req.query.token;

    const bot = await Bot.findOne({ telegramToken: botToken });
    if (!bot || !bot.isActive) return res.ok();

    // معالجة الأوامر
    if (text?.startsWith('/')) {
      const command = text.split(' ')[0];
      const botCommand = bot.commands?.find(c => c.name === command);
      
      if (botCommand) {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: chatId,
          text: botCommand.response,
          parse_mode: 'HTML'
        });
        return res.ok();
      }
    }

    // البحث في الكلمات المفتاحية
    const keyword = bot.keywords?.find(k => 
      k.isRegex ? new RegExp(k.trigger, 'i').test(text) : k.trigger.toLowerCase() === text.toLowerCase()
    );
    
    if (keyword) {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: keyword.response,
        parse_mode: 'HTML'
      });
      return res.ok();
    }

    // إرسال للـ AI
    const aiResponse = await getAIResponse(bot, text);
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: aiResponse,
      parse_mode: 'HTML'
    });

    // تسجيل التكلفة
    await Cost.create({
      user: bot.user,
      bot: bot._id,
      type: 'message',
      amount: bot.pricing?.pricePerMessage || 0.001,
      points: 1,
      status: 'pending',
      paymentMethod: 'points'
    });

    // تحديث الإحصائيات
    await Bot.findByIdAndUpdate(bot._id, {
      $inc: { 'stats.totalMessages': 1 }
    });

    res.ok();
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.ok();
  }
});

async function getAIResponse(bot, message) {
  try {
    const User = require('../models/User');
    const user = await User.findById(bot.user);
    const endpoint = user.aiConfig?.endpoint || process.env.AI_MODEL_ENDPOINT;
    const apiKey = user.aiConfig?.apiKey || process.env.AI_MODEL_API_KEY;

    const response = await axios.post(endpoint, {
      messages: [
        { role: 'system', content: bot.aiSettings?.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ],
      temperature: bot.aiSettings?.temperature || 0.7,
      max_tokens: bot.aiSettings?.maxTokens || 2048
    }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      timeout: 30000
    });

    return response.data?.response || response.data?.message || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('AI response error:', error.message);
    return 'Sorry, an error occurred while processing your request.';
  }
}

module.exports = router;