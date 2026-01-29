/**
 * Long-Form Video Types (8+ minutes)
 *
 * Architecture: Multi-scene puzzle videos with strategic retention hooks
 */

export enum LongFormGenre {
  HISTORICAL_RECONSTRUCTION = 'HISTORICAL_RECONSTRUCTION',    // بازسازی تاریخی
  SCIENTIFIC_DEEPDIVE = 'SCIENTIFIC_DEEPDIVE',               // کاوش علمی
  GEOGRAPHIC_JOURNEY = 'GEOGRAPHIC_JOURNEY',                 // سفر جغرافیایی
  ART_EVOLUTION = 'ART_EVOLUTION',                           // تکامل هنر
  LIFE_CYCLE_STORY = 'LIFE_CYCLE_STORY',                     // چرخه حیات
  CONSTRUCTION_TIMELAPSE = 'CONSTRUCTION_TIMELAPSE',         // ساخت در طول زمان
  STORY_ARC = 'STORY_ARC',                                   // داستان‌گویی
  MYSTERY_REVEAL = 'MYSTERY_REVEAL',                         // کشف معما
}

export interface LongFormScene {
  id: number;
  title: string;
  duration: number;           // Duration in seconds (60-120s recommended)
  pieceCount: number;         // 300-1500 pieces
  imagePrompt: string;        // Prompt for image generation
  storyBeat: string;          // Narrative text for this scene
  musicMood: string;          // Mood for music selection
  factCards: FactCard[];      // 2-4 fact cards per scene
  transitionType: 'fade' | 'puzzle-wipe' | 'zoom' | 'hard-cut';
  visualStyle?: string;       // Override art style for this scene
}

export interface FactCard {
  timestamp: number;          // Seconds from scene start (0-based)
  type: 'fact' | 'quote' | 'question' | 'countdown' | 'statistic';
  content: string;            // Text content (max 120 chars)
  duration: number;           // Display duration in seconds (3-5s)
  position: 'top' | 'bottom' | 'side' | 'center';
  animation?: 'fade' | 'slide' | 'pop';
}

export interface LongFormStructure {
  genre: LongFormGenre;
  totalDuration: number;      // Total video length in minutes (8-30)
  title: string;              // Overall video title
  description: string;        // SEO-friendly description
  scenes: LongFormScene[];    // 5-10 scenes recommended
  musicStrategy: MusicStrategy;
  retentionHooks: RetentionHookSchedule;
}

export interface MusicStrategy {
  type: 'single-track' | 'dynamic-multi-track';
  tracks: {
    sceneId: number;
    mood: string;
    intensity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    transitionType: 'fade' | 'crossfade' | 'hard-cut';
    crossfadeDuration?: number; // Seconds (for crossfade only)
  }[];
}

export interface RetentionHookSchedule {
  progressBar: {
    enabled: boolean;
    position: 'top' | 'bottom';
    style: 'chapter-count' | 'percentage' | 'time-remaining';
  };
  factCardFrequency: number;  // Average seconds between fact cards (20-30 recommended)
  chapterTitles: boolean;     // Show chapter title at scene start?
  transitionAnimations: boolean;
}

// Genre-specific templates
export const GENRE_TEMPLATES: Record<LongFormGenre, Partial<LongFormStructure>> = {
  [LongFormGenre.HISTORICAL_RECONSTRUCTION]: {
    musicStrategy: {
      type: 'dynamic-multi-track',
      tracks: [], // Will be populated dynamically
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'chapter-count',
      },
      factCardFrequency: 25,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.SCIENTIFIC_DEEPDIVE]: {
    musicStrategy: {
      type: 'single-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'top',
        style: 'percentage',
      },
      factCardFrequency: 20,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.GEOGRAPHIC_JOURNEY]: {
    musicStrategy: {
      type: 'dynamic-multi-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'chapter-count',
      },
      factCardFrequency: 30,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.ART_EVOLUTION]: {
    musicStrategy: {
      type: 'dynamic-multi-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'chapter-count',
      },
      factCardFrequency: 25,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.LIFE_CYCLE_STORY]: {
    musicStrategy: {
      type: 'dynamic-multi-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'percentage',
      },
      factCardFrequency: 30,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.CONSTRUCTION_TIMELAPSE]: {
    musicStrategy: {
      type: 'single-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'top',
        style: 'percentage',
      },
      factCardFrequency: 35,
      chapterTitles: false,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.STORY_ARC]: {
    musicStrategy: {
      type: 'dynamic-multi-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'chapter-count',
      },
      factCardFrequency: 40,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
  [LongFormGenre.MYSTERY_REVEAL]: {
    musicStrategy: {
      type: 'single-track',
      tracks: [],
    },
    retentionHooks: {
      progressBar: {
        enabled: true,
        position: 'bottom',
        style: 'time-remaining',
      },
      factCardFrequency: 20,
      chapterTitles: true,
      transitionAnimations: true,
    },
  },
};

// Example scene duration templates
export const SCENE_DURATION_TEMPLATES = {
  SHORT: 60,       // 1 minute
  MEDIUM: 90,      // 1.5 minutes
  LONG: 120,       // 2 minutes
};

// Recommended piece counts by scene duration
export const PIECE_COUNT_BY_DURATION = {
  60: 400,   // 1 min = 400 pieces
  90: 600,   // 1.5 min = 600 pieces
  120: 800,  // 2 min = 800 pieces
};
