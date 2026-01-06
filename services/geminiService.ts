
import { GoogleGenAI, Type } from "@google/genai";
import { ArtStyle, NarrativeLens, MusicMood, StoryArc, ContentTheme } from "../types";

export interface ArtGenerationResponse {
  imageUrl: string;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  ctr_strategy: string;
}

export interface SmartMusicTrack {
  title: string;
  url: string;
  source: string;
}

export interface EnhancedContentPackage {
  theme: ContentTheme;
  storyArc: StoryArc;
  visualPrompt: string;
  metadata: YouTubeMetadata;
}

export const SONIC_LIBRARY = [
  { id: 'sc-1', title: 'Deep Ambient Mystery', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Documentary' },
  { id: 'sc-2', title: 'Cinematic History', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Cinematic' },
  { id: 'sc-3', title: 'Techno Discovery', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', genre: 'Electronic' },
  { id: 'sc-4', title: 'Ancient Echoes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Ambient' },
];

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findSmartMusicByMood = async (musicMood: MusicMood, topic: string): Promise<SmartMusicTrack | null> => {
  const ai = getAIInstance();

  const moodGuidance = {
    [MusicMood.MYSTERIOUS]: "Dark ambient, mysterious tones, subtle tension, slow tempo (50-70 BPM), minor key",
    [MusicMood.EPIC]: "Orchestral, cinematic, epic crescendos, medium-fast tempo (90-120 BPM), heroic brass",
    [MusicMood.CALM]: "Peaceful ambient, gentle piano, nature sounds, very slow tempo (40-60 BPM), major key",
    [MusicMood.SUSPENSE]: "Tense strings, building tension, dramatic pauses, medium tempo (70-90 BPM), dissonant chords",
    [MusicMood.INSPIRING]: "Uplifting, hopeful melody, warm strings, medium tempo (80-100 BPM), major key progression",
    [MusicMood.DARK]: "Intense, ominous, heavy bass, slow brooding tempo (50-70 BPM), dark minor progressions"
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find a 100% ROYALTY-FREE (YouTube Safe) direct MP3 download link for background music.

      Topic Context: "${topic}"
      Required Mood: ${musicMood}
      Musical Style: ${moodGuidance[musicMood]}

      STRICT REQUIREMENTS:
      1. Must match the mood exactly: ${moodGuidance[musicMood]}
      2. SOURCES: ONLY use direct links to .mp3 files from pixabay.com/music or incompetech.com
      3. NO YouTube video links, NO streaming services
      4. The mood must align with the narrative being told
      5. Instrumental only (no vocals)

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
    console.error("Smart music search failed:", e);
    return null;
  }
};

export const findSmartMusic = async (topic: string): Promise<SmartMusicTrack | null> => {
  console.warn("DEPRECATED: Use findSmartMusicByMood instead");
  return findSmartMusicByMood(MusicMood.MYSTERIOUS, topic);
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

export const generateCoherentContentPackage = async (
  category: string,
  categoryLabel: string
): Promise<EnhancedContentPackage> => {
  const ai = getAIInstance();

  const narrativeLenses = Object.values(NarrativeLens);
  const selectedLens = narrativeLenses[Math.floor(Math.random() * narrativeLenses.length)];

  const musicMoods = Object.values(MusicMood);
  const selectedMood = musicMoods[Math.floor(Math.random() * musicMoods.length)];

  console.log(`Generating coherent package: ${categoryLabel} with ${selectedLens} lens and ${selectedMood} mood`);

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

export const generateYouTubeMetadata = async (subject: string, style: ArtStyle): Promise<YouTubeMetadata> => {
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

export const generateCoherentStoryArc = async (topic: string, narrativeLens: NarrativeLens): Promise<StoryArc> => {
  const ai = getAIInstance();

  const lensInstructions = {
    [NarrativeLens.HIDDEN_DISCOVERY]: "Structure as a hidden mystery being revealed. Hook with what's hidden, build with clues, climax with the discovery moment, reveal the truth.",
    [NarrativeLens.WHY_MYSTERY]: "Structure as a 'why' question. Hook with puzzling behavior/phenomenon, build with evidence, climax with the mechanism, reveal the reason.",
    [NarrativeLens.COMPARISON]: "Structure as a before/after or X vs Y comparison. Hook with the contrast, build with differences, climax with the key distinction, reveal the winner/outcome.",
    [NarrativeLens.UNSOLVED_ENIGMA]: "Structure as an unsolved mystery. Hook with the enigma, build with theories, climax with the closest answer, reveal that it remains mysterious.",
    [NarrativeLens.TRANSFORMATION]: "Structure as a transformation journey. Hook with the before state, build with the process, climax with the change moment, reveal the after state.",
    [NarrativeLens.COUNTDOWN]: "Structure as a countdown (Top 3/5). Hook with category, build through items 3,2, climax with #1 reveal, final statement on the winner.",
    [NarrativeLens.ORIGIN_STORY]: "Structure as an origin tale. Hook with the current state, build with historical context, climax with the creation moment, reveal the legacy."
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a COHESIVE story arc for a puzzle reveal video about: "${topic}"

      Narrative Style: ${narrativeLens}
      ${lensInstructions[narrativeLens]}

      CRITICAL REQUIREMENTS:
      1. All 5 parts must tell ONE continuous story about the SAME subject
      2. Each snippet must flow naturally to the next
      3. Base everything on VERIFIABLE FACTS (cite sources if rare)
      4. Each text segment under 70 characters
      5. The climax must align with puzzle completion (90% mark)
      6. The reveal must be the satisfying answer/conclusion

      Return JSON with:
      {
        "hook": "Opening question or mystery setup",
        "buildup": ["fact 1", "fact 2", "fact 3"] (progressive reveal),
        "climax": "The peak moment/question resolution",
        "reveal": "Final answer/truth revealed"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            buildup: { type: Type.ARRAY, items: { type: Type.STRING } },
            climax: { type: Type.STRING },
            reveal: { type: Type.STRING }
          },
          required: ["hook", "buildup", "climax", "reveal"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return data as StoryArc;
  } catch (e) {
    console.error("StoryArc generation failed:", e);
    return {
      hook: "What secret lies hidden here?",
      buildup: ["Every piece holds a clue", "The pattern emerges slowly", "Almost there..."],
      climax: "The truth is revealed",
      reveal: "Now you know the secret"
    };
  }
};

export const generateDocumentarySnippets = async (topic: string): Promise<string[]> => {
  console.warn("DEPRECATED: Use generateCoherentStoryArc instead");
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

export const generateVisualPromptFromTopic = async (topic: string, narrativeLens: NarrativeLens): Promise<string> => {
  const ai = getAIInstance();

  const visualGuidance = {
    [NarrativeLens.HIDDEN_DISCOVERY]: "Focus on mysterious, partially hidden elements, dramatic reveal lighting, archaeological discovery aesthetics",
    [NarrativeLens.WHY_MYSTERY]: "Show the puzzling phenomenon in action, scientific observation style, question-provoking composition",
    [NarrativeLens.COMPARISON]: "Split composition or before/after layout, clear visual contrast, side-by-side comparison aesthetics",
    [NarrativeLens.UNSOLVED_ENIGMA]: "Enigmatic atmosphere, unanswered questions visual metaphor, mysterious shadows and fog",
    [NarrativeLens.TRANSFORMATION]: "Show transformation in progress, metamorphosis visual, dynamic change capture",
    [NarrativeLens.COUNTDOWN]: "Hero shot of the #1 item, trophy presentation style, winner spotlight aesthetics",
    [NarrativeLens.ORIGIN_STORY]: "Historical recreation, origin moment capture, genesis visual narrative"
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convert this topic into a SPECIFIC, DETAILED cinematic visual prompt for an image generator: "${topic}"

    Narrative Context: ${narrativeLens}
    Visual Style Guide: ${visualGuidance[narrativeLens]}

    Requirements:
    - Specify exact subject, setting, lighting, atmosphere
    - Include 3-5 specific visual elements that must appear
    - Mention color palette and mood
    - Optimize for 9:16 vertical composition
    - Make it cinematic and documentary-quality
    - Ensure the visual directly supports the story being told

    Return ONLY the detailed prompt, no explanations.`,
  });
  return response.text?.trim() || topic;
};

export const generateEnhancedMetadata = async (
  topic: string,
  storyArc: StoryArc,
  narrativeLens: NarrativeLens,
  category: string
): Promise<YouTubeMetadata> => {
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
      - Fourth: Call to action (watch till end, like, subscribe)
      - Keep under 300 characters
      - Use emojis strategically (max 3)

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
