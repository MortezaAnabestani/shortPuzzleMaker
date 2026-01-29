/**
 * Long Format Pipeline Hook
 *
 * Manages multi-scene puzzle video generation for 8+ minute content
 */

import React, { useState, useCallback, useRef } from 'react';
import { LongFormStructure, LongFormScene } from '../types-longform';
import { UserPreferences, ArtStyle } from '../types';
import { generateArtImage, YouTubeMetadata } from '../services/geminiService';
import { MusicTrack } from '../components/sidebar/MusicUploader';

export type LongFormatStep =
  | 'IDLE'
  | 'INITIALIZING'
  | 'GENERATING_SCENE'
  | 'LOADING_MUSIC'
  | 'RECORDING_SCENE'
  | 'TRANSITIONING'
  | 'FINALIZING'
  | 'COMPLETE';

export interface LongFormatProgress {
  currentStep: LongFormatStep;
  currentSceneIndex: number;
  totalScenes: number;
  sceneProgress: number; // 0-100 percentage for current scene
  overallProgress: number; // 0-100 percentage for entire video
  currentSceneTitle: string | null;
  estimatedTimeRemaining: number | null; // in seconds
}

interface SceneBlob {
  sceneIndex: number;
  sceneTitle: string;
  blob: Blob;
  duration: number;
}

interface UseLongFormatPipelineProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onAddCloudTrack: (url: string, title: string, source?: 'backend' | 'ai') => void;
  setActiveTrackName: (name: string | null) => void;
  fetchAudioBlob: (url: string) => Promise<string | null>;
}

