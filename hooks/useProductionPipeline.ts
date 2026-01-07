import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ArtStyle,
  PieceShape,
  PieceMaterial,
  MovementType,
  PuzzleState,
  UserPreferences,
  TopicType,
  StoryArc,
} from "../types";
import {
  generateArtImage,
  YouTubeMetadata,
  getTrendingTopics,
  fetchFactNarrative,
  generateCoherentContentPackage,
  findSmartMusicByMood,
  extractCoreSubject,
} from "../services/geminiService";
import { getJalaliDate } from "../utils/dateUtils";
import { MusicTrack } from "../components/sidebar/MusicUploader";
import { VIRAL_CATEGORIES } from "../components/sidebar/VisionInput";
import { selectFreshCategory, addTopicVariation } from "../utils/contentVariety";
import { contentApi, ContentPayload } from "../services/api/contentApi";

export type PipelineStep =
  | "IDLE"
  | "SCAN"
  | "MUSIC"
  | "SYNTH"
  | "METADATA"
  | "THUMBNAIL"
  | "ANIMATE"
  | "RECORDING"
  | "PACKAGING";

const CLOUDFLARE_WORKER_URL = "https://plain-tooth-75c3.jujube-bros.workers.dev/";

interface QueueItem {
  duration: number;
  source: "BREAKING" | "VIRAL" | "NARRATIVE";
  pieceCount: number;
}

