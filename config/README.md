# ⚙️ Configuration - تنظیمات مرکزی

این پوشه شامل تنظیمات مرکزی برنامه است که به شما اجازه می‌دهد تنظیمات را در یک جا مدیریت کنید.

---

## 📁 فایل‌ها

### [`env.ts`](env.ts)
**مدیریت URL های Backend و API Endpoints**

این فایل تنها مکانی است که نیاز به تغییر آدرس Backend دارید.

---

## 🔧 نحوه تغییر Backend URL

### قدم 1: ngrok را اجرا کنید
```bash
cd backend
npm run dev
```

سپس در ترمینال دیگری:
```bash
ngrok http 5000
```

### قدم 2: URL را کپی کنید
ngrok یک URL مانند این به شما می‌دهد:
```
https://abcd-1234-efgh-5678.ngrok-free.app
```

### قدم 3: فایل env.ts را ویرایش کنید
فایل [`env.ts`](env.ts) را باز کنید و خط زیر را پیدا کنید:

```typescript
// 🔧 برای تغییر آدرس backend، فقط این خط را ویرایش کنید:
export const BACKEND_URL = "https://unsettledly-intersesamoid-paris.ngrok-free.dev";
```

URL خود را جایگزین کنید:

```typescript
export const BACKEND_URL = "https://abcd-1234-efgh-5678.ngrok-free.app";
```

**همین!** دیگر نیازی به تغییر هیچ فایل دیگری نیست.

---

## ✅ فایل‌هایی که به صورت خودکار به‌روز می‌شوند

با تغییر `BACKEND_URL` در `env.ts`، تمام این فایل‌ها به صورت خودکار از URL جدید استفاده می‌کنند:

1. ✅ [`assetApi.ts`](../services/api/assetApi.ts) - دسترسی به موسیقی، sound effects، تصاویر
2. ✅ [`contentApi.ts`](../services/api/contentApi.ts) - ذخیره محتوا، similarity check
3. ✅ [`SnapSoundUploader.tsx`](../components/sidebar/SnapSoundUploader.tsx) - بارگذاری sound effects
4. ✅ [`ChannelLogoUploader.tsx`](../components/sidebar/ChannelLogoUploader.tsx) - بارگذاری تصویر پروفایل
5. ✅ [`SmartMusicFinder.tsx`](../components/sidebar/SmartMusicFinder.tsx) - جستجوی موسیقی

---

## 📚 API Endpoints موجود

تمام endpoint ها در `env.ts` تعریف شده‌اند:

```typescript
export const API_ENDPOINTS = {
  // Base URLs
  BASE: BACKEND_URL,
  API: `${BACKEND_URL}/api`,
  ASSETS: `${BACKEND_URL}/assets`,

  // Content API
  CONTENT: `${BACKEND_URL}/api/content`,
  CONTENT_STATS: `${BACKEND_URL}/api/content/stats/overview`,
  CONTENT_SIMILARITY: `${BACKEND_URL}/api/content/check-similarity`,

  // Assets API
  ASSETS_CATALOG: `${BACKEND_URL}/api/assets/catalog`,
  ASSETS_MUSIC: `${BACKEND_URL}/api/assets/music`,
  ASSETS_SOUNDS: `${BACKEND_URL}/api/assets/sounds`,
  ASSETS_IMAGES: `${BACKEND_URL}/api/assets/images`,

  // Health Check
  HEALTH: `${BACKEND_URL}/api/health`,
};
```

---

## 🛠️ Helper Functions

### `getAssetUrl(filename: string)`
دریافت URL کامل برای یک asset:

```typescript
import { getAssetUrl } from '../config/env';

const imageUrl = getAssetUrl('images/profiles/profile.jpg');
// Result: https://your-backend.ngrok-free.app/assets/images/profiles/profile.jpg
```

### `getMusicUrl(mood: string)`
دریافت URL API برای موسیقی:

```typescript
import { getMusicUrl } from '../config/env';

const url = getMusicUrl('calm');
// Result: https://your-backend.ngrok-free.app/api/assets/music?mood=calm
```

