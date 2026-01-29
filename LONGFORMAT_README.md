# 📽️ Long Format Video System - راهنمای کامل

## 📖 مقدمه

سیستم Long Format یک معماری پیشرفته برای تولید ویدئوهای پازل با طول 8+ دقیقه است که با استراتژی‌های Retention مخصوص طراحی شده است.

---

## 🎯 ویژگی‌های کلیدی

### ✨ معماری Multi-Scene
- **5-7 صحنه مستقل**: هر صحنه 60-120 ثانیه
- **Win Moments**: هر 60-90 ثانیه یک لحظه موفقیت
- **تنوع بصری بالا**: تصاویر متنوع در هر صحنه
- **موسیقی پویا**: تغییر موسیقی بین صحنه‌ها

### 🎣 استراتژی Retention
- **Fact Cards**: هر 20-30 ثانیه
- **Progress Bar**: نمایش مداوم پیشرفت
- **Chapter Titles**: عنوان‌های سینمایی
- **Transition Animations**: انیمیشن‌های حرفه‌ای

---

## 🎨 هشت ژانر طراحی شده

### 1. 🏛️ Historical Reconstruction (بازسازی تاریخی)
**مثال:** سقوط امپراتوری روم
- بازسازی رویدادهای تاریخی گام به گام
- Timeline واضح با Fact Cards تاریخی
- موسیقی Epic و Dramatic

**استفاده ایده‌آل برای:**
- رویدادهای بزرگ تاریخی
- سقوط/ظهور تمدن‌ها
- جنگ‌های تاریخی
- انقلاب‌ها و تحولات

---

### 2. 🔬 Scientific Deep-Dive (کاوش علمی عمیق)
**مثال:** از کهکشان تا DNA
- توضیح پدیده‌های علمی پیچیده
- Zoom از Macro به Micro
- Visualization علمی

**استفاده ایده‌آل برای:**
- مفاهیم علمی پیچیده
- سفرهای مقیاسی (از بزرگ به کوچک)
- فرآیندهای بیولوژیکی
- کاوش کیهانی

---

### 3. 🌍 Geographic Journey (سفر جغرافیایی)
**مثال:** عجایب هفتگانه جدید
- سفر مجازی به مکان‌های مختلف
- هر صحنه یک مقصد
- موسیقی بومی هر منطقه

**استفاده ایده‌آل برای:**
- عجایب جهان
- مکان‌های تاریخی
- شهرهای مشهور
- عجایب طبیعی

---

### 4. 🎨 Art Evolution (تکامل هنر)
**مثال:** تاریخ نقاشی از غارها تا دیجیتال
- تکامل یک هنر در طول زمان
- هر صحنه یک دوره هنری
- تغییر سبک موسیقی با دوره

**استفاده ایده‌آل برای:**
- تاریخ هنر
- تکامل سبک‌های هنری
- معماری در طول زمان
- مد و طراحی

---

### 5. 🧬 Life Cycle Story (چرخه حیات)
**مثال:** زندگی و مرگ یک ستاره
- تولد، رشد، بلوغ، مرگ
- داستان کامل یک موجود/پدیده
- موسیقی احساسی متناسب با مراحل

**استفاده ایده‌آل برای:**
- چرخه حیات ستاره‌ها
- زندگی حیوانات
- رشد گیاهان
- دوره‌های زندگی انسان

---

### 6. 🏗️ Construction Timelapse (ساخت در طول زمان)
**مثال:** ساخت برج ایفل
- روایت ساخت یک سازه عظیم
- از طراحی تا تکمیل
- موسیقی صنعتی و پرانرژی

**استفاده ایده‌آل برای:**
- ساختمان‌های مشهور
- پروژه‌های عظیم مهندسی
- سدها و پل‌ها
- شهرسازی

---

### 7. 🎭 Story Arc (داستان‌گویی)
**مثال:** افسانه شاه آرتور
- یک داستان کامل با شروع، میانه، پایان
- شخصیت‌پردازی
- موسیقی سینمایی

**استفاده ایده‌آل برای:**
- افسانه‌ها و اسطوره‌ها
- زندگی‌نامه‌ها
- داستان‌های تاریخی
- حماسه‌ها

---

### 8. 🔮 Mystery Reveal (کشف معما)
**مثال:** حقیقت مثلث برمودا
- یک معما که گام به گام حل می‌شود
- نظریه‌های مختلف
- افشای حقیقت در پایان

**استفاده ایده‌آل برای:**
- معماهای تاریخی
- پدیده‌های مرموز
- جرم‌های مشهور
- رازهای علمی

---

## 🏗️ ساختار فنی

### 📁 فایل‌های اصلی

