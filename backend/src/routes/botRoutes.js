const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const bots = await Bot.find({ owner: req.user.id });
    res.json({ success: true, count: bots.length, bots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, telegramBotToken, aiProvider, aiModel, aiApiKey, systemPrompt } = req.body;
    const bot = await Bot.create({
      name,
      description,
      owner: req.user.id,
      telegramBotToken,
      aiProvider,
      aiModel,
      aiApiKey,
      systemPrompt
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { bots: bot._id }
    });
    res.status(201).json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, owner: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const bot = await Bot.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }
    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/toggle', protect, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, owner: req.user.id });
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

module.exports = router;