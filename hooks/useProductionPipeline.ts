
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArtStyle, PieceShape, PieceMaterial, MovementType, PuzzleState, UserPreferences, TopicType, StoryArc } from '../types';
import {
  generateArtImage,
  generateYouTubeMetadata,
  YouTubeMetadata,
  getTrendingTopics,
  generateVisualPromptFromTopic,
  generateDocumentarySnippets,
  fetchFactNarrative,
  findSmartMusic,
  generateCoherentContentPackage,
  findSmartMusicByMood
} from '../services/geminiService';
import { getJalaliDate } from '../utils/dateUtils';
import { MusicTrack } from '../components/sidebar/MusicUploader';
import { VIRAL_CATEGORIES } from '../components/sidebar/VisionInput';

export type PipelineStep = 'IDLE' | 'SCAN' | 'MUSIC' | 'SYNTH' | 'METADATA' | 'THUMBNAIL' | 'ANIMATE' | 'RECORDING' | 'PACKAGING';

const CLOUDFLARE_WORKER_URL = 'https://plain-tooth-75c3.jujube-bros.workers.dev/';

interface QueueItem {
  duration: number;
  source: 'BREAKING' | 'VIRAL' | 'NARRATIVE';
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
  const [state, setState] = useState<PuzzleState & {
    audioError: boolean;
    isAutoMode: boolean;
    pipelineStep: PipelineStep;
    isFullPackage: boolean;
    queue: QueueItem[];
    currentQueueIdx: number;
    docSnippets: string[];
    storyArc: StoryArc | null;
  }>({
    isGenerating: false,
    isSolving: false,
    isRecording: false,
    progress: 0,
    imageUrl: null,
    error: null,
    audioError: false,
    isAutoMode: false,
    pipelineStep: 'IDLE',
    isFullPackage: false,
    queue: [],
    currentQueueIdx: -1,
    docSnippets: [],
    storyArc: null
  });

  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const isExportingRef = useRef(false);