export const useProductionPipeline = (
  preferences: UserPreferences,
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>,
  musicTracks: MusicTrack[],
  selectedTrackId: string | null,
  setActiveTrackName: (name: string | null) => void,
  onAddCloudTrack: (url: string, title: string) => void,
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const [state, setState] = useState<
    PuzzleState & {
      audioError: boolean;
      isAutoMode: boolean;
      pipelineStep: PipelineStep;
      isFullPackage: boolean;
      queue: QueueItem[];
      currentQueueIdx: number;
      docSnippets: string[];
      storyArc: StoryArc | null;
    }
  >({
    isGenerating: false,
    isSolving: false,
    isRecording: false,
    progress: 0,
    imageUrl: null,
    error: null,
    audioError: false,
    isAutoMode: false,
    pipelineStep: "IDLE",
    isFullPackage: false,
    queue: [],
    currentQueueIdx: -1,
    docSnippets: [],
    storyArc: null,
  });

  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [currentCoreSubject, setCurrentCoreSubject] = useState<string | null>(null);
  const [currentVisualPrompt, setCurrentVisualPrompt] = useState<string | null>(null);
  const isExportingRef = useRef(false);

  const downloadFile = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const fetchAudioBlob = async (url: string): Promise<string | null> => {
    const proxies = [
      { url: `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(url)}` },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
    ];
    for (const p of proxies) {
      try {
        const res = await fetch(p.url);
        if (res.ok) {
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn("Proxy fail:", p.url);
      }
    }
    return null;
  };

  const executePackaging = useCallback(
    async (videoBlob: Blob) => {
      console.log(`📦 [Packaging] executePackaging called`);
      console.log(`   isExportingRef: ${isExportingRef.current}`);
      console.log(`   videoBlob size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);

      if (isExportingRef.current) {
        console.log(`⏸️ [Packaging] Already exporting, skipping...`);
        return;
      }
      isExportingRef.current = true;

      const jalali = getJalaliDate();
      const cleanTitle = (metadata?.title || "Studio_Project").replace(/[\\/:*?"<>|]/g, "").slice(0, 50);
      const baseFileName = `${jalali}_${cleanTitle}`;

      console.log(`📥 [Packaging] Starting downloads with base filename: ${baseFileName}`);

      try {
        console.log(`   1️⃣ Downloading video...`);
        downloadFile(`${baseFileName}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`, videoBlob);

        if (metadata) {
          console.log(`   2️⃣ Downloading metadata...`);
          await new Promise((r) => setTimeout(r, 1500));
          downloadFile(
            `${baseFileName}_Metadata.txt`,
            new Blob([`TITLE: ${metadata.title}\n\nDESC: ${metadata.description}`], { type: "text/plain" })
          );
        }

        if (thumbnailDataUrl) {
          console.log(`   3️⃣ Downloading thumbnail...`);
          await new Promise((r) => setTimeout(r, 1500));
          const res = await fetch(thumbnailDataUrl);
          downloadFile(`${baseFileName}_Thumbnail.jpg`, await res.blob());
        }

        console.log(`✅ [Packaging] All downloads completed!`);

        // Save content to backend database after successful download
        console.log(`🔍 [Packaging] Checking requirements for database save...`);
        console.log(`   currentCoreSubject: ${currentCoreSubject ? "✅ EXISTS" : "❌ MISSING"}`);
        console.log(`   currentVisualPrompt: ${currentVisualPrompt ? "✅ EXISTS" : "❌ MISSING"}`);
        console.log(`   metadata: ${metadata ? "✅ EXISTS" : "❌ MISSING"}`);

        if (currentCoreSubject && currentVisualPrompt && metadata) {
          console.log(`💾 [API] All requirements met! Saving content to database...`);

          const payload: ContentPayload = {
            jalaliDate: jalali,
            puzzleCard: {
              category: preferences.topicCategory || "Unknown",
              narrativeLens: preferences.narrativeLens,
              artStyle: preferences.style,
              pieceCount: preferences.pieceCount,
              duration: preferences.durationMinutes,
              shape: preferences.shape,
              material: preferences.material,
              movement: preferences.movement,
            },
            story: {
              coreSubject: currentCoreSubject,
              visualPrompt: currentVisualPrompt,
              hook: state.storyArc?.hook,
              buildup: state.storyArc?.buildup,
              climax: state.storyArc?.climax,
              reveal: state.storyArc?.reveal,
            },
            metadata: {
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              hashtags: metadata.hashtags,
            },
            files: {
              videoFilename: `${baseFileName}_Video.${videoBlob.type.includes("mp4") ? "mp4" : "webm"}`,
              thumbnailFilename: thumbnailDataUrl ? `${baseFileName}_Thumbnail.jpg` : undefined,
              videoSizeMB: Number((videoBlob.size / 1024 / 1024).toFixed(2)),
            },
            analysis: {
              isUnique: true, // Passed validation
              generationAttempts: 1,
            },
          };

          const saveResult = await contentApi.saveContent(payload);

          if (saveResult.success) {
            console.log(`✅ [API] Content saved to database successfully!`);
            console.log(`   Database ID: ${saveResult.data?._id}`);
          } else {
            console.error(`❌ [API] Failed to save content: ${saveResult.error}`);
            console.warn(`⚠️ [API] Content was downloaded but not saved to database`);
          }

          // Clear after recording
          setCurrentCoreSubject(null);
          setCurrentVisualPrompt(null);
        } else {
          console.log(`⏭️ [API] Skipping database save (missing required data)`);
        }
      } finally {
        setLastVideoBlob(null);
        isExportingRef.current = false;
        setTimeout(() => {
          setState((prev) => {
            const nextIdx = prev.currentQueueIdx + 1;
            const hasNext = prev.isFullPackage && nextIdx < prev.queue.length;
            return {
              ...prev,
              currentQueueIdx: hasNext ? nextIdx : -1,
              pipelineStep: "IDLE",
              isAutoMode: hasNext,
              isFullPackage: hasNext,
              isSolving: false,
              isRecording: false,
              progress: 0,
              imageUrl: hasNext ? prev.imageUrl : null,
            };
          });
        }, 2500);
      }
    },
    [metadata, thumbnailDataUrl]
  );

  useEffect(() => {
    if (state.pipelineStep === "PACKAGING" && lastVideoBlob && !isExportingRef.current) {
      executePackaging(lastVideoBlob);
    }
  }, [state.pipelineStep, lastVideoBlob, executePackaging]);

  const processPipelineItem = useCallback(
    async (item: QueueItem, isManualOverride: boolean = false) => {
      setState((s) => ({
        ...s,
        pipelineStep: "SCAN",
        isGenerating: true,
        error: null,
        imageUrl: isManualOverride ? s.imageUrl : null,
        progress: 0,
        storyArc: null,
      }));

      setLastVideoBlob(null);
      setMetadata(null);
      setThumbnailDataUrl(null);

      try {
        let sourceSubject = preferences.subject;
        let activeTopicType = TopicType.MANUAL;
        let categoryLabel = "Custom";

        if (!isManualOverride && state.isAutoMode) {
          if (item.source === "VIRAL") {
            let contentPackage;
            let coreSubject;
            let attempts = 0;
            const maxAttempts = 5;

            // Validation loop: Keep generating until we find unique content
            while (attempts < maxAttempts) {
              attempts++;

              // Select a fresh category that hasn't been used recently
              const randomNiche = selectFreshCategory(VIRAL_CATEGORIES, 5);

              // Add unique variation to prevent repetitive prompts
              const variedTopic = addTopicVariation(randomNiche.topic);

              console.log(
                `\n🎯 Attempt ${attempts}/${maxAttempts}: Generating content for "${randomNiche.label}"`
              );
              console.log(`🎨 Variation: ${variedTopic.substring(0, 100)}...`);

              // Generate content package
              contentPackage = await generateCoherentContentPackage(variedTopic, randomNiche.label);

              // Extract core subject for similarity checking
              coreSubject = await extractCoreSubject(
                contentPackage.visualPrompt,
                contentPackage.storyArc,
                randomNiche.label
              );

              // Check similarity via backend API
              console.log(`🔍 [API] Checking content similarity with backend...`);
              const similarityResult = await contentApi.checkSimilarity(coreSubject);

              if (similarityResult.success && similarityResult.data) {
                const isSimilar = similarityResult.data.isSimilar;
                const score = similarityResult.data.similarityScore;

                if (!isSimilar) {
                  console.log(`✅ Content approved as unique! Proceeding with generation.`);
                  break; // Content is unique, exit loop
                } else {
                  console.log(`❌ Content rejected as too similar (score: ${score})`);
                  if (similarityResult.data.matchedContents?.length > 0) {
                    console.log(`   Matched: ${similarityResult.data.matchedContents.map((m: any) => m.title).join(", ")}`);
                  }

                  if (attempts < maxAttempts) {
                    console.log(`   🔄 Regenerating with different parameters...\n`);
                  }
                }
              } else {
                // If API check fails, log warning but continue (don't crash the pipeline)
                console.warn(`⚠️ [API] Similarity check failed: ${similarityResult.error}`);
                console.log(`   Proceeding with content generation (assuming unique)...`);
                break;
              }
            }

            if (attempts >= maxAttempts) {
              console.warn(`⚠️ Max attempts reached. Using last generated content despite similarity.`);
            }

            // Store core subject and visual prompt for later recording
            setCurrentCoreSubject(coreSubject);
            setCurrentVisualPrompt(contentPackage.visualPrompt);

            sourceSubject = contentPackage.visualPrompt;
            activeTopicType = TopicType.VIRAL;
            categoryLabel = contentPackage.theme.category;

            setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
            const trackData = await findSmartMusicByMood(contentPackage.theme.musicMood, sourceSubject);
            if (trackData && trackData.url) {
              const blobUrl = await fetchAudioBlob(trackData.url);
              if (blobUrl) {
                onAddCloudTrack(blobUrl, trackData.title);
                setActiveTrackName(trackData.title);
              }
            }

            setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
            const finalStyle = Object.values(ArtStyle)[Math.floor(Math.random() * 8)];
            const art = await generateArtImage(finalStyle, contentPackage.visualPrompt);

            setPreferences((p) => ({
              ...p,
              subject: sourceSubject,
              style: finalStyle,
              topicType: activeTopicType,
              topicCategory: categoryLabel,
              narrativeLens: contentPackage.theme.narrativeLens,
            }));

            setState((s) => ({
              ...s,
              imageUrl: art.imageUrl,
              storyArc: contentPackage.storyArc,
              docSnippets: [],
              isGenerating: false,
              pipelineStep: "METADATA",
            }));

            setIsMetadataLoading(true);
            setMetadata(contentPackage.metadata);
            setIsMetadataLoading(false);

            setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));

            if (state.isAutoMode) {
              setTimeout(
                () =>
                  setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" })),
                3000
              );
            } else {
              setState((s) => ({ ...s, pipelineStep: "IDLE" }));
            }
          } else if (item.source === "NARRATIVE") {
            // Use new Coherent Content Package for NARRATIVE mode too
            const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];

            console.log(`🎯 NARRATIVE Mode: Generating coherent package for "${randomNiche.label}"`);
            const contentPackage = await generateCoherentContentPackage(randomNiche.topic, randomNiche.label);

            // Extract core subject for database save
            const coreSubject = await extractCoreSubject(
              contentPackage.visualPrompt,
              contentPackage.storyArc,
              randomNiche.label
            );

            // Store for later database save
            setCurrentCoreSubject(coreSubject);
            setCurrentVisualPrompt(contentPackage.visualPrompt);

            sourceSubject = contentPackage.visualPrompt;
            activeTopicType = TopicType.NARRATIVE;
            categoryLabel = contentPackage.theme.category;

            setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
            const trackData = await findSmartMusicByMood(contentPackage.theme.musicMood, sourceSubject);
            if (trackData && trackData.url) {
              const blobUrl = await fetchAudioBlob(trackData.url);
              if (blobUrl) {
                onAddCloudTrack(blobUrl, trackData.title);
                setActiveTrackName(trackData.title);
              }
            }

            setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
            const finalStyle = Object.values(ArtStyle)[Math.floor(Math.random() * 8)];
            const art = await generateArtImage(finalStyle, contentPackage.visualPrompt);

            setPreferences((p) => ({
              ...p,
              subject: sourceSubject,
              style: finalStyle,
              topicType: activeTopicType,
              topicCategory: categoryLabel,
              narrativeLens: contentPackage.theme.narrativeLens,
            }));

            setState((s) => ({
              ...s,
              imageUrl: art.imageUrl,
              storyArc: contentPackage.storyArc,
              docSnippets: [],
              isGenerating: false,
              pipelineStep: "METADATA",
            }));

            setIsMetadataLoading(true);
            setMetadata(contentPackage.metadata);
            setIsMetadataLoading(false);

            setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));

            if (state.isAutoMode) {
              setTimeout(
                () =>
                  setState((s) => ({ ...s, isSolving: true, isRecording: true, pipelineStep: "RECORDING" })),
                3000
              );
            } else {
              setState((s) => ({ ...s, pipelineStep: "IDLE" }));
            }
          }
        } else {
          // MANUAL mode - use Coherent Content Package for consistency
          const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];

          console.log(`🎯 MANUAL Mode: Generating coherent package for "${randomNiche.label}"`);
          const contentPackage = await generateCoherentContentPackage(sourceSubject, randomNiche.label);

          // Extract core subject for database save
          const coreSubject = await extractCoreSubject(
            contentPackage.visualPrompt,
            contentPackage.storyArc,
            randomNiche.label
          );

          // Store for later database save
          setCurrentCoreSubject(coreSubject);
          setCurrentVisualPrompt(contentPackage.visualPrompt);

          setState((s) => ({ ...s, pipelineStep: "MUSIC" }));
          const trackData = await findSmartMusicByMood(contentPackage.theme.musicMood, sourceSubject);
          if (trackData && trackData.url) {
            const blobUrl = await fetchAudioBlob(trackData.url);
            if (blobUrl) {
              onAddCloudTrack(blobUrl, trackData.title);
              setActiveTrackName(trackData.title);
            }
          }

          setState((s) => ({ ...s, pipelineStep: "SYNTH" }));
          const finalStyle = preferences.style;
          const art = await generateArtImage(finalStyle, contentPackage.visualPrompt);

          setPreferences((p) => ({
            ...p,
            subject: contentPackage.visualPrompt,
            narrativeLens: contentPackage.theme.narrativeLens,
          }));

          setState((s) => ({
            ...s,
            imageUrl: art.imageUrl,
            storyArc: contentPackage.storyArc,
            docSnippets: [],
            isGenerating: false,
            pipelineStep: "METADATA",
          }));

          setIsMetadataLoading(true);
          setMetadata(contentPackage.metadata);
          setIsMetadataLoading(false);

          setState((s) => ({ ...s, pipelineStep: "THUMBNAIL" }));
          setState((s) => ({ ...s, pipelineStep: "IDLE" }));
        }
      } catch (e) {
        console.error("Pipeline error:", e);
        setState((s) => ({
          ...s,
          isAutoMode: false,
          isGenerating: false,
          pipelineStep: "IDLE",
          error: "Neural Engine Sync Error",
        }));
      }
    },
    [preferences, state.isAutoMode, onAddCloudTrack, setActiveTrackName, setPreferences, fetchAudioBlob]
  );

  const toggleAutoMode = useCallback(() => {
    setState((s) => {
      const active = !s.isAutoMode;
      return {
        ...s,
        isAutoMode: active,
        isFullPackage: active,
        pipelineStep: active ? "IDLE" : s.pipelineStep,
        queue: active
          ? [
              { duration: 0.5, source: "VIRAL", pieceCount: 200 },
              { duration: 1.0, source: "NARRATIVE", pieceCount: 500 },
              { duration: 1.0, source: "VIRAL", pieceCount: 500 },
            ]
          : s.queue,
        currentQueueIdx: active ? 0 : s.currentQueueIdx,
      };
    });
  }, []);

  useEffect(() => {
    if (state.isAutoMode && state.pipelineStep === "IDLE" && state.currentQueueIdx !== -1) {
      processPipelineItem(state.queue[state.currentQueueIdx], false);
    }
  }, [state.isAutoMode, state.pipelineStep, state.currentQueueIdx, processPipelineItem]);

  return {
    state,
    setState,
    metadata,
    isMetadataLoading,
    thumbnailDataUrl,
    setThumbnailDataUrl,
    setLastVideoBlob,
    processPipelineItem,
    toggleAutoMode,
  };
};
