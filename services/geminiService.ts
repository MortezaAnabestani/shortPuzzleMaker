/**
 * Gemini AI Service Hub
 *
 * Central export point for all AI-powered services
 * Individual services are organized in the /ai directory
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ArtStyle, NarrativeLens, MusicMood, StoryArc, ContentTheme } from "../types";

// ==================== TYPE EXPORTS ====================
export type {
  ArtGenerationResponse,
  YouTubeMetadata,
  SmartMusicTrack,
  EnhancedContentPackage,
  ContentSimilarityCheck
} from "./types/serviceTypes";

// ==================== MODULE RE-EXPORTS ====================

// Art Generation
export { generateArtImage } from "./ai/artGeneration";

// Music Selection
export { findSmartMusicByMood, findSmartMusic, SONIC_LIBRARY } from "./ai/musicSelection";

// Story Arc & Visual Prompts
export {
  generateCoherentStoryArc,
  generateVisualPromptFromTopic,
  generateDocumentarySnippets
} from "./ai/storyArc";

// Content Validation
export { extractCoreSubject, checkContentSimilarity } from "./ai/contentValidation";

// ==================== LOCAL FUNCTIONS ====================
// Functions that are too small or tightly coupled to extract

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate coherent content package with all elements aligned
 */
export const generateCoherentContentPackage = async (
  category: string,
  categoryLabel: string
) => {
  const narrativeLenses = Object.values(NarrativeLens);
  const selectedLens = narrativeLenses[Math.floor(Math.random() * narrativeLenses.length)];

  const musicMoods = Object.values(MusicMood);
  const selectedMood = musicMoods[Math.floor(Math.random() * musicMoods.length)];

  console.log(`Generating coherent package: ${categoryLabel} with ${selectedLens} lens and ${selectedMood} mood`);

  const { generateCoherentStoryArc } = await import("./ai/storyArc");
  const { generateVisualPromptFromTopic } = await import("./ai/storyArc");

  const storyArc = await generateCoherentStoryArc(category, selectedLens);
  const visualPrompt = await generateVisualPromptFromTopic(category, selectedLens);
  const metadata = await generateEnhancedMetadata(category, storyArc, selectedLens, categoryLabel);

  const theme: ContentTheme = {
    category: categoryLabel,
    topic: category,
    visualElements: [],
    keyFacts: [storyArc.hook, ...storyArc.buildup, storyArc.climax, storyArc.reveal],
    narrativeLens: selectedLens,
    musicMood: selectedMood
  };

  return {
    theme,
    storyArc,
    visualPrompt,
    metadata
  };
};

/**
 * Generate enhanced YouTube metadata with CTR optimization
 */
export const generateEnhancedMetadata = async (
  topic: string,
  storyArc: StoryArc,
  narrativeLens: NarrativeLens,
  category: string
) => {
  const ai = getAIInstance();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create strategic YouTube Shorts metadata for a puzzle reveal video.

      Topic: "${topic}"
      Category: ${category}
      Narrative Style: ${narrativeLens}
      Story Hook: ${storyArc.hook}
      Story Reveal: ${storyArc.reveal}

      TITLE STRATEGY:
      - Must create curiosity gap (promise revelation without spoiling)
      - Use power words: Secret, Hidden, Why, Truth, Mystery, Revealed
      - Keep under 60 characters
      - Must match what the video actually delivers
      - Example patterns:
        * "The Secret Behind [X] Revealed"
        * "Why [X] Does [Y] - The Truth"
        * "Hidden Truth About [X]"
        * "[X] vs [Y]: The Shocking Reality"

      DESCRIPTION STRATEGY:
      - First sentence: Expand on the title's promise
      - Second: Hint at the journey (the buildup)
      - Third: Tease the reveal without spoiling
      - Include 2-3 relevant hashtags at the end
      - Keep under 200 characters total

      TAGS STRATEGY:
      - Mix broad terms (3-4) with specific niche terms (4-5)
      - Include category-specific tags
      - Add trending format tags (shorts, viral, mystery)
      - Total 10 tags

      HASHTAGS (separate from tags):
      - 5 hashtags for YouTube Shorts algorithm
      - Mix popular (#Shorts) with niche specific

      Return JSON with all fields.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctr_strategy: { type: Type.STRING }
          },
          required: ["title", "description", "tags", "hashtags", "ctr_strategy"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Enhanced metadata generation failed:", e);
    return {
      title: "Mystery Revealed",
      description: "Discover the hidden truth.",
      tags: ["shorts", "mystery"],
      hashtags: ["#Shorts"],
      ctr_strategy: "Curiosity gap"
    };
  }
};

/**
 * @deprecated Use generateEnhancedMetadata instead
 */
export const generateYouTubeMetadata = async (subject: string, style: ArtStyle) => {
  console.warn("DEPRECATED: Use generateEnhancedMetadata instead");
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
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ctr_strategy: { type: Type.STRING }
          },
          required: ["title", "description", "tags", "ctr_strategy"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return { ...data, hashtags: data.hashtags || ["#Shorts"] };
  } catch { return { title: "New Discovery", description: "History revealed.", tags: ["shorts"], hashtags: ["#Shorts"], ctr_strategy: "Mystery" }; }
};

/**
 * Fetch a random fact narrative
 */
export const fetchFactNarrative = async (): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Tell me one high-impact, mysterious historical fact that would be amazing to reveal in a puzzle. Under 100 characters.",
  });
  return response.text?.trim() || "A legendary historical event.";
};

/**
 * Get trending topics (placeholder for future implementation)
 */
export const getTrendingTopics = async (): Promise<string[]> => {
    const ai = getAIInstance();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "List 5 trending mysterious or fascinating topics that would make great puzzle video themes. Return as JSON array.",
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
      return data.topics || ["Ancient mysteries", "Ocean depths", "Space wonders"];
    } catch {
      return ["Ancient mysteries", "Ocean depths", "Space wonders", "Lost civilizations", "Nature phenomena"];
    }
};