```
shortPuzzleMaker/
├── types-longform.ts                    # Type definitions
├── hooks/
│   └── useLongFormatPipeline.ts        # Pipeline management
├── components/
│   └── longform/
│       ├── ProgressBar.tsx              # Progress display
│       ├── FactCardOverlay.tsx          # Fact cards
│       └── ChapterTitle.tsx             # Chapter titles
│   └── sidebar/
│       └── LongFormatConfig.tsx         # Genre selection UI
└── services/
    └── longform/
        └── genreTemplates.ts            # All 8 genre templates
```

### 🔧 Type Definitions

```typescript
// ژانرها
enum LongFormGenre {
  HISTORICAL_RECONSTRUCTION = 'HISTORICAL_RECONSTRUCTION',
  SCIENTIFIC_DEEPDIVE = 'SCIENTIFIC_DEEPDIVE',
  GEOGRAPHIC_JOURNEY = 'GEOGRAPHIC_JOURNEY',
  ART_EVOLUTION = 'ART_EVOLUTION',
  LIFE_CYCLE_STORY = 'LIFE_CYCLE_STORY',
  CONSTRUCTION_TIMELAPSE = 'CONSTRUCTION_TIMELAPSE',
  STORY_ARC = 'STORY_ARC',
  MYSTERY_REVEAL = 'MYSTERY_REVEAL',
}

// ساختار کلی
interface LongFormStructure {
  genre: LongFormGenre;
  totalDuration: number;  // دقیقه
  title: string;
  description: string;
  scenes: LongFormScene[];
  musicStrategy: MusicStrategy;
  retentionHooks: RetentionHooksConfig;
}

// هر صحنه
interface LongFormScene {
  id: number;
  title: string;
  duration: number;  // ثانیه
  pieceCount: number;
  imagePrompt: string;
  storyBeat: string;
  musicMood: string;
  factCards: FactCard[];
  chapterTitle?: string;
  transitionType: TransitionType;
  visualStyle?: string;
}

// Fact Cards
interface FactCard {
  timestamp: number;  // ثانیه
  type: 'fact' | 'quote' | 'question' | 'countdown' | 'statistic';
  content: string;
  duration: number;  // ثانیه
  position: 'top' | 'bottom' | 'center' | 'side';
  animation: 'fade' | 'slide' | 'pop';
}
```

---

## 🚀 نحوه استفاده

### 1. انتخاب Mode در UI

```tsx
// در App.tsx
const [videoMode, setVideoMode] = useState<'short' | 'long'>('short');

<button onClick={() => setVideoMode('long')}>
  Long Format (8+ min)
</button>
```

### 2. انتخاب ژانر

```tsx
<LongFormatConfig
  onStartProduction={handleStartLongFormatProduction}
  isGenerating={longFormatPipeline.progress.currentStep !== 'IDLE'}
/>
```

### 3. شروع تولید

```typescript
const handleStartLongFormatProduction = (structure: LongFormStructure) => {
  console.log('🎬 Starting Long Format:', structure);
  setLongFormatStructure(structure);
  longFormatPipeline.executeLongFormatPipeline(structure);
};
```

### 4. مدیریت Pipeline

```typescript
const longFormatPipeline = useLongFormatPipeline({
  audioRef,
  setPreferences,
  onAddCloudTrack: handleAddCloudTrack,
  setActiveTrackName,
  fetchAudioBlob,
});

// Pipeline steps:
// IDLE → INITIALIZING → GENERATING_SCENE → LOADING_MUSIC
// → RECORDING_SCENE → TRANSITIONING → FINALIZING → COMPLETE
```

---

## 🎬 Pipeline Flow

```
1. INITIALIZING
   ↓
2. For each scene:
   ├── GENERATING_SCENE (تولید تصویر)
   ├── LOADING_MUSIC (بارگذاری موسیقی)
   ├── RECORDING_SCENE (ضبط پازل)
   └── TRANSITIONING (انتقال به صحنه بعد)
   ↓
3. FINALIZING (نهایی‌سازی)
   ↓
4. COMPLETE
```

---

## 📊 Retention Hooks

### ProgressBar
- **موقعیت**: Top یا Bottom
- **سبک**:
  - `chapter-count`: "Chapter 2/6"
  - `percentage`: "45% Complete"
  - `time-remaining`: "Time Remaining: 3:24"

### FactCardOverlay
- **انواع**: fact, quote, question, countdown, statistic
- **موقعیت**: top, bottom, center, side
- **انیمیشن**: fade, slide, pop
- **فرکانس**: هر 20-30 ثانیه

### ChapterTitle
- **زمان نمایش**: در transitions
- **مدت**: 3 ثانیه
- **انیمیشن**: Fade in/out + Scale

---

## 🎵 Music Strategy

### Single Track
تک موسیقی برای کل ویدئو

```typescript
musicStrategy: {
  type: 'single-track',
  tracks: [
    { sceneId: 1, mood: 'Epic Documentary', intensity: 7 }
  ]
}
```

### Dynamic Multi-Track
موسیقی متفاوت برای هر صحنه

