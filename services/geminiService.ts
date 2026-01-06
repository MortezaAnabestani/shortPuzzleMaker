
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

export interface SmartMusicTrack {
  title: string;
  url: string;
  source: string;
}

export const SONIC_LIBRARY = [
  { id: 'sc-1', title: 'Deep Ambient Mystery', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Documentary' },
  { id: 'sc-2', title: 'Cinematic History', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Cinematic' },
  { id: 'sc-3', title: 'Techno Discovery', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', genre: 'Electronic' },
  { id: 'sc-4', title: 'Ancient Echoes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Ambient' },
];

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findSmartMusic = async (topic: string): Promise<SmartMusicTrack | null> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find a 100% ROYALTY-FREE (YouTube Safe) direct MP3 download link for a track suitable for a documentary about: "${topic}".
      
      STRICT RHYTHM & STYLE RULES:
      1. RHYTHM: Slow to Medium tempo (60-90 BPM). No fast or aggressive beats.
      2. ATMOSPHERE: Ambient, Relaxing, or Mysterious. It must create a calm background for puzzle solving.
      3. SOURCES: ONLY use direct links to .mp3 files from pixabay.com/music or incompetech.com.
      4. NO YouTube video links.
      
      Return JSON ONLY:
      { "title": "Track Title", "url": "https://...direct-link.mp3", "source": "Pixabay/Incompetech" }`,
      config: {
        tools: [{ googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            source: { type: Type.STRING }
          },
          required: ["title", "url", "source"]
        }
      }
    });
    
    const track = JSON.parse(response.text || "null");
    if (track && track.url && (track.url.includes('pixabay') || track.url.includes('incompetech'))) {
      return track;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const generateArtImage = async (style: ArtStyle, subject: string, attempt: number = 0): Promise<ArtGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Professional cinematic coloring studio art, high contrast, clean outlines. Theme: ${subject}. Style: ${style}. 9:16 vertical aspect ratio. 4k resolution feel.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    return { imageUrl };
  } catch (error: any) {
    if (attempt < 2) return generateArtImage(style, subject, attempt + 1);
    throw error;
  }
};

export const generateYouTubeMetadata = async (subject: string, style: ArtStyle): Promise<YouTubeMetadata> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create viral YouTube Shorts metadata for a puzzle reveal video about: "${subject}". 
      The style is ${style}. Include a clickbaity title, a description with a curiosity loop, and 10 relevant tags. 
      Also provide a CTR strategy summary. Return JSON.`,
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
  } catch { return { title: "New Discovery", description: "History revealed.", tags: ["shorts"], ctr_strategy: "Mystery" }; }
};

export const generateDocumentarySnippets = async (topic: string): Promise<string[]> => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 5 mind-blowing short facts for "${topic}". Each fact must be under 80 characters. Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { snippets: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["snippets"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return data.snippets || ["Did you know this was hidden?", "The secret is in the details."];
  } catch { return ["Unknown History", "Fact of the day"]; }
};

export const generateVisualPromptFromTopic = async (topic: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convert this topic into a highly descriptive cinematic visual prompt for an image generator: "${topic}".`,
  });
  return response.text?.trim() || topic;
};

export const fetchFactNarrative = async (): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Tell me one high-impact, mysterious historical fact that would be amazing to reveal in a puzzle. Under 100 characters.",
  });
  return response.text?.trim() || "A legendary historical event.";
};

export const getTrendingTopics = async (): Promise<string[]> => {
    const ai = getAIInstance();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "List 5 trending mystery, history, or science topics perfect for viral documentary shorts. JSON format.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ["topics"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      return data.topics || ["Ancient History", "Deep Space"];
    } catch { return ["Mystery Story", "Discovery"]; }
  };
