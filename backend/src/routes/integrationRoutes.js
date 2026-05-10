const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/github/auth', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.FRONTEND_URL}/integrations/github/callback`;
  const scope = 'repo user';
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  res.json({ success: true, url });
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
      'integrations.github': { accessToken, username: userResponse.data.login }
    });
    res.json({ success: true, username: userResponse.data.login });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      integrations: {
        github: !!user.integrations.github?.accessToken,
        discord: !!user.integrations.discord?.accessToken,
        slack: !!user.integrations.slack?.accessToken,
        google: !!user.integrations.google?.accessToken
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:service', protect, async (req, res) => {
  try {
    const { service } = req.params;
    await User.findByIdAndUpdate(req.user.id, { $unset: { [`integrations.${service}`]: 1 } });
    res.json({ success: true, message: `${service} disconnected` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;