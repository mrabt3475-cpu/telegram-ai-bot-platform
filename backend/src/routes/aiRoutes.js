const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// إعدادات الـ AI Model المخصص
const AI_CONFIG = {
  endpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:5000/api/chat',
  modelName: process.env.AI_MODEL_NAME || 'custom-ai-bot',
  maxTokens: process.env.AI_MAX_TOKENS || 2048,
  timeout: 30000
};

// الحصول على قائمة النماذج
router.get('/models', (req, res) => {
  res.json({
    success: true,
    models: [{
      id: 'custom-ai',
      name: AI_CONFIG.modelName,
      maxTokens: AI_CONFIG.maxTokens,
      description: 'Custom AI Model'
    }]
  });
});

// محادثة مع الـ AI Model المخصص
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;
    const user = await User.findById(req.user.id);

    // التحقق من حد الاستخدام
    const usageLimit = user.subscription === 'free' ? 100 : 
                       user.subscription === 'basic' ? 1000 : 
                       user.subscription === 'premium' ? 10000 : 100000;
    
    if ((user.usage?.messages || 0) >= usageLimit) {
      return res.status(429).json({ 
        message: 'Monthly message limit reached',
        limit: usageLimit,
        used: user.usage?.messages
      });
    }

    // تحضير الرسائل
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant in a Telegram bot platform. Respond concisely and helpfully.' },
      ...(history || []).slice(-10), // آخر 10 رسائل
      { role: 'user', content: message }
    ];

    // طلب إلى الـ AI Model المخصص
    const startTime = Date.now();
    const aiResponse = await axios.post(AI_CONFIG.endpoint, {
      messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: 0.7
    }, {
      timeout: AI_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_MODEL_API_KEY || ''}`
      }
    });

    const responseTime = Date.now() - startTime;
    const response = aiResponse.data?.response || aiResponse.data?.message || aiResponse.data?.content;

    if (!response) {
      throw new Error('Invalid AI response');
    }

    // تحديث计数器
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.messages': 1 }
    });

    res.json({
      success: true,
      response,
      model: AI_CONFIG.modelName,
      usage: {
        messages: (user.usage?.messages || 0) + 1,
        limit: usageLimit
      },
      responseTime
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'AI request timeout' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ 
      message: error.response?.data?.message || 'AI request failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// إنشاء صورة (إذا كان مدعوماً)
router.post('/image', protect, async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;
    const user = await User.findById(req.user.id);

    // التحقق من حد الصور
    const imageLimit = user.subscription === 'free' ? 10 : 
                       user.subscription === 'basic' ? 50 : 
                       user.subscription === 'premium' ? 200 : 1000;
    
    if ((user.usage?.images || 0) >= imageLimit) {
      return res.status(429).json({ message: 'Image limit reached' });
    }

    // طلب إنشاء صورة
    const aiResponse = await axios.post(`${AI_CONFIG.endpoint}/image`, {
      prompt,
      size
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });

    const imageUrl = aiResponse.data?.url || aiResponse.data?.imageUrl;
    
    if (!imageUrl) {
      throw new Error('Invalid image response');
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.images': 1 }
    });

    res.json({ success: true, imageUrl });

  } catch (error) {
    console.error('Image Error:', error.message);
    res.status(500).json({ message: 'Image generation failed' });
  }
});

// حالة استخدام المستخدم
router.get('/usage', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const limits = {
      free: { messages: 100, images: 10 },
      basic: { messages: 1000, images: 50 },
      premium: { messages: 10000, images: 200 },
      enterprise: { messages: 100000, images: 1000 }
    };
    const plan = user.subscription || 'free';
    
    res.json({
      success: true,
      usage: {
        messages: user.usage?.messages || 0,
        images: user.usage?.images || 0
      },
      limits: limits[plan],
      subscription: plan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;