const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const AI_PROVIDERS = {
  'gpt-4': {
    name: 'GPT-4',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    maxTokens: 4000
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 2000
  },
  'claude-3': {
    name: 'Claude 3',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-opus-20240229',
    maxTokens: 4000
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    maxTokens: 4000
  }
};

router.get('/models', (req, res) => {
  const models = Object.entries(AI_PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    maxTokens: config.maxTokens
  }));
  res.json({ success: true, models });
});

router.post('/chat', protect, async (req, res) => {
  try {
    const { message, model, botId, history } = req.body;
    const provider = AI_PROVIDERS[model];
    if (!provider) {
      return res.status(400).json({ message: 'Invalid model' });
    }

    const user = await User.findById(req.user.id);
    if (!user.aiApiKeys?.[model]) {
      return res.status(400).json({ message: `API key not configured for ${provider.name}` });
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...(history || []),
      { role: 'user', content: message }
    ];

    let response;
    if (model.startsWith('gpt')) {
      const aiResponse = await axios.post(
        provider.endpoint,
        { model: provider.model, messages, max_tokens: provider.maxTokens },
        { headers: { Authorization: `Bearer ${user.aiApiKeys[model]}`, 'Content-Type': 'application/json' } }
      );
      response = aiResponse.data.choices[0].message.content;
    } else if (model === 'claude-3') {
      const aiResponse = await axios.post(
        provider.endpoint,
        { model: provider.model, messages, max_tokens: provider.maxTokens },
        { headers: { 'x-api-key': user.aiApiKeys[model], 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
      );
      response = aiResponse.data.content[0].text;
    } else if (model === 'gemini-pro') {
      const aiResponse = await axios.post(
        `${provider.endpoint}?key=${user.aiApiKeys[model]}`,
        { contents: [{ parts: [{ text: message }] }] }
      );
      response = aiResponse.data.candidates[0].content.parts[0].text;
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.messages': 1 }
    });

    res.json({ success: true, response, model });
  } catch (error) {
    console.error('AI Chat Error:', error.response?.data || error.message);
    res.status(500).json({ message: error.response?.data?.error?.message || 'AI request failed' });
  }
});

router.post('/image', protect, async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const user = await User.findById(req.user.id);
    const apiKey = user.aiApiKeys?.dalle;
    if (!apiKey) {
      return res.status(400).json({ message: 'DALL-E API key not configured' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      { prompt, n: 1, size: '1024x1024' },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, imageUrl: response.data.data[0].url });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.error?.message || 'Image generation failed' });
  }
});

router.post('/embeddings', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    const apiKey = user.aiApiKeys?.openai;
    if (!apiKey) {
      return res.status(400).json({ message: 'OpenAI API key not configured' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      { model: 'text-embedding-ada-002', input: text },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, embedding: response.data.data[0].embedding });
  } catch (error) {
    res.status(500).json({ message: 'Embedding generation failed' });
  }
});

router.get('/usage', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      usage: {
        messages: user.usage?.messages || 0,
        images: user.usage?.images || 0,
        apiRequests: user.usage?.apiRequests || 0
      },
      limits: {
        messages: user.subscription === 'free' ? 100 : user.subscription === 'basic' ? 1000 : user.subscription === 'premium' ? 10000 : 100000,
        images: user.subscription === 'free' ? 10 : user.subscription === 'basic' ? 50 : user.subscription === 'premium' ? 200 : 1000
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;