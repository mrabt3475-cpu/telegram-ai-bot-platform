const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  basic: { price: 999, name: 'Basic', bots: 3, messages: 1000 },
  premium: { price: 2999, name: 'Premium', bots: 10, messages: 10000 },
  enterprise: { price: 9999, name: 'Enterprise', bots: 50, messages: 100000 }
};

router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLANS });
});

router.post('/stripe/create-session', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const planData = PLANS[plan];
    if (!planData) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${planData.name} Plan`,
            description: `${planData.bots} bots, ${planData.messages} messages/month`
          },
          unit_amount: planData.price
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.user.id,
        plan
      }
    });
    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    await User.findByIdAndUpdate(userId, {
      subscription: plan,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await Transaction.create({
      user: userId,
      type: 'subscription',
      method: 'stripe',
      amount: PLANS[plan].price / 100,
      status: 'completed',
      paymentId: session.payment_intent,
      plan
    });
  }
  res.json({ received: true });
});

router.post('/binance/create', protect, async (req, res) => {
  try {
    const { amount, plan } = req.body;
    const address = process.env.BINANCE_USDT_ADDRESS;
    res.json({ success: true, address, amount, network: 'TRC20' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;