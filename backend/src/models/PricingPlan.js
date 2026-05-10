const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  // السعر
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // الفترة (شهرية/سنوية)
  period: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  // الوصف
  description: String,
  // الميزات
  features: [String],
  // الحدود
  limits: {
    bots: { type: Number, default: 1 },
    messagesPerMonth: { type: Number, default: 1000 },
    imagesPerMonth: { type: Number, default: 50 },
    storage: { type: Number, default: 100 }, // MB
    apiCallsPerDay: { type: Number, default: 100 }
  },
  // التكلفة لكل رسالة إضافية
  overageCosts: {
    message: { type: Number, default: 0.001 },
    image: { type: Number, default: 0.01 },
    apiCall: { type: Number, default: 0.001 }
  },
  // هل هو عام
  isPublic: {
    type: Boolean,
    default: true
  },
  // الترتيب
  order: {
    type: Number,
    default: 0
  },
  // هل يظهر كـ popular
  isPopular: {
    type: Boolean,
    default: false
  },
  // الألوان
  color: {
    type: String,
    default: '#3B82F6'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

pricingPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);