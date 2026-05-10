const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const INTEGRATION_CONFIG = {
  telegram: {
    apiBase: 'https://api.telegram.org/bot'
  }
};

// إعداد بوت Telegram
router.post('/telegram/setup', protect, async (req, res) => {
  try {
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({ message: 'Bot token required' });
    }

    // التحقق من صلاحية الـ Token
    const botInfo = await axios.get(`${INTEGRATION_CONFIG.telegram.apiBase}${botToken}/getMe`);
    
    if (!botInfo.data.ok) {
      return res.status(400).json({ message: 'Invalid bot token' });
    }

    const bot = botInfo.data.result;

    // حفظ في قاعدة البيانات
    await User.findByIdAndUpdate(req.user.id, {
      'integrations.telegram': {
        botToken,
        botUsername: bot.username,
        botName: bot.first_name,
        isActive: true,
        connectedAt: new Date()
      }
    });

    res.json({
      success: true,
      bot: {
        id: bot.id,
        name: bot.first_name,
        username: bot.username
      }
    });

  } catch (error) {
    console.error('Telegram setup error:', error.message);
    res.status(500).json({ message: 'Failed to setup Telegram bot' });
  }
});

// إرسال رسالة عبر Telegram
router.post('/telegram/send', protect, async (req, res) => {
  try {
    const { chatId, message, parseMode } = req.body;
    const user = await User.findById(req.user.id);
    const telegram = user.integrations?.telegram;

    if (!telegram?.botToken) {
      return res.status(400).json({ message: 'Telegram bot not configured' });
    }

    if (!chatId || !message) {
      return res.status(400).json({ message: 'chatId and message required' });
    }

    const response = await axios.post(
      `${INTEGRATION_CONFIG.telegram.apiBase}${telegram.botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode || 'HTML'
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.description);
    }

    res.json({
      success: true,
      messageId: response.data.result.message_id,
      sentAt: new Date()
    });

  } catch (error) {
    console.error('Telegram send error:', error.message);
    res.status(500).json({ message: error.response?.data?.description || 'Failed to send message' });
  }
});

// إرسال صورة عبر Telegram
router.post('/telegram/sendPhoto', protect, async (req, res) => {
  try {
    const { chatId, photo, caption } = req.body;
    const user = await User.findById(req.user.id);
    const telegram = user.integrations?.telegram;

    if (!telegram?.botToken) {
      return res.status(400).json({ message: 'Telegram bot not configured' });
    }

    const response = await axios.post(
      `${INTEGRATION_CONFIG.telegram.apiBase}${telegram.botToken}/sendPhoto`,
      {
        chat_id: chatId,
        photo,
        caption
      }
    );

    res.json({ success: true, messageId: response.data.result.message_id });

  } catch (error) {
    res.status(500).json({ message: 'Failed to send photo' });
  }
});

// حذف التكامل
router.delete('/telegram', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { 'integrations.telegram': 1 }
    });

    res.json({ success: true, message: 'Telegram bot disconnected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhooks
router.post('/webhooks', protect, async (req, res) => {
  try {
    const { url, events } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Webhook URL required' });
    }

    const webhook = {
      id: `wh_${Date.now()}`,
      url,
      events: events || ['bot.message'],
      createdAt: new Date()
    };

    await User.findByIdAndUpdate(req.user.id, {
      $push: { webhooks: webhook }
    });

    res.json({ success: true, webhook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/webhooks', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, webhooks: user.webhooks || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/webhooks/:id', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { webhooks: { id: req.params.id } }
    });
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;