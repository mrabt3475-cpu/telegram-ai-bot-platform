const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

/**
 * Telegram Bot Handler - معالج البوت المدمج
 * يح，处理 الرسائل والردود الذكية
 */
class TelegramBotHandler {
  constructor(botConfig, userConfig) {
    this.bot = botConfig;
    this.user = userConfig;
    this.token = botConfig.telegramToken;
    
    // تهيئة AI
    if (userConfig.aiConfig?.apiKey) {
      this.openai = new OpenAIApi(
        new Configuration({ apiKey: userConfig.aiConfig.apiKey })
      );
    }
    
    // ذاكرة المحادثة
    this.conversations = new Map(); // chatId -> messages[]
  }

  // معالجة التحديث القادم من Telegram
  async handleUpdate(update) {
    try {
      const message = update.message || update.edited_message || update.callback_query?.message;
      if (!message) return { ok: true };

      const chatId = message.chat.id;
      const userId = message.from?.id;
      const text = message.text || update.callback_query?.data;

      // التحقق من البوت
      if (!this.bot.isActive) {
        return { ok: true };
      }

      // التحقق من حالة الكتم
      if (this.bot.chatSettings?.isMuted) {
        return { ok: true };
      }

      // معالجة الـ callback query
      if (update.callback_query) {
        return await this.handleCallback(update.callback_query);
      }

      // معالجة الأوامر
      if (text?.startsWith('/')) {
        return await this.handleCommand(text, chatId, message);
      }

      // البحث في الكلمات المفتاحية
      const keywordResponse = await this.checkKeywords(text, chatId);
      if (keywordResponse) {
        return await this.sendMessage(chatId, keywordResponse);
      }

      // التحقق من الحدود
      const limitCheck = await this.checkLimits(userId);
      if (!limitCheck.allowed) {
        return await this.sendMessage(chatId, limitCheck.message);
      }

      // إرسال للـ AI
      const aiResponse = await this.getAIResponse(text, chatId);
      await this.sendMessage(chatId, aiResponse);

      // تسجيل التكلفة
      await this.recordCost('message', 1);

      // تحديث الإحصائيات
      await this.updateStats(userId);

      return { ok: true };
    } catch (error) {
      console.error('Bot handler error:', error);
      return { ok: false, error: error.message };
    }
  }

  // معالجة الأوامر
  async handleCommand(command, chatId, message) {
    const cmd = command.split(' ')[0];
    const args = command.split(' ').slice(1);

    // أوامر内置ية
    switch (cmd) {
      case '/start':
        return await this.sendMessage(chatId, 
          `مرحباً! 👋\n\n${this.bot.description || 'أنا بوت ذكي مساعدك.'}\n\n` +
          `استخدم /help لرؤية الأوامر المتاحة.`
        );

      case '/help':
        return await this.sendMessage(chatId, this.getHelpText());

      case '/settings':
        return await this.sendSettings(chatId);

      case '/stats':
        return await this.sendStats(chatId, message.from.id);

      case '/balance':
        return await this.sendBalance(chatId, message.from.id);

      case '/language':
        return await this.handleLanguage(args[0], chatId);

      default:
        // البحث في الأوامر المخصصة
        const customCmd = this.bot.commands?.find(c => c.name === cmd);
        if (customCmd) {
          return await this.sendMessage(chatId, customCmd.response);
        }
        return await this.sendMessage(chatId, `الأمر ${cmd} غير معروف. استخدم /help.`);
    }
  }

  // معالجة callback query
  async handleCallback(callback) {
    const chatId = callback.message.chat.id;
    const data = callback.data;
    const userId = callback.from.id;

    // معالجة إجراءات الأزرار
    if (data.startsWith('lang_')) {
      const lang = data.replace('lang_', '');
      return await this.handleLanguage(lang, chatId);
    }

    if (data === 'settings') {
      return await this.sendSettings(chatId);
    }

    if (data === 'stats') {
      return await this.sendStats(chatId, userId);
    }

    return { ok: true };
  }

  // البحث في الكلمات المفتاحية
  async checkKeywords(text, chatId) {
    if (!text || !this.bot.keywords?.length) return null;

    for (const keyword of this.bot.keywords) {
      let matched = false;
      
      if (keyword.isRegex) {
        try {
          const regex = new RegExp(keyword.trigger, 'i');
          matched = regex.test(text);
        } catch (e) {
          console.error('Regex error:', e);
        }
      } else {
        matched = keyword.trigger.toLowerCase() === text.toLowerCase();
      }

      if (matched) {
        // تسجيل استخدام الكلمة المفتاحية
        await this.recordCost('keyword', 1);
        return keyword.response;
      }
    }

    return null;
  }

  // الحصول على رد AI
  async getAIResponse(prompt, chatId) {
    try {
      // الحصول على سجل المحادثة
      const history = this.conversations.get(chatId) || [];
      const maxHistory = this.bot.chatSettings?.maxHistory || 10;

      // بناء الرسائل
      const messages = [
        { role: 'system', content: this.bot.aiSettings?.systemPrompt || 'You are a helpful assistant.' }
      ];

      // إضافة سجل المحادثة
      messages.push(...history.slice(-maxHistory));
      messages.push({ role: 'user', content: prompt });


      // استدعاء AI
      if (this.openai) {
        const completion = await this.openai.createChatCompletion({
          model: this.bot.aiSettings?.modelName || 'gpt-3.5-turbo',
          messages,
          temperature: this.bot.aiSettings?.temperature || 0.7,
          max_tokens: this.bot.aiSettings?.maxTokens || 1000
        });

        const response = completion.data.choices[0].message.content;

        // حفظ في سجل المحادثة
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'assistant', content: response });
        this.conversations.set(chatId, history);

        return response;
      }