  const downloadFile = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
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
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` }
    ];
    for (const p of proxies) {
      try {
        const res = await fetch(p.url);
        if (res.ok) {
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) { console.warn("Proxy fail:", p.url); }
    }
    return null;
  };

  const executePackaging = useCallback(async (videoBlob: Blob) => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;

    const jalali = getJalaliDate();
    const cleanTitle = (metadata?.title || 'Studio_Project').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
    const baseFileName = `${jalali}_${cleanTitle}`;

    try {
      downloadFile(`${baseFileName}_Video.${videoBlob.type.includes('mp4') ? 'mp4' : 'webm'}`, videoBlob);
      if (metadata) {
        await new Promise(r => setTimeout(r, 1500));
        downloadFile(`${baseFileName}_Metadata.txt`, new Blob([`TITLE: ${metadata.title}\n\nDESC: ${metadata.description}`], { type: 'text/plain' }));
      }
      if (thumbnailDataUrl) {
        await new Promise(r => setTimeout(r, 1500));
        const res = await fetch(thumbnailDataUrl);
        downloadFile(`${baseFileName}_Thumbnail.jpg`, await res.blob());
      }
    } finally {
      setLastVideoBlob(null);
      isExportingRef.current = false;
      setTimeout(() => {
        setState(prev => {
          const nextIdx = prev.currentQueueIdx + 1;
          const hasNext = prev.isFullPackage && nextIdx < prev.queue.length;
          return { 
            ...prev, 
            currentQueueIdx: hasNext ? nextIdx : -1, 
            pipelineStep: 'IDLE', 
            isAutoMode: hasNext, 
            isFullPackage: hasNext,
            isSolving: false, isRecording: false, progress: 0, imageUrl: hasNext ? prev.imageUrl : null
          };
        });
      }, 2500);
    }
  }, [metadata, thumbnailDataUrl]);

  useEffect(() => {
    if (state.pipelineStep === 'PACKAGING' && lastVideoBlob && !isExportingRef.current) {
      executePackaging(lastVideoBlob);
    }
  }, [state.pipelineStep, lastVideoBlob, executePackaging]);

  const processPipelineItem = useCallback(async (item: QueueItem, isManualOverride: boolean = false) => {
    setState(s => ({ ...s, pipelineStep: 'SCAN', isGenerating: true, error: null, imageUrl: isManualOverride ? s.imageUrl : null, progress: 0, storyArc: null }));

    setLastVideoBlob(null);
    setMetadata(null);
    setThumbnailDataUrl(null);

    try {
      let sourceSubject = preferences.subject;
      let activeTopicType = TopicType.MANUAL;
      let categoryLabel = "Custom";

      if (!isManualOverride && state.isAutoMode) {
        if (item.source === 'VIRAL') {
          const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];

          console.log(`🎯 Using NEW Coherent Content Package System for: ${randomNiche.label}`);
          const contentPackage = await generateCoherentContentPackage(randomNiche.topic, randomNiche.label);

          sourceSubject = contentPackage.visualPrompt;
          activeTopicType = TopicType.VIRAL;
          categoryLabel = contentPackage.theme.category;

          setState(s => ({ ...s, pipelineStep: 'MUSIC' }));
          const trackData = await findSmartMusicByMood(contentPackage.theme.musicMood, sourceSubject);
          if (trackData && trackData.url) {
            const blobUrl = await fetchAudioBlob(trackData.url);
            if (blobUrl) {
              onAddCloudTrack(blobUrl, trackData.title);
              setActiveTrackName(trackData.title);
            }
          }

          setState(s => ({ ...s, pipelineStep: 'SYNTH' }));
          const finalStyle = Object.values(ArtStyle)[Math.floor(Math.random() * 8)];
          const art = await generateArtImage(finalStyle, contentPackage.visualPrompt);

          setPreferences(p => ({
            ...p,
            subject: sourceSubject,
            style: finalStyle,
            topicType: activeTopicType,
            topicCategory: categoryLabel,
            narrativeLens: contentPackage.theme.narrativeLens
          }));

          setState(s => ({
            ...s,
            imageUrl: art.imageUrl,
            storyArc: contentPackage.storyArc,
            docSnippets: [],
            isGenerating: false,
            pipelineStep: 'METADATA'
          }));

          setIsMetadataLoading(true);
          setMetadata(contentPackage.metadata);
          setIsMetadataLoading(false);

          setState(s => ({ ...s, pipelineStep: 'THUMBNAIL' }));

          if (state.isAutoMode) {
            setTimeout(() => setState(s => ({ ...s, isSolving: true, isRecording: true, pipelineStep: 'RECORDING' })), 3000);
          } else {
            setState(s => ({ ...s, pipelineStep: 'IDLE' }));
          }

        } else if (item.source === 'NARRATIVE') {
          sourceSubject = await fetchFactNarrative();
          activeTopicType = TopicType.NARRATIVE;

          const visualPrompt = await generateVisualPromptFromTopic(sourceSubject, NarrativeLens.ORIGIN_STORY);

          setState(s => ({ ...s, pipelineStep: 'MUSIC' }));
          const trackData = await findSmartMusic(visualPrompt);
          if (trackData && trackData.url) {
            const blobUrl = await fetchAudioBlob(trackData.url);
            if (blobUrl) {
              onAddCloudTrack(blobUrl, trackData.title);
              setActiveTrackName(trackData.title);
            }
          }

          setState(s => ({ ...s, pipelineStep: 'SYNTH' }));
          const finalStyle = Object.values(ArtStyle)[Math.floor(Math.random() * 8)];
          const [art, snippets] = await Promise.all([
            generateArtImage(finalStyle, visualPrompt),
            generateDocumentarySnippets(visualPrompt)
          ]);

          setPreferences(p => ({ ...p, subject: visualPrompt, style: finalStyle, topicType: activeTopicType }));
          setState(s => ({ ...s, imageUrl: art.imageUrl, docSnippets: snippets, isGenerating: false, pipelineStep: 'METADATA' }));

          setIsMetadataLoading(true);
          const meta = await generateYouTubeMetadata(visualPrompt, finalStyle);
          setMetadata(meta);
          setIsMetadataLoading(false);

          setState(s => ({ ...s, pipelineStep: 'THUMBNAIL' }));

          if (state.isAutoMode) {
            setTimeout(() => setState(s => ({ ...s, isSolving: true, isRecording: true, pipelineStep: 'RECORDING' })), 3000);
          } else {
            setState(s => ({ ...s, pipelineStep: 'IDLE' }));
          }
        }
      } else {
        const visualPrompt = await generateVisualPromptFromTopic(sourceSubject);

        setState(s => ({ ...s, pipelineStep: 'MUSIC' }));
        const trackData = await findSmartMusic(visualPrompt);
        if (trackData && trackData.url) {
          const blobUrl = await fetchAudioBlob(trackData.url);
          if (blobUrl) {
            onAddCloudTrack(blobUrl, trackData.title);
            setActiveTrackName(trackData.title);
          }
        }

        setState(s => ({ ...s, pipelineStep: 'SYNTH' }));
        const finalStyle = preferences.style;
        const [art, snippets] = await Promise.all([
          generateArtImage(finalStyle, visualPrompt),
          generateDocumentarySnippets(visualPrompt)
        ]);

        setPreferences(p => ({ ...p, subject: visualPrompt }));
        setState(s => ({ ...s, imageUrl: art.imageUrl, docSnippets: snippets, isGenerating: false, pipelineStep: 'METADATA' }));

        setIsMetadataLoading(true);
        const meta = await generateYouTubeMetadata(visualPrompt, finalStyle);
        setMetadata(meta);
        setIsMetadataLoading(false);

        setState(s => ({ ...s, pipelineStep: 'THUMBNAIL' }));
        setState(s => ({ ...s, pipelineStep: 'IDLE' }));
      }
    } catch (e) {
      console.error("Pipeline error:", e);
      setState(s => ({ ...s, isAutoMode: false, isGenerating: false, pipelineStep: 'IDLE', error: "Neural Engine Sync Error" }));
    }
  }, [preferences, state.isAutoMode, onAddCloudTrack, setActiveTrackName, setPreferences, fetchAudioBlob]);

  const toggleAutoMode = useCallback(() => {
    setState(s => {
      const active = !s.isAutoMode;
      return { 
        ...s, 
        isAutoMode: active, 
        isFullPackage: active,
        pipelineStep: active ? 'IDLE' : s.pipelineStep,
        queue: active ? [
          { duration: 0.5, source: 'VIRAL', pieceCount: 200 },
          { duration: 1.0, source: 'NARRATIVE', pieceCount: 500 },
          { duration: 1.0, source: 'VIRAL', pieceCount: 500 }
        ] : s.queue,
        currentQueueIdx: active ? 0 : s.currentQueueIdx
      };
    });
  }, []);

  useEffect(() => {
    if (state.isAutoMode && state.pipelineStep === 'IDLE' && state.currentQueueIdx !== -1) {
      processPipelineItem(state.queue[state.currentQueueIdx], false);
    }
  }, [state.isAutoMode, state.pipelineStep, state.currentQueueIdx, processPipelineItem]);

  return { state, setState, metadata, isMetadataLoading, thumbnailDataUrl, setThumbnailDataUrl, setLastVideoBlob, processPipelineItem, toggleAutoMode };
};
