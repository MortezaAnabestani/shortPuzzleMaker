# استراتژی تولید خودکار (Auto-Pilot Strategy v6.0)

این سند تعیین‌کننده رفتار موتور تولید محتوای هوشمند در حالت اتوپایلوت است.

## ۱. ساختار صف تولید (Production Queue)

فرآیند اتوپایلوت شامل 6 مرحله متوالی با مشخصات فنی زیر است:

**توضیحات انواع محتوا:**
- **Viral Topic**: انتخاب تصادفی از لیست VIRAL_CATEGORIES (شامل: Ancient, Ocean, Space, Nature, Celebrity, Fashion, Beauty, Technology و...)
- **Breaking**: اخبار ترند و لحظه‌ای از طریق AI Search (شامل: Celebrity Updates, Tech Announcements, Sports Highlights, Viral Trends)
- **Narrative**: داستان‌های تاریخی و کشف‌های علمی با روایت مستندسازانه

| ردیف | نوع محتوا | مدت زمان (ثانیه) | تراکم قطعات (Grid) | هدف استراتژیک |
| :--- | :--- | :--- | :--- | :--- |
| ۱ | Random in Viral Topic | ۳۰ ثانیه | ۱۰۰ قطعه | Hook & Fast Reveal |
| ۲ | Random in Viral Topic | ۴۵ ثانیه | ۳۰۰ قطعه | Retention Test |
| ۳ | Random in Viral Topic | ۶۰ ثانیه | ۵۰۰ قطعه | Full Engagement |
| ۴ | Random in Viral Topic | ۹۰ ثانیه | ۲۰۰۰ قطعه | Deep Dive |
| ۵ | Breaking News (AI Search) | ۶۰ ثانیه | ۵۰۰ قطعه | Trending & Timely |
| ۶ | Narrative (Historical) | ۶۰ ثانیه | ۹۰۰ قطعه | High Detail Finale |

## ۲. تنوع بصری و حرکتی (Variability Matrix)

در هر تکرار، موتور Neural Engine پارامترهای زیر را به صورت تصادفی از سایدبار انتخاب می‌کند:

- **Art Style:** انتخاب تصادفی از ۸ سبک (Hyper-Realistic, Anime, Watercolor, ...).
- **Kinetic Movement:** انتخاب تصادفی (Vortex, Flight, Wave,Elastic Pop ...).
- **Tactile Material:** انتخاب تصادفی (Glass, Wood, Carbon,cardboard, ...).
- **Geometry:** انتخاب تصادفی (Square,Triangle,Hexagon,Diamond,Brick/Rectangle,Chevron,True Interlocking, ...).

## ۳. منطق انتخاب موسیقی (Smart Audio Selection)

سیستم انتخاب موسیقی بر اساس سه عامل تصمیم‌گیری می‌کند:

### 3.1. اولویت اول: موسیقی‌های دستی
- اگر کاربر موسیقی دستی بارگذاری کرده باشد:
  - انتخاب بر اساس شاخص صف: `musicTracks[queueIndex % musicTracks.length]`
  - تضمین استفاده sequential و تکرار در صورت نیاز

### 3.2. اولویت دوم: Backend Mode
- **All Mode**:
  - جستجوی موسیقی مناسب در دیتابیس بر اساس `musicMood`
  - در صورت عدم موفقیت، انتقال به AI Selection

- **JSON Mode**:
  - مستقیماً از AI Selection استفاده می‌شود (بدون جستجو در دیتابیس)

### 3.3. AI Smart Music Selection (Fallback)
- جستجوی هوشمند موسیقی از منابع royalty-free
- انتخاب بر اساس `musicMood` و `topic`
- منابع: Pixabay, Incompetech (با Google Search)

## ۴. مدیریت افکت‌های صوتی (Sound Effects Management)

### 4.1. Randomization برای هر ویدئو
در هر ویدئو، افکت‌های صوتی باید به صورت تصادفی انتخاب شوند:

- **منابع انتخاب**:
  1. لیست دستی کاربر (اگر موجود باشد)
  2. دیتابیس backend (در All Mode)
  3. Sound effects پیش‌فرض