      // fallback - رد بسيط
      return 'شكراً لرسالتك! سأرد عليك قريباً.';
    } catch (error) {
      console.error('AI response error:', error.message);
      return 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.';
    }
  }

  // التحقق من الحدود
  async checkLimits(userId) {
    const limits = this.bot.limits || {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // TODO: جلب من قاعدة البيانات
    // هذا مجرد نموذج
    const userMessagesToday = 0;

    if (limits.messagesPerUser) {
      if (userMessagesToday >= limits.messagesPerUser) {
        return {
          allowed: false,
          message: 'عذراً، لقد reached حد الرسائل اليومية. حاول غداً أو تواصل مع المالك.'
        };
      }
    }

    return { allowed: true };
  }

  // تسجيل التكلفة
  async recordCost(type, amount) {
    try {
      const Cost = require('../models/Cost');
      
      await Cost.create({
        user: this.bot.user,
        bot: this.bot._id,
        type,
        amount: amount * (this.bot.pricing?.pricePerMessage || 0.001),
        points: amount,
        status: 'pending',
        paymentMethod: 'points'
      });
    } catch (error) {
      console.error('Record cost error:', error);
    }
  }

  // تحديث الإحصائيات
  async updateStats(userId) {
    try {
      const Bot = require('../models/Bot');
      
      await Bot.findByIdAndUpdate(this.bot._id, {
        $inc: {
          'stats.totalMessages': 1,
          'stats.messagesToday': 1,
          'stats.messagesThisMonth': 1
        },
        $addToSet: { 'stats.users': userId }
      });
    } catch (error) {
      console.error('Update stats error:', error);
    }
  }

  // إرسال رسالة
  async sendMessage(chatId, text, keyboard = null) {
    try {
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      };

      if (keyboard) {
        payload.reply_markup = keyboard;
      }

      await axios.post(`https://api.telegram.org/bot${this.token}/sendMessage`, payload);
      return { ok: true };
    } catch (error) {
      console.error('Send message error:', error.message);
      return { ok: false, error: error.message };
    }
  }

  // إرسال لوحة الإعدادات
  async sendSettings(chatId) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔤 اللغة', callback_data: 'lang_ar' },
          { text: '🔔 الإشعارات', callback_data: 'notif_on' }
        ],
        [
          { text: '📊 الإحصائيات', callback_data: 'stats' },
          { text: '⚙️ إعدادات AI', callback_data: 'ai_settings' }
        ],
        [
          { text: '🔙 رجوع', callback_data: 'back' }
        ]
      ]
    };

    const text = `⚙️ *إعدادات البوت*\n\n` +
      `• اللغة: ${this.bot.chatSettings?.language || 'العربية'}\n` +
      `• الشخصية: ${this.bot.aiSettings?.personality || 'مhelpful'}\n` +
      `• درجة الحرارة: ${this.bot.aiSettings?.temperature || 0.7}\n` +
      `• الحد الأقصى: ${this.bot.aiSettings?.maxTokens || 1000} حرف`;

    return await this.sendMessage(chatId, text, keyboard);
  }

  // إرسال الإحصائيات
  async sendStats(chatId, userId) {
    const stats = this.bot.stats || {};
    
    const text = `📊 *إحصائيات البوت*\n\n` +
      `• إجمالي الرسائل: ${stats.totalMessages || 0}\n` +
      `• رسائل اليوم: ${stats.messagesToday || 0}\n` +
      `• رسائل الشهر: ${stats.messagesThisMonth || 0}\n` +
      `• عدد المستخدمين: ${stats.totalUsers || 0}\n` +
      `• الإيرادات: $${(stats.totalRevenue || 0).toFixed(2)}`;

    return await this.sendMessage(chatId, text);
  }

  // إرسال الرصيد
  async sendBalance(chatId, userId) {
    // TODO: جلب الرصيد من قاعدة البيانات
    const text = `💰 *رصيدك*\n\n` +
      `• النقاط المتاحة: 100\n` +
      `• الرسائل المستخدمة: 50\n` +
      `• الحد المتبقي: 50`;

    return await this.sendMessage(chatId, text);
  }

  // تغيير اللغة
  async handleLanguage(lang, chatId) {
    const languages = {
      'ar': 'العربية',
      'en': 'English',
      'es': 'Español',
      'fr': 'Français'
    };

    if (!lang || !languages[lang]) {
      const keyboard = {
        inline_keyboard: Object.entries(languages).map(([code, name]) => [
          { text: name, callback_data: `lang_${code}` }
        ])
      };
      return await this.sendMessage(chatId, 'اختر اللغة:', keyboard);
    }

    // TODO: حفظ اللغة في قاعدة البيانات
    return await this.sendMessage(chatId, `✅ تم تغيير اللغة إلى: ${languages[lang]}`);
  }

  // نص المساعدة
  getHelpText() {
    let text = `📖 *مساعدة*\n\n`;
    text += `*الأوامر المتاحة:*\n`;
    text += `/start - بدء المحادثة\n`;
    text += `/help - عرض المساعدة\n`;
    text += `/settings - الإعدادات\n`;
    text += `/stats - الإحصائيات\n`;
    text += `/balance - الرصيد\n`;
    text += `/language - تغيير اللغة\n\n`;

    if (this.bot.commands?.length) {
      text += `*الأوامر المخصصة:*\n`;
      this.bot.commands.forEach(cmd => {
        text += `${cmd.name} - ${cmd.description}\n`;
      });
    }

    return text;
  }

  // مسح سجل المحادثة
  clearConversation(chatId) {
    this.conversations.delete(chatId);
  }
}

module.exports = TelegramBotHandler;