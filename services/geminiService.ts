
import { GoogleGenAI, Type } from "@google/genai";
import { ArtStyle } from "../types";

export interface ArtGenerationResponse {
  imageUrl: string;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  ctr_strategy: string; 
}

export const SONIC_LIBRARY = [
  { id: 'sc-1', title: 'Neon Pulse (Cyberpunk)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Cyberpunk' },
  { id: 'sc-2', title: 'Cinematic Dawn', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Cinematic' },
  { id: 'sc-3', title: 'Lofi Chill Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', genre: 'Lofi' },
  { id: 'sc-4', title: 'Future Echoes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Electronic' },
];

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getTrendingTopics = async (): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Identify the top 5 most viral historical documentary events or archeological discoveries trending today. Return as JSON list of headlines.",
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["topics"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return Array.isArray(data.topics) ? data.topics.slice(0, 5) : ["Rise of Ancient Rome", "The Great Pyramids Mystery", "Aztec Temple Discovery"];
  } catch (e) {
    return ["Ancient Civilizations", "Lost Empires"];
  }
};

/**
 * تولید فکت‌های کوتاه مستند برای نمایش در زمان رندر پازل
 */
export const generateDocumentarySnippets = async (topic: string): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `For the topic "${topic}", provide 5 extremely short, high-impact documentary facts (max 12 words each). Focus on "Did you know?" style. Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            snippets: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["snippets"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return data.snippets || [];
  } catch {
    return [
      "Discovery changes our understanding of the era.",
      "Evidence suggests a complex social structure.",
      "The precision of this artifact remains a mystery.",
      "Ancient engineering continues to baffle experts.",
      "This moment defined the course of local history."
    ];
  }
};

export const generateVisualPromptFromTopic = async (topic: string): Promise<string> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Topic: "${topic}". Create a high-detail historical documentary cinematic visual prompt for an image generation model. Focus on human history, artifacts, or ancient settings. No text.`,
    });
    return response.text?.trim() || topic;
  } catch {
    return topic;
  }
};

export const fetchFactNarrative = async (): Promise<string> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Tell me one high-impact historical fact in one engaging paragraph. Focus strictly on documented human history or ancient civilizations for a documentary short.",
    });
    return response.text?.trim() || "A legendary historical event.";
  } catch {
    return "A high-impact historical discovery.";
  }
};

export const generateArtImage = async (style: ArtStyle, subject: string, attempt: number = 0): Promise<ArtGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Highly detailed, professional cinematic digital art, masterpiece. Historical Documentary Scene: ${subject}. Style: ${style}. No text. Full vertical 9:16 composition. High resolution, 8k.`;
  const MAX_ATTEMPTS = 3;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    let imageUrl = "";
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }
    if (!imageUrl) {
      if (attempt < MAX_ATTEMPTS) {
        await delay(1000 * (attempt + 1));
        return generateArtImage(style, subject, attempt + 1);
      }
      throw new Error("Synthesis Failed: No image data returned.");
    }
    return { imageUrl };
  } catch (error: any) {
    const isTransient = error?.message?.includes('500') || error?.message?.includes('xhr') || error?.message?.includes('RPC');
    if (isTransient && attempt < MAX_ATTEMPTS) {
      await delay(1000 * (attempt + 1));
      return generateArtImage(style, subject, attempt + 1);
    }
    throw error;
  }
};

export const generateYouTubeMetadata = async (subject: string, style: ArtStyle): Promise<YouTubeMetadata> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a History Documentary YouTube Expert. Topic: "${subject}". Task: Create high-CTR Shorts metadata in JSON format. Focus on 'Mystery', 'History', and 'Discovery'.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctr_strategy: { type: Type.STRING }
          },
          required: ["title", "description", "tags", "ctr_strategy"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch {
    return { title: "The Hidden Truth of History...", description: "A historical journey.", tags: ["history", "discovery", "shorts"], ctr_strategy: "Mystery hook." };
  }
};
