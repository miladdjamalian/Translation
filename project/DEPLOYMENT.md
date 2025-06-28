# راهنمای استقرار (Deployment Guide)

این راهنما شما را قدم به قدم برای استقرار سیستم ترجمه صوتی روی Render.com و Netlify راهنمایی می‌کند.

## مرحله 1: آماده‌سازی پروژه برای GitHub

### 1.1 بررسی فایل‌های ضروری
مطمئن شوید که فایل‌های زیر در پروژه شما وجود دارند:
- ✅ `.gitignore` (برای حفاظت از فایل‌های حساس)
- ✅ `README.md` (مستندات پروژه)
- ✅ `package.json` (با script های مناسب)
- ✅ `render.yaml` (تنظیمات Render)

### 1.2 ایجاد مخزن GitHub
```bash
# مقداردهی اولیه Git
git init

# اضافه کردن فایل‌ها
git add .

# اولین commit
git commit -m "Initial commit: Real-time Audio Translator"

# اتصال به مخزن GitHub (URL مخزن خود را جایگزین کنید)
git remote add origin https://github.com/yourusername/realtime-audio-translator.git

# Push کردن کد
git push -u origin main
```

## مرحله 2: استقرار Backend روی Render.com

### 2.1 ایجاد حساب Render
1. به [Render.com](https://render.com) بروید
2. حساب کاربری ایجاد کنید (می‌توانید با GitHub وارد شوید)

### 2.2 ایجاد Web Service
1. در داشبورد Render، روی "New +" کلیک کنید
2. "Web Service" را انتخاب کنید
3. مخزن GitHub خود را متصل کنید
4. تنظیمات زیر را وارد کنید:

**Basic Settings:**
- **Name**: `audio-translator-backend`
- **Environment**: `Node`
- **Region**: `Oregon` (یا `Singapore` برای کاربران آسیایی)
- **Branch**: `main`
- **Root Directory**: خالی بگذارید (کل پروژه)

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm run server`

**Advanced Settings:**
- **Auto-Deploy**: `Yes`
- **Health Check Path**: `/health`

### 2.3 تنظیم Environment Variables
در بخش "Environment" تنظیمات سرویس، متغیرهای زیر را اضافه کنید:

```
NODE_ENV=production
PORT=3001
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-actual-private-key-here
-----END PRIVATE KEY-----"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
AZURE_SPEECH_KEY=your-actual-azure-speech-key
AZURE_SPEECH_REGION=your-actual-azure-region
AZURE_TRANSLATOR_KEY=your-actual-azure-translator-key
AZURE_TRANSLATOR_REGION=your-actual-azure-translator-region
FRONTEND_URL=https://your-frontend-url.netlify.app
```

**نکات مهم:**
- `GOOGLE_CLOUD_PRIVATE_KEY` باید دقیقاً همانطور که در فایل JSON است وارد شود
- `FRONTEND_URL` را بعد از استقرار frontend به‌روزرسانی کنید
- تمام کلیدها باید معتبر و فعال باشند

### 2.4 Deploy کردن
1. روی "Create Web Service" کلیک کنید
2. Render شروع به build و deploy می‌کند
3. منتظر بمانید تا وضعیت "Live" شود
4. URL سرور شما مشابه این خواهد بود: `https://translation-md1a.onrender.com`

## مرحله 3: استقرار Frontend روی Netlify

### 3.1 آماده‌سازی Frontend
ابتدا باید URL backend را در کد frontend به‌روزرسانی کنید:

در فایل `src/config/api.ts`:
```typescript
// خط مربوط به API_BASE_URL را تغییر دهید:
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://translation-md1a.onrender.com');
```

### 3.2 استقرار در Netlify
1. به [Netlify.com](https://netlify.com) بروید
2. "Add new site" > "Import an existing project" را انتخاب کنید
3. GitHub را انتخاب کرده و مخزن خود را متصل کنید
4. تنظیمات Build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: خالی بگذارید

### 3.3 تنظیم Environment Variables در Netlify
در تنظیمات سایت Netlify، متغیر زیر را اضافه کنید:
```
VITE_BACKEND_URL=https://translation-md1a.onrender.com
```

## مرحله 4: به‌روزرسانی CORS

پس از استقرار frontend، باید `FRONTEND_URL` را در تنظیمات Render به‌روزرسانی کنید:

```
FRONTEND_URL=https://your-site-name.netlify.app
```

## مرحله 5: تست سیستم

### 5.1 بررسی Backend
1. به URL backend بروید: `https://translation-md1a.onrender.com/health`
2. باید پاسخ JSON مشابه زیر دریافت کنید:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "googleCloud": true,
    "azureSpeech": true,
    "azureTranslator": true
  }
}
```

### 5.2 بررسی Frontend
1. به URL frontend بروید: `https://your-site-name.netlify.app`
2. روی "Cloud Mode (Premium)" کلیک کنید
3. اگر بنر قرمز "Server Offline" نمایش داده نشود، همه چیز درست کار می‌کند

## عیب‌یابی (Troubleshooting)

### مشکلات رایج Backend:
1. **Build Failed**: بررسی کنید که `package.json` صحیح باشد
2. **Environment Variables**: مطمئن شوید تمام کلیدها صحیح هستند
3. **Health Check Failed**: بررسی کنید که endpoint `/health` کار می‌کند

### مشکلات رایج Frontend:
1. **CORS Error**: مطمئن شوید `FRONTEND_URL` در backend صحیح است
2. **Build Failed**: بررسی کنید که تمام dependencies نصب شده‌اند
3. **API Connection**: مطمئن شوید URL backend در کد صحیح است

### مشکلات رایج API:
1. **Google Cloud**: بررسی کنید که APIها فعال هستند
2. **Azure**: مطمئن شوید که Services ایجاد شده‌اند
3. **Quotas**: بررسی کنید که از محدودیت‌های API عبور نکرده‌اید

## نکات امنیتی

1. **هرگز کلیدهای API را در کد commit نکنید**
2. **از Environment Variables استفاده کنید**
3. **دسترسی‌های API را محدود کنید**
4. **به طور منظم کلیدها را rotate کنید**

## نکات عملکرد

1. **Cold Start**: سرویس‌های رایگان Render ممکن است cold start داشته باشند
2. **Caching**: از CDN برای فایل‌های استاتیک استفاده کنید
3. **Monitoring**: لاگ‌ها را به طور منظم بررسی کنید
4. **Scaling**: برای ترافیک بالا، پلن‌های پولی را در نظر بگیرید

---

**تبریک! 🎉**
سیستم ترجمه صوتی شما حالا روی اینترنت مستقر شده و آماده استفاده است.