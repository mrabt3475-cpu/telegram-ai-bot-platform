# 🚀 دليل إعداد Telegram AI Bot Platform

## المتطلبات الأساسية

- Node.js v16+ و npm/yarn
- MongoDB أو PostgreSQL
- Telegram Bot Token (من [@BotFather](https://t.me/botfather))
- اختياري: حساب Stripe و CrewAI API

---

## الخطوات السريعة

### 1. استنساخ المستودع
```bash
git clone https://github.com/mrabt3475-cpu/telegram-ai-bot-platform.git
cd telegram-ai-bot-platform
```

### 2. تثبيت المتغيرات البيئية بأمان
```bash
# انسخ ملف المثال
cp backend/.env.example backend/.env.local

# افتح الملف وعدّل البيانات الحساسة
nano backend/.env.local
# أو استخدم محرر النصوص المفضل لديك
```

### 3. استكمل المتغيرات المطلوبة

#### قاعدة البيانات
```bash
# MongoDB (خيار 1)
MONGODB_URI=mongodb://localhost:27017/telegram-ai-bot-platform

# أو PostgreSQL (خيار 2)
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_bot
```

#### رموز التحقق (JWT)
```bash
# أنشئ مفتاح قوي عشوائي (32 حرف على الأقل)
JWT_SECRET=your-secure-random-key-minimum-32-characters

# أو استخدم هذا الأمر:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Telegram Bot
```bash
# احصل على التوكن من @BotFather في Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

#### تشفير البيانات
```bash
# أنشئ مفتاح تشفير عشوائي
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# الصق النتيجة في ENCRYPTION_KEY
```

### 4. تثبيت المكتبات
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. إعداد قاعدة البيانات

#### MongoDB
```bash
# بدء MongoDB locally
mongod

# أو استخدم MongoDB Atlas (cloud)
# ثم عدّل MONGODB_URI في .env.local
```

#### PostgreSQL
```bash
# إنشاء قاعدة البيانات
createdb telegram_bot

# عدّل DATABASE_URL في .env.local بكلمة المرور الصحيحة
```

### 6. تشغيل التطبيق

```bash
# Backend (من مجلد backend)
npm run dev

# Frontend (من مجلد frontend، في نافذة أخرى)
npm run dev
```

### 7. افتح في المتصفح
```
http://localhost:3001
```

---

## 🔐 أمان متغيرات البيئة

### ✅ افعل
- ✅ استخدم `.env.local` للتطوير المحلي
- ✅ لا تقم بـ commit لملفات `.env`
- ✅ استخدم GitHub Secrets للـ CI/CD
- ✅ استخدم مفاتيح قوية عشوائية
- ✅ دوّر المفاتيح بانتظام

### ❌ لا تفعل
- ❌ لا تضع مفاتيح حساسة في الكود
- ❌ لا تشارك ملفات `.env` مع أحد
- ❌ لا تستخدم نفس المفاتيح في جميع البيئات
- ❌ لا تسجل كلمات المرور في السجلات

👉 **اقرأ [ENV_SECURITY.md](./ENV_SECURITY.md) للمزيد من التفاصيل**

---

## 📚 الخطوات التالية

### إضافة CrewAI (اختياري)
```bash
# احصل على API key من https://crewai.com
# ثم أضفها إلى .env.local

MY_CUSTOM_AI_API_KEY=your-api-key
MY_CUSTOM_AI_API_URL=https://your-endpoint.crewai.com/v1/chat/completions
MY_CUSTOM_AI_MODEL=crewai-ai
```

### إضافة Stripe (اختياري)
```bash
# احصل على مفاتيح من https://dashboard.stripe.com
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "اتصال قاعدة البيانات فشل"
```bash
# تحقق من DATABASE_URL
echo $DATABASE_URL

# تحقق من تشغيل MongoDB/PostgreSQL
# MongoDB: mongod
# PostgreSQL: pg_isready -h localhost
```

### المشكلة: "خطأ في JWT"
```bash
# تأكد من أن JWT_SECRET طويل بما يكفي (32+ حرف)
# قم بتجديده:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### المشكلة: "Telegram Bot لا يستجيب"
```bash
# تحقق من الرمز:
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# يجب أن ترى بيانات البوت
```

---

## 📞 الدعم

إذا واجهت مشاكل:

1. تحقق من [ENV_SECURITY.md](./ENV_SECURITY.md)
2. راجع الأخطاء في السجلات: `npm run dev`
3. افتح issue في المستودع
4. اقرأ التوثيق الرسمية:
   - [Telegram Bot API](https://core.telegram.org/bots/api)
   - [MongoDB Docs](https://docs.mongodb.com/)
   - [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**تم الإنشاء:** 2026-05-11