- **فرایند**:
  ```
  برای هر video در queue:
    soundRandomizer.randomizeAllSounds(preferBackend)
    // SNAP, MOVE, WAVE, DESTRUCT همگی re-randomize می‌شوند
  ```

### 4.2. Identity Assets (ثابت)
- **Channel Logo**: در تمام ۶ ویدئو ثابت
- **Watermark**: در تمام ۶ ویدئو ثابت

## ۵. فلوچارت تولید خودکار (Auto-Pilot Flow)

```
START Auto-Pilot
    ↓
FOR EACH item in queue [1-6]:
    ↓
    [1] 📊 SCAN: Select Content Type
        - Viral (1-4): Random from VIRAL_CATEGORIES
        - Breaking (5): AI Search with getTrendingTopics()
        - Narrative (6): Historical via fetchFactNarrative()
        ↓
    [2] 🎭 VARIETY: Randomize Visual Parameters
        - Art Style (random)
        - Movement Type (random)
        - Material (random)
        - Piece Shape (random)
        ↓
    [3] 🔍 VALIDATION: Check Content Similarity
        - Extract core subject from topic
        - Query database: contentApi.checkSimilarity()
        - If similar (score > threshold): Re-generate (max 5 attempts)
        - If unique: Continue
        ↓
    [4] 🎵 MUSIC: Smart Audio Selection
        - Priority 1: Manual tracks (if exist)
        - Priority 2: Backend (All Mode) or AI (JSON Mode)
        - Load music to audioRef
        ↓
    [5] 🔊 SOUND FX: Randomize All Effects
        - soundRandomizer.randomizeAllSounds()
        - SNAP, MOVE, WAVE, DESTRUCT
        ↓
    [6] 🎨 GENERATE: Create Visual Content
        - generateArtImage() with selected style
        - generateCoherentStoryArc() with narrative lens
        - generateEnhancedMetadata()
        ↓
    [7] 🎬 ANIMATE: Render Puzzle
        - Load image to canvas
        - Start puzzle animation
        - Display story arc snippets
        ↓
    [8] 🎥 RECORD: Capture Video
        - Start MediaRecorder
        - Capture canvas + audio stream
        - Duration based on queue item
        ↓
    [9] 📦 PACKAGE: Export & Save
        - Download video file
        - Download metadata.txt
        - Download thumbnail.jpg
        - Save to database: contentApi.saveContent()
        ↓
    [10] ✅ COMPLETE: Move to Next
        - Queue index++
        - If more items: Loop to step [1]
        - If done: END Auto-Pilot
```

## ۶. Logging & Transparency

برای شفافیت کامل فرایند، هر مرحله باید logging دقیق داشته باشد:

```typescript
console.log(`🎬 [AutoPilot] Starting video ${currentIndex + 1}/${totalQueue}`);
console.log(`📊 [SCAN] Content Type: ${contentType}`);
console.log(`🎭 [VARIETY] Style: ${artStyle}, Movement: ${movement}`);
console.log(`🔍 [VALIDATION] Similarity Score: ${score} (${isUnique ? 'UNIQUE' : 'DUPLICATE'})`);
console.log(`🎵 [MUSIC] Source: ${musicSource}, Track: ${musicTitle}`);
console.log(`🔊 [SOUND FX] Randomized: SNAP, MOVE, WAVE, DESTRUCT`);
console.log(`🎨 [GENERATE] Image: ${imageUrl}, Story: ${storyArc.hook}`);
console.log(`📦 [PACKAGE] Saved: ${videoFilename}, DB ID: ${dbId}`);
console.log(`✅ [COMPLETE] Video ${currentIndex + 1} finished successfully`);
```

## ۷. نکات مهم

1. **تشابه‌یابی**: حلقه validation حداکثر 5 بار تلاش می‌کند تا محتوای unique بسازد
2. **Error Handling**: در صورت شکست هر مرحله، log کامل و skip به ویدئوی بعدی
3. **Resource Management**: پاک‌سازی memory بعد از هر ویدئو (clear blobs, revoke URLs)
4. **User Control**: کاربر می‌تواند Auto-Pilot را در هر لحظه متوقف کند
