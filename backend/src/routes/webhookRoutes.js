const express = require('express');
const router = express.Router();
const axios = require('axios');
const Bot = require('../models/Bot');
const User = require('../models/User');
const Cost = require('../models/Cost');

// Telegram Webhook Handler
router.post('/webhook/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { message, callback_query, edited_message } = req.body;
    
    const update = message || callback_query || edited_message;
    if (!update) {
      return res.sendStatus(200);
    }

    const chatId = update.from?.id || update.message?.chat?.id;
    const text = message?.text || callback_query?.data;
    const userId = update.from?.id;

    // Find bot
    const bot = await Bot.findOne({ telegramToken: token });
    if (!bot || !bot.isActive) {
      return res.sendStatus(200);
    }

    // Check if bot is muted
    if (bot.chatSettings?.isMuted) {
      return res.sendStatus(200);
    }

    // Process command
    if (text?.startsWith('/')) {
      const command = text.split(' ')[0];
      const botCommand = bot.commands?.find(c => c.name === command);
      
      if (botCommand) {
        await sendMessage(token, chatId, botCommand.response);
        await recordCost(bot, 'message', 1);
        return res.sendStatus(200);
      }
    }

    // Check keywords
    const keyword = bot.keywords?.find(k => 
      k.isRegex 
        ? new RegExp(k.trigger, 'i').test(text)
        : k.trigger.toLowerCase() === text?.toLowerCase()
    );
    
    if (keyword) {
      await sendMessage(token, chatId, keyword.response);
      await recordCost(bot, 'message', 1);
      return res.sendStatus(200);
    }

    // Get AI response
    const user = await User.findById(bot.user);
    const aiResponse = await getAIResponse(bot, text, user);
    
    await sendMessage(token, chatId, aiResponse);
    await recordCost(bot, 'message', 1);
    await updateBotStats(bot);

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(200);
  }
});

// Send message to Telegram
async function sendMessage(token, chatId, text, parseMode = 'HTML') {
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

// Get AI response
async function getAIResponse(bot, message, user) {
  try {
    const endpoint = user.aiConfig?.endpoint || process.env.AI_MODEL_ENDPOINT;
    const apiKey = user.aiConfig?.apiKey || process.env.AI_MODEL_API_KEY;
    const model = bot.aiSettings?.modelName || 'gpt-3.5-turbo';

    const response = await axios.post(endpoint || 'https://api.openai.com/v1/chat/completions', {
      model,
      messages: [
        { role: 'system', content: bot.aiSettings?.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ],
      temperature: bot.aiSettings?.temperature || 0.7,
      max_tokens: bot.aiSettings?.maxTokens || 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.data?.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('AI response error:', error.message);
    return 'Sorry, an error occurred while processing your request.';
  }
}

// Record cost
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

// Update bot stats
async function updateBotStats(bot) {
  await Bot.findByIdAndUpdate(bot._id, {
    $inc: {
      'stats.totalMessages': 1,
      'stats.messagesToday': 1,
      'stats.messagesThisMonth': 1
    }
  });
}

module.exports = router;