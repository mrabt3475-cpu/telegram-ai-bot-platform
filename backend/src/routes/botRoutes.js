const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Bot = require('../models/Bot');
const Cost = require('../models/Cost');
const User = require('../models/User');

// Telegram Bot Handler - يستقبل الرسائل من Telegram
router.post('/telegram/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;
    const update = message || callback_query;
    
    if (!update) {
      return res.ok();
    }

    const chatId = update.from?.id || update.message?.chat?.id;
    const text = message?.text || callback_query?.data;
    const botToken = req.query.token; // Token من الـ URL

    // البحث عن البوت
    const bot = await Bot.findOne({ telegramToken: botToken });
    if (!bot || !bot.isActive) {
      return res.ok();
    }

    // التحقق من التكلفة
    if (bot.pricing?.isPaid && !bot.pricing?.isFree) {
      const user = await User.findById(bot.user);
      const requiredPoints = bot.pricing.requiredPoints || 10;
      
      if ((user.points || 0) < requiredPoints) {
        await sendTelegramMessage(botToken, chatId, '❌ Insufficient points. Please add points to continue.');
        return res.ok();
      }
    }

    // معالجة الأمر
    if (text?.startsWith('/')) {
      const command = text.split(' ')[0];
      const botCommand = bot.commands.find(c => c.name === command);
      
      if (botCommand) {
        await sendTelegramMessage(botToken, chatId, botCommand.response);
        await recordCost(bot, 'message', 1);
        return res.ok();
      }
    }

    // البحث في الكلمات المفتاحية
    const keyword = bot.keywords.find(k => 
      k.isRegex ? new RegExp(k.trigger, 'i').test(text) : k.trigger.toLowerCase() === text.toLowerCase()
    );
    
    if (keyword) {
      await sendTelegramMessage(botToken, chatId, keyword.response);
      await recordCost(bot, 'message', 1);
      return res.ok();
    }

    // إرسال للـ AI
    const aiResponse = await getAIResponse(bot, text);
    await sendTelegramMessage(botToken, chatId, aiResponse);
    
    // تسجيل التكلفة
    await recordCost(bot, 'message', 1);
    await updateBotStats(bot);

    res.ok();
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.ok();
  }
});

// إرسال رسالة
async function sendTelegramMessage(token, chatId, text, parseMode = 'HTML') {
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: parseMode
    });
  } catch (error) {
    console.error('Send message error:', error.message);
  }
}

// الحصول على رد من AI
async function getAIResponse(bot, message) {
  try {
    const user = await User.findById(bot.user);
    const endpoint = user.aiConfig?.endpoint || process.env.AI_MODEL_ENDPOINT;
    const apiKey = user.aiConfig?.apiKey || process.env.AI_MODEL_API_KEY;

    const response = await axios.post(endpoint, {
      messages: [{
        role: 'system',
        content: bot.aiSettings.systemPrompt
      }, {
        role: 'user',
        content: message
      }],
      temperature: bot.aiSettings.temperature,
      max_tokens: bot.aiSettings.maxTokens
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data?.response || response.data?.message || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('AI response error:', error.message);
    return 'Sorry, an error occurred while processing your request.';
  }
}

// تسجيل التكلفة
async function recordCost(bot, type, amount) {
  try {
    const cost = new Cost({
      user: bot.user,
      bot: bot._id,
      type,
      amount: amount * (bot.pricing?.pricePerMessage || 0.001),
      points: amount,
      status: 'pending',
      paymentMethod: 'points'
    });
    await cost.save();
  } catch (error) {
    console.error('Record cost error:', error.message);
  }
}

// تحديث إحصائيات البوت
async function updateBotStats(bot) {
  await Bot.findByIdAndUpdate(bot._id, {
    $inc: {
      'stats.totalMessages': 1,
      'stats.messagesToday': 1,
      'stats.messagesThisMonth': 1
    }
  });
}

// تعيين Webhook
router.post('/telegram/set-webhook', protect, async (req, res) => {
  try {
    const { botId } = req.body;
    const bot = await Bot.findOne({ _id: botId, user: req.user.id });
    
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    const webhookUrl = `${process.env.BASE_URL}/api/bots/telegram/webhook?token=${bot.telegramToken}`;
    
    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/setWebhook`, {
      url: webhookUrl
    });

    res.json({ success: true, webhookUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف Webhook
router.post('/telegram/delete-webhook', protect, async (req, res) => {
  try {
    const { botId } = req.body;
    const bot = await Bot.findOne({ _id: botId, user: req.user.id });
    
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    await axios.post(`https://api.telegram.org/bot${bot.telegramToken}/deleteWebhook`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;