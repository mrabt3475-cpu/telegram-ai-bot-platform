const express = require('express');
const router = express.Router();
const TelegramBotHandler = require('../bot/telegramHandler');
const Bot = require('../models/Bot');
const User = require('../models/User');
const Cost = require('../models/Cost');
const axios = require('axios');

/**
 * Telegram Webhook - نقطة استقبال التحديثات
 * يستقبل جميع الرسائل من Telegram
 */
router.post('/webhook/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const update = req.body;


    // البحث عن البوت
    const bot = await Bot.findOne({ 
      telegramToken: token,
      isActive: true 
    }).populate('user');

    if (!bot) {
      console.log('Bot not found for token:', token.substring(0, 10) + '...');
      return res.sendStatus(200);
    }

    // جلب إعدادات المستخدم
    const user = await User.findById(bot.user);
    if (!user) {
      return res.sendStatus(200);
    }

    // إنشاء معالج البوت
    const handler = new TelegramBotHandler(bot, user);

    // معالجة التحديث
    await handler.handleUpdate(update);

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200); // Always respond OK to Telegram
  }
});

/**
 * Set Webhook - تعيين الـ Webhook
 */
router.post('/set-webhook/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { webhookUrl } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const url = webhookUrl || `${process.env.BASE_URL}/api/bots/webhook/${bot.telegramToken}`;

    const response = await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/setWebhook`, {
      url,
      max_connections: 100,
      allowed_updates: ['message', 'edited_message', 'callback_query', 'inline_query']
    });

    if (response.data.ok) {
      bot.webhook = {
        url,
        isEnabled: true,
        events: ['message', 'edited_message', 'callback_query']
      };
      await bot.save();

      res.json({ success: true, message: 'Webhook set successfully', url });
    } else {
      res.status(400).json({ message: 'Failed to set webhook', error: response.data });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete Webhook - حذف الـ Webhook
 */
router.post('/delete-webhook/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
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

/**
 * Get Webhook Info - معلومات الـ Webhook
 */
router.get('/webhook-info/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const response = await axios.get(`https://api.telegram.org/bot${bot.telegramToken}/getWebhookInfo`);

    res.json({
      success: true,
      webhook: response.data.result,
      botWebhook: bot.webhook
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Send Message - إرسال رسالة من البوت
 */
router.post('/send-message/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { chatId, text, keyboard } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    };

    if (keyboard) {
      payload.reply_markup = keyboard;
    }

    const response = await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/sendMessage`, payload);


    if (response.data.ok) {
      res.json({ success: true, message: response.data.result });
    } else {
      res.status(400).json({ message: 'Failed to send message', error: response.data });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Test Bot - اختبار البوت
 */
router.post('/test/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { chatId, message } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    // إرسال رسالة اختبار
    const response = await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/sendMessage`, {
      chat_id: chatId,
      text: message || '🧪 رسالة اختبار من بوتك الذكي!'
    });

    if (response.data.ok) {
      res.json({ success: true, message: 'Test message sent!' });
    } else {
      res.status(400).json({ message: 'Failed to send test message' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get Bot Info from Telegram
 */
router.get('/telegram-info/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const response = await axios.get(`https://api.telegram.org/bot${bot.telegramToken}/getMe`);

    res.json({
      success: true,
      info: response.data.result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get Bot Updates
 */
router.get('/updates/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 10 } = req.query;


    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }


    const response = await axios.get(`https://api.telegram.org/bot${bot.telegramToken}/getUpdates?limit=${limit}`);

    res.json({
      success: true,
      updates: response.data.result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Set Bot Commands in Telegram
 */
router.post('/commands/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { commands } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    // تحويل الأوامر لتنسيق Telegram
    const telegramCommands = commands || bot.commands?.map(cmd => ({
      command: cmd.name.replace('/', ''),
      description: cmd.description || cmd.name
    })) || [];

    if (telegramCommands.length > 0) {
      const response = await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/setMyCommands`, {
        commands: telegramCommands
      });


      if (response.data.ok) {
        res.json({ success: true, message: 'Commands set successfully' });
      } else {
        res.status(400).json({ message: 'Failed to set commands' });
      }
    } else {
      res.json({ success: true, message: 'No commands to set' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;