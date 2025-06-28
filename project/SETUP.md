# Premium Real-time Audio Translator Setup Guide

این راهنما شما را قدم به قدم برای راه‌اندازی سیستم ترجمه صوتی پیشرفته با استفاده از APIهای ابری Google Cloud و Microsoft Azure راهنمایی می‌کند.

## 📋 پیش‌نیازها

1. **Node.js** (نسخه 18 یا بالاتر)
2. **npm** یا **yarn**
3. حساب کاربری **Google Cloud Platform**
4. حساب کاربری **Microsoft Azure**

## 🚀 مرحله 1: نصب Dependencies

```bash
npm install
```

## ☁️ مرحله 2: راه‌اندازی Google Cloud Platform

### 2.1 ایجاد پروژه Google Cloud

1. به [Google Cloud Console](https://console.cloud.google.com/) بروید
2. پروژه جدیدی ایجاد کنید یا پروژه موجود را انتخاب کنید
3. Project ID را یادداشت کنید

### 2.2 فعال‌سازی APIها

در Google Cloud Console، APIهای زیر را فعال کنید:

1. **Cloud Speech-to-Text API**
   - به [Speech-to-Text API](https://console.cloud.google.com/apis/library/speech.googleapis.com) بروید
   - روی "Enable" کلیک کنید

2. **Cloud Translation API**
   - به [Translation API](https://console.cloud.google.com/apis/library/translate.googleapis.com) بروید
   - روی "Enable" کلیک کنید

### 2.3 ایجاد Service Account

1. به [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) بروید
2. "Create Service Account" را کلیک کنید
3. نام و توضیحات را وارد کنید
4. نقش‌های زیر را اضافه کنید:
   - `Cloud Speech Client`
   - `Cloud Translation API User`
5. کلید JSON را دانلود کنید

### 2.4 استخراج اطلاعات Service Account

از فایل JSON دانلود شده، اطلاعات زیر را استخراج کنید:
- `project_id`
- `client_email`
- `private_key`

## 🔷 مرحله 3: راه‌اندازی Microsoft Azure

### 3.1 ایجاد Azure Account

1. به [Azure Portal](https://portal.azure.com/) بروید
2. حساب کاربری ایجاد کنید (اگر ندارید)

### 3.2 ایجاد Speech Service

1. در Azure Portal، "Create a resource" را کلیک کنید
2. "Speech" را جستجو کنید
3. Speech service را ایجاد کنید
4. Region و Pricing tier را انتخاب کنید
5. پس از ایجاد، به Keys and Endpoint بروید
6. Key1 و Region را یادداشت کنید

### 3.3 ایجاد Translator Service

1. در Azure Portal، "Create a resource" را کلیک کنید
2. "Translator" را جستجو کنید
3. Translator service را ایجاد کنید
4. Region و Pricing tier را انتخاب کنید
5. پس از ایجاد، به Keys and Endpoint بروید
6. Key1 و Region را یادداشت کنید

## 🔧 مرحله 4: پیکربندی Environment Variables

### 4.1 ایجاد فایل .env

فایل `.env.example` را کپی کرده و نام آن را به `.env` تغییر دهید:

```bash
cp .env.example .env
```

### 4.2 تکمیل اطلاعات API

فایل `.env` را باز کرده و اطلاعات زیر را وارد کنید:

```env
# Google Cloud API Keys
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-here\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Microsoft Azure API Keys
AZURE_SPEECH_KEY=your-azure-speech-key-here
AZURE_SPEECH_REGION=your-azure-region-here
AZURE_TRANSLATOR_KEY=your-azure-translator-key-here
AZURE_TRANSLATOR_REGION=your-azure-translator-region-here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**نکات مهم:**
- `GOOGLE_CLOUD_PRIVATE_KEY` باید دقیقاً همانطور که در فایل JSON است وارد شود
- `\n` ها را حفظ کنید
- Region names باید دقیقاً مطابق Azure باشند (مثل `eastus`, `westeurope`)

## 🖥️ مرحله 5: اجرای سیستم

### 5.1 راه‌اندازی Backend Server

ترمینال جدیدی باز کرده و دستور زیر را اجرا کنید:

```bash
npm run server
```

سرور باید روی پورت 3001 راه‌اندازی شود و پیام‌های زیر را نمایش دهد:

```
🚀 Server running on port 3001
📡 WebSocket server ready for real-time audio
🌐 Frontend URL: http://localhost:5173
✅ Google Cloud Speech client initialized
✅ Google Cloud Translation client initialized
✅ Azure Speech client initialized
✅ Azure Translation client initialized
```

### 5.2 راه‌اندازی Frontend

ترمینال دیگری باز کرده و دستور زیر را اجرا کنید:

```bash
npm run dev
```

Frontend روی `http://localhost:5173` در دسترس خواهد بود.

## 🎯 مرحله 6: تست سیستم

### 6.1 بررسی وضعیت سرور

1. برنامه را در مرورگر باز کنید
2. روی "Cloud Mode (Premium)" کلیک کنید
3. اگر سرور به درستی کار می‌کند، بنر قرمز نمایش داده نخواهد شد

### 6.2 تست Speech-to-Text

1. میکروفون را انتخاب کنید
2. Speech Provider را انتخاب کنید (Google یا Azure)
3. زبان مبدا را انتخاب کنید (فارسی)
4. "Start Cloud Translation" را کلیک کنید
5. چیزی بگویید و ببینید آیا متن نمایش داده می‌شود

### 6.3 تست Translation

1. زبان مقصد را انتخاب کنید (انگلیسی)
2. Translation Provider را انتخاب کنید
3. صحبت کنید و ببینید آیا ترجمه نمایش داده می‌شود

## 🔍 عیب‌یابی

### مشکلات رایج:

1. **Server Offline:**
   - مطمئن شوید backend server در حال اجرا است
   - پورت 3001 آزاد باشد

2. **Google Cloud Errors:**
   - API keys را بررسی کنید
   - مطمئن شوید APIها فعال هستند
   - Service Account permissions را بررسی کنید

3. **Azure Errors:**
   - Keys و Region را بررسی کنید
   - مطمئن شوید Services ایجاد شده‌اند

4. **Audio Issues:**
   - مجوز میکروفون را بررسی کنید
   - میکروفون صحیح را انتخاب کنید

### لاگ‌ها:

- Backend logs در ترمینال server نمایش داده می‌شوند
- Frontend logs در Developer Console مرورگر قابل مشاهده هستند

## 💰 هزینه‌ها

### Google Cloud:
- Speech-to-Text: $0.006 per 15 seconds
- Translation: $20 per 1M characters

### Microsoft Azure:
- Speech-to-Text: $1 per audio hour
- Translator: $10 per 1M characters

**نکته:** هر دو سرویس free tier ارائه می‌دهند که برای تست کافی است.

## 🎉 تبریک!

حالا سیستم ترجمه صوتی پیشرفته شما آماده استفاده است! این سیستم از بهترین APIهای موجود برای دقت بالا در تشخیص گفتار فارسی و ترجمه استفاده می‌کند.

## 📞 پشتیبانی

اگر مشکلی داشتید، مراحل زیر را دنبال کنید:

1. لاگ‌های server و browser را بررسی کنید
2. مطمئن شوید تمام API keys صحیح هستند
3. Network connectivity را بررسی کنید
4. مجوزهای میکروفون را بررسی کنید