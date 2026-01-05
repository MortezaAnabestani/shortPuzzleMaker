
import React, { useState, useCallback, useEffect } from 'react';
import { ArtStyle, PieceShape, PieceMaterial, MovementType, PuzzleState, UserPreferences, TopicType } from '../types';
import { generateArtImage, generateYouTubeMetadata, YouTubeMetadata, getTrendingTopics, generateVisualPromptFromTopic, generateDocumentarySnippets } from '../services/geminiService';
import { getJalaliDate } from '../utils/dateUtils';
import { MusicTrack } from '../components/sidebar/MusicUploader';
import { VIRAL_CATEGORIES } from '../components/sidebar/VisionInput';

export type PipelineStep = 'IDLE' | 'SCAN' | 'SYNTH' | 'METADATA' | 'THUMBNAIL' | 'ANIMATE' | 'RECORDING' | 'PACKAGING';

interface QueueItem {
  duration: number;
  source: 'BREAKING' | 'VIRAL';
  pieceCount: number;
}

export const useProductionPipeline = (
  preferences: UserPreferences,
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>,
  musicTracks: MusicTrack[],
  selectedTrackId: string | null,
  setActiveTrackName: (name: string | null) => void,
  directoryHandle: any, 
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const [state, setState] = useState<PuzzleState & { 
    audioError: boolean;
    isAutoMode: boolean;
    pipelineStep: PipelineStep;
    isFullPackage: boolean;
    queue: QueueItem[];
    currentQueueIdx: number;
    docSnippets: string[]; // ذخیره فکت‌ها
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
    docSnippets: []
  });

  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);

  const executePackaging = useCallback(async (videoBlob: Blob) => {
    if (state.pipelineStep !== 'PACKAGING') return;
    const jalali = getJalaliDate();
    const cleanTitle = metadata?.title.replace(/[\\/:*?"<>|]/g, '') || 'Video';
    const baseFileName = `${jalali}_${cleanTitle}`;
    try {
      const downloadFile = (name: string, blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      };
      if (metadata) {
        const content = `TITLE: ${metadata.title}\n\nDESCRIPTION:\n${metadata.description}\n\nTAGS: ${metadata.tags.join(', ')}`;
        downloadFile(`${baseFileName}_Metadata.txt`, new Blob([content], { type: 'text/plain' }));
      }
      if (thumbnailDataUrl) {
        const res = await fetch(thumbnailDataUrl);
        downloadFile(`${baseFileName}_Thumbnail.jpg`, await res.blob());
      }
      const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      downloadFile(`${baseFileName}_Video.${ext}`, videoBlob);
    } catch (err) { console.error("Packaging Failed:", err); }
    setLastVideoBlob(null);
    setTimeout(() => {
      setState(prev => {
        const nextIdx = prev.currentQueueIdx + 1;
        const hasNext = prev.isFullPackage && nextIdx < prev.queue.length;
        return { 
          ...prev, 
          currentQueueIdx: hasNext ? nextIdx : -1, 
          pipelineStep: 'IDLE', 
          isAutoMode: hasNext, 
          isFullPackage: hasNext ? prev.isFullPackage : false,
          isSolving: false, isRecording: false, imageUrl: null, progress: 0, queue: hasNext ? prev.queue : []
        };
      });
    }, 2000);
  }, [state.pipelineStep, metadata, thumbnailDataUrl]);

  useEffect(() => {
    if (state.pipelineStep === 'PACKAGING' && lastVideoBlob) executePackaging(lastVideoBlob);
  }, [state.pipelineStep, lastVideoBlob, executePackaging]);

  const processPipelineItem = useCallback(async (item: QueueItem, isManualOverride: boolean = false) => {
    setState(s => ({ 
      ...s, 
      pipelineStep: 'SCAN', 
      isGenerating: true, 
      error: null, 
      imageUrl: isManualOverride ? s.imageUrl : null, 
      progress: 0, 
      isSolving: false, 
      isRecording: false 
    }));
    
    setLastVideoBlob(null);
    if (musicTracks.length > 0) {
      const track = selectedTrackId 
        ? (musicTracks.find(t => t.id === selectedTrackId) || musicTracks[0]) 
        : musicTracks[Math.max(0, state.currentQueueIdx) % musicTracks.length];
      setActiveTrackName(track.name);
      if (audioRef.current) { audioRef.current.src = track.url; audioRef.current.load(); }
    }
    try {
      let visualPrompt = "";
      let activeTopicType = TopicType.MANUAL;
      let activeCategoryLabel = preferences.topicCategory;
      let sourceSubject = preferences.subject;
      if (!isManualOverride && state.isAutoMode) {
        if (item.source === 'VIRAL') {
          const randomNiche = VIRAL_CATEGORIES[Math.floor(Math.random() * VIRAL_CATEGORIES.length)];
          sourceSubject = randomNiche.topic;
          activeCategoryLabel = randomNiche.label;
          activeTopicType = TopicType.VIRAL;
        } else if (item.source === 'BREAKING') {
          sourceSubject = (await getTrendingTopics())[0] || "Global Innovation";
          activeTopicType = TopicType.BREAKING;
          activeCategoryLabel = "Breaking News";
        }
      } else { activeTopicType = preferences.topicType || TopicType.MANUAL; }
      
      visualPrompt = await generateVisualPromptFromTopic(sourceSubject);
      
      setState(s => ({ ...s, pipelineStep: 'SYNTH', imageUrl: isManualOverride ? s.imageUrl : null }));
      
      const useRandom = !isManualOverride && state.isAutoMode;
      const finalStyle = useRandom ? Object.values(ArtStyle)[Math.floor(Math.random() * Object.values(ArtStyle).length)] : preferences.style;
      const finalMovement = useRandom ? Object.values(MovementType)[Math.floor(Math.random() * Object.values(MovementType).length)] : preferences.movement;
      const finalMaterial = useRandom ? Object.values(PieceMaterial)[Math.floor(Math.random() * Object.values(PieceMaterial).length)] : preferences.material;
      const finalShape = useRandom ? Object.values(PieceShape)[Math.floor(Math.random() * Object.values(PieceShape).length)] : preferences.shape;
      
      // اجرای همزمان سنتز تصویر و فکت‌ها برای صرفه‌جویی در زمان
      const [art, snippets] = await Promise.all([
        generateArtImage(finalStyle, visualPrompt),
        generateDocumentarySnippets(visualPrompt)
      ]);
      
      setPreferences(p => ({ 
        ...p, subject: visualPrompt, durationMinutes: item.duration, pieceCount: item.pieceCount, 
        style: finalStyle, movement: finalMovement, material: finalMaterial, shape: finalShape,
        topicType: activeTopicType, topicCategory: activeCategoryLabel
      }));
      
      setState(s => ({ ...s, imageUrl: art.imageUrl, docSnippets: snippets, isGenerating: false, pipelineStep: 'METADATA' }));
      setIsMetadataLoading(true);
      setMetadata(await generateYouTubeMetadata(visualPrompt, finalStyle));
      setIsMetadataLoading(false);
      setState(s => ({ ...s, pipelineStep: 'THUMBNAIL' }));
      
      if (state.isAutoMode) {
        setTimeout(() => {
          setState(s => ({ ...s, pipelineStep: 'ANIMATE' }));
          setTimeout(() => setState(s => ({ ...s, isSolving: true, isRecording: true, pipelineStep: 'RECORDING' })), 1500);
        }, 3000);
      } else { 
        setState(s => ({ ...s, pipelineStep: 'IDLE' })); 
      }
    } catch (e) {
      console.error("Pipeline Item Error:", e);
      setState(s => ({ ...s, isAutoMode: false, isGenerating: false, pipelineStep: 'IDLE', error: "Neural Engine Failure" }));
    }
  }, [preferences.subject, preferences.style, preferences.shape, preferences.material, preferences.movement, preferences.topicCategory, preferences.topicType, musicTracks, selectedTrackId, state.currentQueueIdx, state.isAutoMode, audioRef, setPreferences, setActiveTrackName]);

  useEffect(() => {
    if (state.isAutoMode && state.pipelineStep === 'IDLE' && state.currentQueueIdx >= 0) {
      const item = state.queue[state.currentQueueIdx];
      if (item) processPipelineItem(item, false); 
    }
  }, [state.isAutoMode, state.pipelineStep, state.currentQueueIdx, state.queue, processPipelineItem]);

  return { state, setState, metadata, isMetadataLoading, thumbnailDataUrl, setThumbnailDataUrl, setLastVideoBlob, processPipelineItem };
};
