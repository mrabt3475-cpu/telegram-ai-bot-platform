const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // نوع التكلفة
  type: {
    type: String,
    enum: ['message', 'image', 'api_call', 'bot_usage', 'subscription', 'custom'],
    required: true
  },
  // الوصف
  description: {
    type: String,
    trim: true
  },
  // المبلغ
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // العملة
  currency: {
    type: String,
    default: 'USD'
  },
  // الرصيد (points)
  points: {
    type: Number,
    default: 0
  },
  // البوت المرتبط
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot'
  },
  // حالة الدفع
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe', 'paypal', 'crypto', 'free'],
    default: 'points'
  },
  // معرف الدفع الخارجي
  externalPaymentId: String,
  // الفاتورة
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  // الفترة
  period: {
    start: Date,
    end: Date
  },
  // بيانات إضافية
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: { type: Date, default: Date.now },
  paidAt: Date
});

costSchema.index({ user: 1, createdAt: -1 });
costSchema.index({ status: 1 });
costSchema.index({ type: 1 });

module.exports = mongoose.model('Cost', costSchema);