export const useLongFormatPipeline = ({
  audioRef,
  setPreferences,
  onAddCloudTrack,
  setActiveTrackName,
  fetchAudioBlob,
}: UseLongFormatPipelineProps) => {
  const [progress, setProgress] = useState<LongFormatProgress>({
    currentStep: 'IDLE',
    currentSceneIndex: 0,
    totalScenes: 0,
    sceneProgress: 0,
    overallProgress: 0,
    currentSceneTitle: null,
    estimatedTimeRemaining: null,
  });

  const [currentScene, setCurrentScene] = useState<LongFormScene | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [sceneBlobs, setSceneBlobs] = useState<SceneBlob[]>([]);

  const structureRef = useRef<LongFormStructure | null>(null);
  const scenesCompletedRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pendingRecordingResolveRef = useRef<((blob: Blob) => void) | null>(null);

  /**
   * Load music for a specific scene
   */
  const loadSceneMusic = async (scene: LongFormScene): Promise<void> => {
    console.log(`🎵 [LongFormat] Loading music for scene ${scene.id}: ${scene.musicMood}`);

    setProgress(prev => ({
      ...prev,
      currentStep: 'LOADING_MUSIC',
      sceneProgress: 20,
    }));

    try {
      // Use smartFetcher to get music based on mood
      const { smartFetcher } = await import('../services/smartFetcher');
      const trackData = await smartFetcher.fetchMusic(scene.musicMood, scene.title);

      if (trackData && trackData.url) {
        const blobUrl = await fetchAudioBlob(trackData.url);
        if (blobUrl) {
          const sourceType = trackData.source === 'Backend Database' ? 'backend' : 'ai';
          onAddCloudTrack(blobUrl, trackData.title, sourceType);
          setActiveTrackName(trackData.title);

          // Load music to audioRef
          if (audioRef.current) {
            console.log(`   🔊 Loading scene music to audio player...`);
            audioRef.current.src = blobUrl;
            audioRef.current.load();
            console.log(`   ✅ Music loaded: ${trackData.title}`);
          }
        }
      }
    } catch (e) {
      console.error(`❌ [LongFormat] Failed to load music for scene ${scene.id}:`, e);
      console.warn(`   ⚠️ Continuing without music for this scene...`);
    }

    setProgress(prev => ({
      ...prev,
      sceneProgress: 40,
    }));
  };

  /**
   * Generate image for a specific scene
   */
  const generateSceneImage = async (scene: LongFormScene): Promise<string> => {
    console.log(`🎨 [LongFormat] Generating image for scene ${scene.id}: ${scene.title}`);

    setProgress(prev => ({
      ...prev,
      currentStep: 'GENERATING_SCENE',
      sceneProgress: 40,
    }));

    try {
      // Use scene's visual style if specified, otherwise use a default
      const artStyle = (scene.visualStyle as ArtStyle) || ArtStyle.HYPER_REALISTIC;
      const art = await generateArtImage(artStyle, scene.imagePrompt);

      if (!art.imageUrl) {
        throw new Error('Failed to generate image');
      }

      console.log(`   ✅ Image generated for scene ${scene.id}`);

      setProgress(prev => ({
        ...prev,
        sceneProgress: 60,
      }));

      return art.imageUrl;
    } catch (e) {
      console.error(`❌ [LongFormat] Failed to generate image for scene ${scene.id}:`, e);
      throw e;
    }
  };

  /**
   * Handle recording completion callback from RecordingSystem
   */
  const handleRecordingComplete = useCallback((blob: Blob) => {
    console.log(`📹 [LongFormat] Recording complete callback received`);
    console.log(`   Blob size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);

    if (pendingRecordingResolveRef.current) {
      pendingRecordingResolveRef.current(blob);
      pendingRecordingResolveRef.current = null;
    }
  }, []);

  /**
   * Start recording a specific scene
   */
  const recordScene = async (scene: LongFormScene, sceneIndex: number): Promise<void> => {
    console.log(`🎬 [LongFormat] Starting recording for scene ${scene.id}: ${scene.title}`);

    setProgress(prev => ({
      ...prev,
      currentStep: 'RECORDING_SCENE',
      sceneProgress: 80,
    }));

    // Update preferences for this scene
    setPreferences(prev => ({
      ...prev,
      pieceCount: scene.pieceCount,
      durationMinutes: scene.duration / 60, // Convert seconds to minutes
      subject: scene.title,
    }));

    // Create a promise that will be resolved when recording completes
    const recordingPromise = new Promise<Blob>((resolve) => {
      pendingRecordingResolveRef.current = resolve;
    });

    // Start puzzle solving and recording
    setIsSolving(true);
    setIsRecording(true);

    // Wait for scene duration + buffer, then stop recording
    const recordingDuration = scene.duration * 1000 + 2000; // Add 2s buffer
    await new Promise(resolve => setTimeout(resolve, recordingDuration));

    // Stop recording - this will trigger the RecordingSystem to call onRecordingComplete
    setIsSolving(false);
    setIsRecording(false);

    // Wait for recording blob with a timeout
    const timeoutPromise = new Promise<Blob>((_, reject) =>
      setTimeout(() => reject(new Error('Recording completion timeout')), 10000)
    );

    try {
      const blob = await Promise.race([recordingPromise, timeoutPromise]);

      // Store the scene blob
      const sceneBlob: SceneBlob = {
        sceneIndex,
        sceneTitle: scene.title,
        blob,
        duration: scene.duration,
      };
      setSceneBlobs(prev => [...prev, sceneBlob]);

      console.log(`   ✅ Recording completed and blob saved for scene ${scene.id}`);
      console.log(`   📦 Total scene blobs collected: ${sceneIndex + 1}`);
    } catch (e) {
      console.warn(`   ⚠️ Recording blob not received within timeout, continuing...`);
      // Clear the pending resolver
      pendingRecordingResolveRef.current = null;
    }

    setProgress(prev => ({
      ...prev,
      sceneProgress: 100,
    }));
  };

  /**
   * Process a single scene
   */
  const processScene = async (scene: LongFormScene, sceneIndex: number): Promise<void> => {
    console.log(`\n🎬 [LongFormat] Processing scene ${sceneIndex + 1}/${structureRef.current?.scenes.length}`);
    console.log(`   Title: ${scene.title}`);
    console.log(`   Duration: ${scene.duration}s`);
    console.log(`   Pieces: ${scene.pieceCount}`);

    setCurrentScene(scene);

    setProgress(prev => ({
      ...prev,
      currentSceneIndex: sceneIndex,
      currentSceneTitle: scene.title,
      sceneProgress: 0,
    }));

    try {
      // Step 1: Load music for this scene
      await loadSceneMusic(scene);

      // Step 2: Generate image
      const imageUrl = await generateSceneImage(scene);
      setCurrentImageUrl(imageUrl);

      // Step 3: Wait for browser to prepare (2 seconds)
      console.log(`   ⏸️ Waiting 2 seconds for browser preparation...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Record this scene
      await recordScene(scene, sceneIndex);

      // Step 5: Transition to next scene (if not last)
      if (sceneIndex < (structureRef.current?.scenes.length || 0) - 1) {
        console.log(`   🔄 Transitioning to next scene...`);
        setProgress(prev => ({
          ...prev,
          currentStep: 'TRANSITIONING',
        }));

        // Wait for transition duration (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      scenesCompletedRef.current += 1;

      // Update overall progress
      const overallProgress = Math.round(
        (scenesCompletedRef.current / (structureRef.current?.scenes.length || 1)) * 100
      );

      setProgress(prev => ({
        ...prev,
        overallProgress,
      }));

      console.log(`   ✅ Scene ${sceneIndex + 1} completed!`);
    } catch (e) {
      console.error(`❌ [LongFormat] Failed to process scene ${sceneIndex + 1}:`, e);
      throw e;
    }
  };

  /**
   * Generate overall metadata for the entire long-form video
   */
  const generateOverallMetadata = async (structure: LongFormStructure): Promise<void> => {
    console.log(`📝 [LongFormat] Generating overall metadata...`);

    // Create comprehensive metadata
    const overallMetadata: YouTubeMetadata = {
      title: structure.title,
      description: structure.description,
      tags: [
        structure.genre,
        'long-form',
        'puzzle',
        'documentary',
        'educational',
        ...structure.scenes.map(s => s.title.split(' ')[0].toLowerCase()),
      ].slice(0, 15), // Limit to 15 tags
      hashtags: [
        '#PuzzleVideo',
        '#LongForm',
        '#Documentary',
        '#Educational',
      ],
    };

    setMetadata(overallMetadata);
    console.log(`   ✅ Metadata generated: ${overallMetadata.title}`);
  };

  /**
   * Main pipeline execution
   */
  const executeLongFormatPipeline = async (structure: LongFormStructure): Promise<void> => {
    console.log(`\n🚀 [LongFormat] Starting Long Format Pipeline`);
    console.log(`   Genre: ${structure.genre}`);
    console.log(`   Total Duration: ${structure.totalDuration} minutes`);
    console.log(`   Total Scenes: ${structure.scenes.length}`);

    structureRef.current = structure;
    scenesCompletedRef.current = 0;
    startTimeRef.current = Date.now();

    setProgress({
      currentStep: 'INITIALIZING',
      currentSceneIndex: 0,
      totalScenes: structure.scenes.length,
      sceneProgress: 0,
      overallProgress: 0,
      currentSceneTitle: null,
      estimatedTimeRemaining: null,
    });

    try {
      // Step 1: Generate overall metadata
      await generateOverallMetadata(structure);

      // Step 2: Process each scene sequentially
      for (let i = 0; i < structure.scenes.length; i++) {
        await processScene(structure.scenes[i], i);
      }

      // Step 3: Finalize
      console.log(`\n🎉 [LongFormat] All scenes completed! Finalizing...`);
      setProgress(prev => ({
        ...prev,
        currentStep: 'FINALIZING',
        overallProgress: 95,
      }));

      // Wait for final processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete
      setProgress(prev => ({
        ...prev,
        currentStep: 'COMPLETE',
        overallProgress: 100,
      }));

      const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000);
      console.log(`\n✅ [LongFormat] Pipeline completed successfully!`);
      console.log(`   Total time: ${totalTime}s`);
      console.log(`   Scenes completed: ${scenesCompletedRef.current}`);

    } catch (e) {
      console.error(`\n❌ [LongFormat] Pipeline failed:`, e);
      setProgress(prev => ({
        ...prev,
        currentStep: 'IDLE',
      }));
      throw e;
    }
  };

  /**
   * Reset pipeline state
   */
  const resetPipeline = useCallback(() => {
    setProgress({
      currentStep: 'IDLE',
      currentSceneIndex: 0,
      totalScenes: 0,
      sceneProgress: 0,
      overallProgress: 0,
      currentSceneTitle: null,
      estimatedTimeRemaining: null,
    });
    setCurrentScene(null);
    setCurrentImageUrl(null);
    setIsRecording(false);
    setIsSolving(false);
    setMetadata(null);
    setSceneBlobs([]);
    structureRef.current = null;
    scenesCompletedRef.current = 0;
    pendingRecordingResolveRef.current = null;
  }, []);

  return {
    // State
    progress,
    currentScene,
    currentImageUrl,
    isRecording,
    isSolving,
    metadata,
    sceneBlobs,

    // Actions
    executeLongFormatPipeline,
    resetPipeline,
    handleRecordingComplete,
  };
};
