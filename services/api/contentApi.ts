/**
 * Content API Service
 *
 * اتصال به Backend برای مدیریت محتوا
 *
 * برای استفاده از ngrok (Google AI Studio):
 * 1. Backend را اجرا کنید: npm run dev
 * 2. ngrok را اجرا کنید: ngrok http 5000
 * 3. URL دریافتی را در خط زیر قرار دهید (مثال: 'https://abcd-1234.ngrok-free.app')
 */

// 🔧 اگر از Google AI Studio استفاده می‌کنید، URL ngrok را اینجا قرار دهید:
const API_BASE_URL = "https://unsettledly-intersesamoid-paris.ngrok-free.dev";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ContentPayload {
  jalaliDate: string;
  puzzleCard: {
    category: string;
    narrativeLens?: string;
    musicMood?: string;
    musicTrack?: string;
    artStyle?: string;
    movement?: string;
    pieceCount?: number;
    duration?: number;
    shape?: string;
    material?: string;
  };
  story: {
    coreSubject: string;
    visualPrompt?: string;
    hook?: string;
    buildup?: string[];
    climax?: string;
    reveal?: string;
  };
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    hashtags?: string[];
  };
  files?: {
    videoFilename?: string;
    thumbnailFilename?: string;
    videoSizeMB?: number;
  };
  analysis?: {
    similarityScore?: number;
    generationAttempts?: number;
    isUnique?: boolean;
  };
}

class ContentApiService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.checkConnection();
  }

  /**
   * چک کردن اتصال به سرور
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log(`🔌 [API] Checking connection to ${this.baseUrl}...`);

      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Skip ngrok warning page
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.isConnected = true;
        this.lastError = null;
        console.log(`✅ [API] Connected to backend!`, data);
        return true;
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error: any) {
      this.isConnected = false;
      this.lastError = error.message;
      console.error(`❌ [API] Connection failed:`, error.message);
      console.warn(`⚠️ [API] Make sure backend is running: npm run dev`);
      return false;
    }
  }

  /**
   * ذخیره محتوای جدید
   */
  async saveContent(payload: ContentPayload): Promise<ApiResponse<any>> {
    try {
      console.log(`📤 [API] Saving content to database...`);
      console.log(`   Core Subject: "${payload.story.coreSubject.substring(0, 50)}..."`);
      console.log(`   Category: ${payload.puzzleCard.category}`);

      const response = await fetch(`${this.baseUrl}/api/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ [API] Content saved successfully!`);
        console.log(`   ID: ${data.data._id}`);
        console.log(`   Created at: ${data.data.createdAt}`);
        return { success: true, data: data.data };
      } else {
        throw new Error(data.error || "Failed to save content");
      }
    } catch (error: any) {
      console.error(`❌ [API] Save failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * چک کردن تشابه محتوا
   */
  async checkSimilarity(coreSubject: string): Promise<ApiResponse<any>> {
    try {
      console.log(`🔍 [API] Checking content similarity...`);

      const response = await fetch(`${this.baseUrl}/api/content/check-similarity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ coreSubject }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ [API] Similarity check complete`);
        console.log(`   Is Similar: ${data.data.isSimilar}`);
        console.log(`   Score: ${data.data.similarityScore}`);
        return { success: true, data: data.data };
      } else {
        throw new Error(data.error || "Similarity check failed");
      }
    } catch (error: any) {
      console.error(`❌ [API] Similarity check failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * دریافت آمار کلی
   */
  async getStats(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/content/stats/overview`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`📊 [API] Stats retrieved:`, data.data);
        return { success: true, data: data.data };
      } else {
        throw new Error(data.error || "Failed to get stats");
      }
    } catch (error: any) {
      console.error(`❌ [API] Get stats failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * وضعیت اتصال
   */
  getConnectionStatus(): { isConnected: boolean; lastError: string | null } {
    return {
      isConnected: this.isConnected,
      lastError: this.lastError,
    };
  }
}

// Singleton instance
export const contentApi = new ContentApiService();