### `getSoundUrl(type: string)`
دریافت URL API برای sound effects:

```typescript
import { getSoundUrl } from '../config/env';

const url = getSoundUrl('snap');
// Result: https://your-backend.ngrok-free.app/api/assets/sounds?type=snap
```

### `checkBackendConnection()`
بررسی اتصال به backend:

```typescript
import { checkBackendConnection } from '../config/env';

const isConnected = await checkBackendConnection();
if (isConnected) {
  console.log('✅ Backend is online');
} else {
  console.log('❌ Backend is offline');
}
```

---

## 🎯 استفاده در کامپوننت‌های جدید

اگر می‌خواهید یک API جدید اضافه کنید:

### مرحله 1: Import کنید
```typescript
import { API_ENDPOINTS, DEFAULT_HEADERS } from '../config/env';
```

### مرحله 2: استفاده کنید
```typescript
const response = await fetch(API_ENDPOINTS.CONTENT, {
  method: 'POST',
  headers: DEFAULT_HEADERS,
  body: JSON.stringify(data),
});
```

**مزایا:**
- ✅ URL به صورت مرکزی مدیریت می‌شود
- ✅ Header `ngrok-skip-browser-warning` به صورت خودکار اضافه می‌شود
- ✅ هیچ hard-coded URL ای در کد وجود ندارد
- ✅ تغییر URL فقط در یک جا (`env.ts`)

---

## 🚨 نکات مهم

### 1. همیشه از `DEFAULT_HEADERS` استفاده کنید
```typescript
// ✅ درست
const response = await fetch(url, {
  headers: DEFAULT_HEADERS,
});

// ❌ غلط
const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
  },
});
```

چرا؟ چون `DEFAULT_HEADERS` شامل `ngrok-skip-browser-warning` است که برای ngrok ضروری است.

### 2. از `API_ENDPOINTS` استفاده کنید، نه string های hard-coded
```typescript
// ✅ درست
fetch(API_ENDPOINTS.CONTENT)

// ❌ غلط
fetch('https://my-backend.com/api/content')
```

### 3. برای افزودن endpoint جدید
در فایل `env.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  MY_NEW_ENDPOINT: `${BACKEND_URL}/api/my-new-route`,
};
```

---

## 🧪 Testing

برای تست اینکه URL صحیح است:

```typescript
import { BACKEND_URL, checkBackendConnection } from '../config/env';

console.log('Current backend URL:', BACKEND_URL);

const isOnline = await checkBackendConnection();
console.log('Backend status:', isOnline ? 'Online ✅' : 'Offline ❌');
```

---

## 📝 مثال کامل

```typescript
import {
  API_ENDPOINTS,
  DEFAULT_HEADERS,
  getAssetUrl,
  checkBackendConnection
} from '../config/env';

// 1. بررسی اتصال
const isConnected = await checkBackendConnection();
if (!isConnected) {
  console.error('Backend is offline!');
  return;
}

// 2. دریافت داده
const response = await fetch(API_ENDPOINTS.CONTENT, {
  method: 'GET',
  headers: DEFAULT_HEADERS,
});

const data = await response.json();

// 3. دریافت URL یک asset
const imageUrl = getAssetUrl('images/profiles/avatar.jpg');
console.log('Image URL:', imageUrl);
```

---

## 🔄 Migration از کد قدیمی

اگر کد قدیمی دارید که از hard-coded URL استفاده می‌کند:

### قبل:
```typescript
const API_URL = "https://my-backend.ngrok-free.app";
const response = await fetch(`${API_URL}/api/content`, {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});
```

### بعد:
```typescript
import { API_ENDPOINTS, DEFAULT_HEADERS } from '../config/env';

const response = await fetch(API_ENDPOINTS.CONTENT, {
  headers: DEFAULT_HEADERS,
});
```

کدتان کوتاه‌تر، تمیزتر، و قابل نگهداری‌تر می‌شود!
