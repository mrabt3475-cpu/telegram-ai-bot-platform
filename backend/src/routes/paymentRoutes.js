const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Cost = require('../models/Cost');
const Invoice = require('../models/Invoice');

const PAYMENT_CONFIG = {
  stripe: {
    apiVersion: '2023-10-16'
  },
  paypal: {
    mode: process.env.PAYPAL_MODE || 'sandbox'
  }
};

// ============ Stripe ============

router.post('/stripe/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd', invoiceId } = req.body;
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      metadata: {
        userId: req.user.id.toString(),
        invoiceId: invoiceId || ''
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/stripe/webhook', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const invoiceId = paymentIntent.metadata.invoiceId;

      // تحديث الفاتورة
      if (invoiceId) {
        await Invoice.findByIdAndUpdate(invoiceId, {
          status: 'paid',
          'payment.stripePaymentId': paymentIntent.id,
          'payment.paidAt': new Date()
        });
      }

      // إضافة الرصيد
      const amount = paymentIntent.amount / 100;
      const points = Math.floor(amount * 100); // 1$ = 100 points
      await User.findByIdAndUpdate(userId, {
        $inc: { points }
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============ PayPal ============

router.post('/paypal/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'USD', invoiceId } = req.body;
    
    const accessToken = await getPayPalAccessToken();
    
    const order = await axios.post(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          },
          custom_id: JSON.stringify({ userId: req.user.id, invoiceId })
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      orderId: order.data.id,
      approvalUrl: order.data.links.find(l => l.rel === 'approve').href
    });
  } catch (error) {
    console.error('PayPal error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/paypal/capture-order', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const accessToken = await getPayPalAccessToken();
    
    const capture = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (capture.data.status === 'COMPLETED') {
      const customId = JSON.parse(capture.data.purchase_units[0].custom_id);
      const amount = parseFloat(capture.data.purchase_units[0].payments.captures[0].amount.value);
      const points = Math.floor(amount * 100);

      await User.findByIdAndUpdate(customId.userId, {
        $inc: { points }
      });

      if (customId.invoiceId) {
        await Invoice.findByIdAndUpdate(customId.invoiceId, {
          status: 'paid',
          'payment.paypalPaymentId': orderId,
          'payment.paidAt': new Date()
        });
      }
    }

    res.json({ success: true, status: capture.data.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Crypto (Simple) ============

router.post('/crypto/generate-address', protect, async (req, res) => {
  try {
    const { currency = 'USDT' } = req.body;
    // في الواقع، تحتاج لربط مع مزود دفع crypto مثل CoinPayments
    // هذا مثال بسيط
    const address = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    await User.findByIdAndUpdate(req.user.id, {
      'paymentConfig.cryptoAddress': address,
      'paymentConfig.cryptoCurrency': currency
    });

    res.json({
      success: true,
      address,
      currency,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Points Payment ============

router.post('/points/pay', protect, async (req, res) => {
  try {
    const { amount, description, botId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user.points < amount) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // خصم الرصيد
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: -amount }
    });

    // تسجيل التكلفة
    const cost = new Cost({
      user: req.user.id,
      type: 'custom',
      description,
      amount: amount / 100, // تحويل لـ USD
      points: amount,
      bot: botId,
      status: 'paid',
      paymentMethod: 'points',
      paidAt: new Date()
    });
    await cost.save();

    res.json({ success: true, remainingPoints: user.points - amount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ Helper Functions ============

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const response = await axios.post(
    'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data.access_token;
}

module.exports = router;