```typescript
musicStrategy: {
  type: 'dynamic-multi-track',
  tracks: [
    { sceneId: 1, mood: 'Epic Glory', intensity: 7, transitionType: 'fade' },
    { sceneId: 2, mood: 'Building Tension', intensity: 5,
      transitionType: 'crossfade', crossfadeDuration: 4 },
    { sceneId: 3, mood: 'Intense Battle', intensity: 9,
      transitionType: 'hard-cut' }
  ]
}
```

---

## 🎨 Transitions

### انواع Transition:
1. **fade**: محو تدریجی
2. **crossfade**: ترکیب دو موسیقی
3. **hard-cut**: قطع ناگهانی
4. **zoom**: زوم به داخل/خارج
5. **puzzle-wipe**: تبدیل پازل‌وار

---

## 💡 بهترین روش‌ها (Best Practices)

### 1. طراحی صحنه‌ها
- ✅ هر صحنه باید یک "win moment" داشته باشد
- ✅ تنوع بصری بین صحنه‌ها حیاتی است
- ✅ هر صحنه باید story beat واضحی داشته باشد
- ✅ تعداد قطعات پازل را متناسب با مدت زمان تنظیم کنید

### 2. Fact Cards
- ✅ حداکثر 2-3 fact card در هر صحنه
- ✅ محتوا باید کوتاه و خواندنی باشد (حداکثر 10 کلمه)
- ✅ از emoji برای جذابیت بیشتر استفاده کنید
- ✅ موقعیت را متنوع کنید (top, bottom, center)

### 3. موسیقی
- ✅ موسیقی باید با mood صحنه هماهنگ باشد
- ✅ از crossfade برای transitions نرم استفاده کنید
- ✅ intensity را با پیشرفت داستان تغییر دهید
- ✅ در لحظات climax، intensity را افزایش دهید

### 4. Performance
- ✅ تصاویر را optimize کنید
- ✅ موسیقی را preload کنید
- ✅ از lazy loading برای scenes استفاده کنید
- ✅ progress را به کاربر نشان دهید

---

## 🧪 تست و Debug

### Logs مهم:
```javascript
// Pipeline start
console.log('🚀 [LongFormat] Starting Pipeline');

// Scene processing
console.log('🎬 [LongFormat] Processing scene 2/6');

// Music loading
console.log('🎵 [LongFormat] Loading music: Epic Glory');

// Fact cards
console.log('[LongFormat] Triggering hook: fact at 25s');

// Completion
console.log('✅ [LongFormat] Pipeline completed!');
```

### Debugging Tips:
1. بررسی `progress.currentStep` برای وضعیت Pipeline
2. مانیتور کردن `currentSceneIndex` و `totalScenes`
3. چک کردن `isRecording` و `isSolving`
4. بررسی لاگ‌های موسیقی در Console

---

## 📈 Metrics و Analytics

### KPIs مهم:
- **Retention Rate**: درصد بینندگان که تا پایان می‌مانند
- **Average View Duration**: متوسط مدت زمان تماشا
- **Engagement Rate**: تعامل با Fact Cards
- **Scene Completion**: درصد تکمیل هر صحنه

### پیشنهادات بهینه‌سازی:
- اگر Retention بعد از صحنه خاصی افت می‌کند، آن صحنه را کوتاه‌تر کنید
- اگر Engagement پایین است، Fact Cards بیشتری اضافه کنید
- اگر Average View Duration کم است، موسیقی پرانرژی‌تر انتخاب کنید

---

## 🔮 آینده و توسعه

### ویژگی‌های در دست توسعه:
- [ ] AI-Generated Scene Suggestions
- [ ] Real-time Retention Prediction
- [ ] Custom Genre Creator
- [ ] Multi-language Support
- [ ] Advanced Transition Effects
- [ ] Interactive Fact Cards (Quiz)

### ایده‌های جدید:
- **Adaptive Difficulty**: تغییر تعداد قطعات پازل بر اساس performance
- **Branching Stories**: انتخاب مسیر توسط بیننده
- **Live Polling**: نظرسنجی زنده در حین ویدئو
- **Social Integration**: اشتراک‌گذاری لحظه‌های خاص

---

## 📞 پشتیبانی و سوالات

برای سوالات و مشکلات:
1. بررسی Console Logs
2. چک کردن Network Tab (برای موسیقی)
3. مرور این مستندات
4. تماس با تیم توسعه

---

## 🙏 سپاسگزاری

این سیستم با الهام از:
- YouTube Retention Strategies
- Netflix Documentary Techniques
- TikTok Engagement Hooks
- Gaming Tutorial Formats

طراحی و پیاده‌سازی شده است.

---

**نسخه:** 1.0.0
**تاریخ:** 2026-01-29
**وضعیت:** ✅ Production Ready

---

**🎬 Long Format Video System - ساخته شده با ❤️ برای ویدئوهای با کشش بالا**
