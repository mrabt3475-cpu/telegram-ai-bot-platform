const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  // النوع
  type: {
    type: String,
    enum: ['subscription', 'usage', 'bot', 'custom'],
    required: true
  },
  // العناصر
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    bot: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' }
  }],
  // المجموع
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // الرصيد (points)
  points: {
    type: Number,
    default: 0
  },
  // الحالة
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'draft'
  },
  // طريقة الدفع
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe', 'paypal', 'crypto', 'free']
  },
  // بيانات الدفع
  payment: {
    stripePaymentId: String,
    paypalPaymentId: String,
    cryptoTransactionId: String,
    paidAt: Date
  },
  // الاستحقاق
  dueDate: Date,
  // الملاحظات
  notes: String,
  // المرفقات
  attachments: [{
    name: String,
    url: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paidAt: Date
});

invoiceSchema.pre('save', function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);