const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GitHub Integration
router.get('/github/auth', protect, async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/github/callback`;
    const scope = 'repo,user,read:org';
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${req.user.id}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/github/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    await User.findByIdAndUpdate(req.user.id, {
      'integrations.github': {
        accessToken,
        username: userResponse.data.login,
        avatar: userResponse.data.avatar_url
      }
    });

    res.json({ success: true, username: userResponse.data.login });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/github/repos', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const github = user.integrations.github;
    if (!github?.accessToken) {
      return res.status(400).json({ message: 'GitHub not connected' });
    }

    const repos = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${github.accessToken}` },
      params: { sort: 'updated', per_page: 20 }
    });

    res.json({ success: true, repos: repos.data.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      url: r.html_url,
      language: r.language,
      updatedAt: r.updated_at
    })) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Discord Integration
router.get('/discord/auth', protect, async (req, res) => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/discord/callback`;
    const scope = 'identify guilds messages.write';
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${req.user.id}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discord/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.FRONTEND_URL}/integrations/discord/callback`
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    await User.findByIdAndUpdate(req.user.id, {
      'integrations.discord': {
        accessToken: tokenResponse.data.access_token,
        username: `${userResponse.data.username}#${userResponse.data.discriminator}`,
        avatar: userResponse.data.avatar
      }
    });

    res.json({ success: true, username: `${userResponse.data.username}#${userResponse.data.discriminator}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/discord/send', protect, async (req, res) => {
  try {
    const { channelId, message } = req.body;
    const user = await User.findById(req.user.id);
    const discord = user.integrations.discord;
    if (!discord?.accessToken) {
      return res.status(400).json({ message: 'Discord not connected' });
    }

    await axios.post(`https://discord.com/api/channels/${channelId}/messages`,
      { content: message },
      { headers: { Authorization: `Bearer ${discord.accessToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Slack Integration
router.get('/slack/auth', protect, async (req, res) => {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/slack/callback`;
    const scope = 'chat:write,channels:read,users:read';
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${req.user.id}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/slack/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.FRONTEND_URL}/integrations/slack/callback`
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    await User.findByIdAndUpdate(req.user.id, {
      'integrations.slack': {
        accessToken: tokenResponse.data.access_token,
        teamId: tokenResponse.data.team.id,
        teamName: tokenResponse.data.team.name
      }
    });

    res.json({ success: true, team: tokenResponse.data.team.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/slack/send', protect, async (req, res) => {
  try {
    const { channel, message } = req.body;
    const user = await User.findById(req.user.id);
    const slack = user.integrations.slack;
    if (!slack?.accessToken) {
      return res.status(400).json({ message: 'Slack not connected' });
    }

    await axios.post('https://slack.com/api/chat.postMessage', {
      channel,
      text: message
    }, { headers: { Authorization: `Bearer ${slack.accessToken}`, 'Content-Type': 'application/json' } });

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Integration
router.get('/google/auth', protect, async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/google/callback`;
    const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&state=${req.user.id}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/google/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.FRONTEND_URL}/integrations/google/callback`
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    await User.findByIdAndUpdate(req.user.id, {
      'integrations.google': {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token
      }
    });

    res.json({ success: true, message: 'Google connected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Telegram Bot Integration
router.post('/telegram/setup', protect, async (req, res) => {
  try {
    const { botToken } = req.body;
    const botInfo = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);

    await User.findByIdAndUpdate(req.user.id, {
      'integrations.telegram': {
        botToken,
        botUsername: botInfo.data.result.username,
        botName: botInfo.data.result.first_name
      }
    });

    res.json({ success: true, bot: botInfo.data.result });
  } catch (error) {
    res.status(500).json({ message: 'Invalid bot token' });
  }
});

router.post('/telegram/send', protect, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const user = await User.findById(req.user.id);
    const telegram = user.integrations.telegram;
    if (!telegram?.botToken) {
      return res.status(400).json({ message: 'Telegram bot not configured' });
    }

    await axios.post(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
      chat_id: chatId,
      text: message
    });

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// WhatsApp Integration
router.post('/whatsapp/setup', protect, async (req, res) => {
  try {
    const { phoneNumberId, accessToken } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      'integrations.whatsapp': {
        phoneNumberId,
        accessToken
      }
    });

    res.json({ success: true, message: 'WhatsApp connected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/whatsapp/send', protect, async (req, res) => {
  try {
    const { to, message } = req.body;
    const user = await User.findById(req.user.id);
    const whatsapp = user.integrations.whatsapp;
    if (!whatsapp?.accessToken) {
      return res.status(400).json({ message: 'WhatsApp not connected' });
    }

    await axios.post(`https://graph.facebook.com/v17.0/${whatsapp.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    }, { headers: { Authorization: `Bearer ${whatsapp.accessToken}` } });

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook Management
router.post('/webhooks', protect, async (req, res) => {
  try {
    const { url, events } = req.body;
    const user = await User.findById(req.user.id);
    
    const webhook = {
      id: Date.now().toString(),
      url,
      events,
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