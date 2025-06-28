# Real-time Audio Translator

یک سیستم ترجمه صوتی پیشرفته با استفاده از APIهای ابری Google Cloud و Microsoft Azure

## ویژگی‌های کلیدی

- 🎤 **تشخیص گفتار بلادرنگ** با Google Cloud Speech-to-Text و Azure Speech
- 🌐 **ترجمه فوری** با Google Cloud Translation و Azure Translator
- 🔊 **تولید گفتار** با کیفیت بالا
- 📱 **رابط کاربری ریسپانسیو** با Tailwind CSS
- ⚡ **WebSocket** برای ارتباط بلادرنگ
- 🌍 **پشتیبانی از زبان‌های متعدد** شامل فارسی، عربی، انگلیسی و...

## معماری سیستم

### Frontend (React + TypeScript)
- رابط کاربری مدرن با React 18
- مدیریت state با React Hooks
- طراحی ریسپانسیو با Tailwind CSS
- پشتیبانی از WebRTC برای ضبط صدا

### Backend (Node.js + Express)
- سرور Express.js با TypeScript
- WebSocket برای ارتباط بلادرنگ
- ادغام با Google Cloud APIs
- ادغام با Microsoft Azure APIs
- مدیریت فایل‌های صوتی با Multer

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- npm یا yarn
- حساب Google Cloud Platform
- حساب Microsoft Azure

### نصب Dependencies
```bash
npm install
```

### تنظیم متغیرهای محیطی
فایل `.env` را ایجاد کرده و اطلاعات زیر را وارد کنید:

```env
# Google Cloud API Keys
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Microsoft Azure API Keys
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=your-azure-region
AZURE_TRANSLATOR_KEY=your-azure-translator-key
AZURE_TRANSLATOR_REGION=your-azure-translator-region

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### اجرای برنامه

#### Development Mode
```bash
# Terminal 1: Backend Server
npm run server

# Terminal 2: Frontend Development Server
npm run dev
```

#### Production Build
```bash
npm run build
```

## استقرار (Deployment)

### Backend (Render.com)
1. پروژه را به GitHub push کنید
2. حساب Render.com ایجاد کنید
3. Web Service جدید ایجاد کرده و به مخزن GitHub متصل کنید
4. تنظیمات زیر را اعمال کنید:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Environment**: Node
   - **Region**: انتخاب بهترین منطقه

### Frontend (Netlify)
1. پروژه frontend را به Netlify متصل کنید
2. تنظیمات Build:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

## API Documentation

### Speech Recognition Endpoints

#### POST `/api/speech/transcribe`
تبدیل فایل صوتی به متن

**Parameters:**
- `audio`: فایل صوتی (multipart/form-data)
- `provider`: `google` یا `azure`
- `language`: کد زبان (مثل `fa-IR`)
- `audioFormat`: فرمت صوتی (`webm`, `wav`, `mp3`)

**Response:**
```json
{
  "transcript": "متن تشخیص داده شده",
  "confidence": 0.95,
  "detectedLanguage": "fa-IR",
  "provider": "google"
}
```

### Translation Endpoints

#### POST `/api/translation/translate`
ترجمه متن

**Parameters:**
```json
{
  "text": "متن برای ترجمه",
  "sourceLanguage": "fa",
  "targetLanguage": "en",
  "provider": "google",
  "mode": "balanced"
}
```

**Response:**
```json
{
  "translation": "Text for translation",
  "detectedLanguage": "fa",
  "confidence": 0.98,
  "provider": "google"
}
```

## WebSocket Events

### Client to Server
```javascript
{
  "type": "audio-chunk",
  "audioData": "base64-encoded-audio",
  "language": "fa-IR",
  "sessionId": "unique-session-id"
}
```

### Server to Client
```javascript
{
  "type": "transcript",
  "sessionId": "unique-session-id",
  "text": "متن تشخیص داده شده",
  "isFinal": true
}
```

## پشتیبانی از زبان‌ها

- 🇮🇷 فارسی (Persian)
- 🇸🇦 عربی (Arabic)
- 🇺🇸 انگلیسی (English)
- 🇪🇸 اسپانیایی (Spanish)
- 🇫🇷 فرانسوی (French)
- 🇩🇪 آلمانی (German)
- 🇮🇹 ایتالیایی (Italian)
- 🇵🇹 پرتغالی (Portuguese)
- 🇷🇺 روسی (Russian)
- 🇯🇵 ژاپنی (Japanese)
- 🇰🇷 کره‌ای (Korean)
- 🇨🇳 چینی (Chinese)
- 🇮🇳 هندی (Hindi)
- و بیش از 50 زبان دیگر...

## مشارکت

1. Fork کنید
2. Feature branch ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Branch را push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## پشتیبانی

برای گزارش مشکلات یا درخواست ویژگی‌های جدید، لطفاً از بخش Issues استفاده کنید.

---

**نکته:** این پروژه نیاز به کلیدهای API معتبر از Google Cloud Platform و Microsoft Azure دارد. لطفاً قبل از استفاده، حساب‌های مربوطه را ایجاد کرده و کلیدهای API را دریافت کنید.