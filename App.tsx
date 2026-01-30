import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArtStyle,
  PieceShape,
  PieceMaterial,
  MovementType,
  UserPreferences,
  TopicType,
  PuzzleBackground,
} from "./types";
import { useProductionPipeline } from "./hooks/useProductionPipeline";
import { useLongFormatPipeline } from "./hooks/useLongFormatPipeline";
import { CanvasHandle } from "./components/AutoColorCanvas";
import Sidebar from "./components/Sidebar";
import CanvasArea from "./components/CanvasArea";
import Header from "./components/Header";
import ProductionProgress from "./components/ProductionProgress";
import MetadataStudio from "./components/engagement/MetadataStudio";
import ThumbnailGenerator from "./components/ThumbnailGenerator";
import AudioStatus from "./components/layout/AudioStatus";
import RecordingSystem from "./components/RecordingSystem";
import { MusicTrack } from "./components/sidebar/MusicUploader";
import { playWithFade, pauseWithFade } from "./utils/audioFade";
import { BackendModeProvider } from "./contexts/BackendModeContext";
import { LongFormStructure } from "./types-longform";
import LongFormatConfig from "./components/sidebar/LongFormatConfig";
import { ProgressBar } from "./components/longform/ProgressBar";
import { FactCardOverlay } from "./components/longform/FactCardOverlay";
import { ChapterTitle } from "./components/longform/ChapterTitle";

const AppContent: React.FC = () => {
  // Mode selection: 'short' or 'long'
  const [videoMode, setVideoMode] = useState<"short" | "long">("short");
  const [longFormatStructure, setLongFormatStructure] = useState<LongFormStructure | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    style: ArtStyle.HYPER_REALISTIC,
    subject: "Ancient Mystery Revealed",
    durationMinutes: 1.0,
    pieceCount: 500,
    shape: PieceShape.JIGSAW,
    material: PieceMaterial.CARDBOARD,
    movement: MovementType.STANDARD,
    background: PuzzleBackground.FROSTED_DISCOVERY,
    topicType: TopicType.MANUAL,
    showDocumentaryTips: true,
  });

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);

  const [engagementGifUrl, setEngagementGifUrl] = useState<string | null>(null);
  const [channelLogoUrl, setChannelLogoUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);

  // Ref to store resolve function for recording ready synchronization
  const recordingReadyResolveRef = useRef<(() => void) | null>(null);

  const handleAddCloudTrack = useCallback(
    (url: string, title: string, source: "backend" | "ai" = "backend") => {
      const newTrack: MusicTrack = {
        id: Math.random().toString(36).substr(2, 9),
        name: title,
        url: url,
        source: source,
      };
      setMusicTracks((prev) => [...prev, newTrack]);
      setSelectedTrackId(newTrack.id);
      // Note: Audio is already loaded in selectSmartMusic, don't reload here to prevent conflicts
      console.log(`📝 [App] Cloud track added to list: ${title} (${source})`);
    },
    [],
  );

  const fetchAudioBlob = useCallback(async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("[App] Failed to fetch audio blob:", error);
      return null;
    }
  }, []);

  const {
    state,
    setState,
    metadata,
    isMetadataLoading,
    setThumbnailDataUrl,
    setLastVideoBlob,
    processPipelineItem,
    toggleAutoMode,
  } = useProductionPipeline(
    preferences,
    setPreferences,
    musicTracks,
    selectedTrackId,
    setActiveTrackName,
    handleAddCloudTrack,
    audioRef,
  );

  // Long Format Pipeline Hook
  const longFormatPipeline = useLongFormatPipeline({
    audioRef,
    setPreferences,
    onAddCloudTrack: handleAddCloudTrack,
    setActiveTrackName,
    fetchAudioBlob,
  });

  // Handler for starting Long Format production
  const handleStartLongFormatProduction = useCallback(
    (structure: LongFormStructure) => {
      console.log("🎬 [App] Starting Long Format production:", structure);
      setLongFormatStructure(structure);
      longFormatPipeline.executeLongFormatPipeline(structure);
    },
    [longFormatPipeline],
  );

  // Callback for when recording is ready
  const handleRecordingReady = useCallback(() => {
    console.log(`🎬 [App] Recording ready! Now starting animation...`);
    if (recordingReadyResolveRef.current) {
      recordingReadyResolveRef.current();
      recordingReadyResolveRef.current = null;
    }
  }, []);

  const handleToggleSolve = async () => {
    // Use a ref to avoid stale state issues
    const currentlySolving = state.isSolving;

    if (!currentlySolving) {
      // STARTING: First start recording, THEN start animation
      console.log(`🎬 [App] Starting recording first, waiting for ready signal...`);

      // Ensure the selected music track is loaded to the audio element
      if (audioRef.current && selectedTrackId) {
        const selectedTrack = musicTracks.find((t) => t.id === selectedTrackId);
        if (selectedTrack && audioRef.current.src !== selectedTrack.url) {
          console.log(`🎵 [App] Loading selected track: ${selectedTrack.name}`);
          audioRef.current.src = selectedTrack.url;
          audioRef.current.load();
          // Wait for audio to be ready
          await new Promise<void>((resolve) => {
            if (audioRef.current) {
              audioRef.current.oncanplaythrough = () => resolve();
              // Timeout fallback
              setTimeout(resolve, 2000);
            } else {
              resolve();
            }
          });
          console.log(`✅ [App] Audio loaded and ready`);
        }
      }

      // Reset audio to start
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      // Create a promise that resolves when recording is ready
      const recordingReadyPromise = new Promise<void>((resolve) => {
        recordingReadyResolveRef.current = resolve;
      });

      // Step 1: Start recording (this triggers RecordingSystem to set up MediaRecorder)
      setState((s) => ({
        ...s,
        isRecording: true,
        pipelineStep: "RECORDING",
      }));

      // Step 2: Wait for recording to be ready (with timeout safety)
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn(`⚠️ [App] Recording ready timeout! Starting animation anyway...`);
          resolve();
        }, 3000); // 3 second timeout
      });

      await Promise.race([recordingReadyPromise, timeoutPromise]);

      // Step 3: NOW start animation and audio
      console.log(`🎬 [App] Recording confirmed ready, starting animation!`);
      if (audioRef.current) {
        playWithFade(audioRef.current, { duration: 2000, targetVolume: 1.0 });
      }

      setState((s) => ({
        ...s,
        isSolving: true,
      }));
    } else {
      // STOPPING: Stop both at the same time
      if (audioRef.current) {
        pauseWithFade(audioRef.current, { duration: 1500 });
      }
      setState((s) => ({
        ...s,
        isSolving: false,
        isRecording: false,
        pipelineStep: "IDLE",
      }));
    }
  };

  const handleToggleFullPackage = useCallback(() => {
    setState((prev) => ({ ...prev, isFullPackage: !prev.isFullPackage }));
  }, [setState]);

  const handlePuzzleFinished = async () => {
    if (audioRef.current) {
      // Fade out over 1.5 seconds when puzzle completes
      await pauseWithFade(audioRef.current, { duration: 1500 });
      audioRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, isSolving: false, isRecording: false, pipelineStep: "PACKAGING" }));
  };

  return (
    <div className="flex h-screen bg-[#020205] text-slate-100 overflow-hidden font-['Inter'] relative">
      <audio ref={audioRef} loop crossOrigin="anonymous" style={{ display: "none" }} />
      {/* Mode Toggle - Top Center */}

      {/* Production Progress Indicator */}
      {state.isAutoMode && state.productionSteps && state.productionSteps.length > 0 && (
        <ProductionProgress
          currentVideo={state.currentQueueIdx + 1}
          totalVideos={state.queue.length}
          steps={state.productionSteps}
        />
      )}

      {/* Long Format Overlays */}
      {videoMode === "long" && longFormatStructure && longFormatPipeline.progress.currentStep !== "IDLE" && (
        <>
          {/* Progress Bar */}
          <ProgressBar
            structure={longFormatStructure}
            currentSceneIndex={longFormatPipeline.progress.currentSceneIndex}
            sceneProgress={longFormatPipeline.progress.sceneProgress}
            position="top"
            style="chapter-count"
          />

          {/* Fact Card Overlay */}
          {longFormatPipeline.currentScene?.factCards && (
            <FactCardOverlay
              factCards={longFormatPipeline.currentScene.factCards}
              sceneStartTime={Date.now()}
              isActive={longFormatPipeline.isRecording}
            />
          )}

          {/* Chapter Title (shown at scene transitions) */}
          {longFormatPipeline.progress.currentStep === "TRANSITIONING" &&
            longFormatPipeline.currentScene?.chapterTitle && (
              <ChapterTitle
                title={longFormatPipeline.currentScene.chapterTitle}
                subtitle={longFormatPipeline.currentScene.title}
                chapterNumber={longFormatPipeline.progress.currentSceneIndex + 1}
                totalChapters={longFormatPipeline.progress.totalScenes}
              />
            )}
        </>
      )}

      <RecordingSystem
        isRecording={videoMode === "short" ? state.isRecording : longFormatPipeline.isRecording}
        getCanvas={() => canvasHandleRef.current?.getCanvas() || null}
        audioRef={audioRef}
        metadata={videoMode === "short" ? metadata : longFormatPipeline.metadata}
        durationMinutes={
          videoMode === "short"
            ? preferences.durationMinutes
            : (longFormatPipeline.currentScene?.duration || 60) / 60
        }
        onRecordingComplete={
          videoMode === "short" ? setLastVideoBlob : longFormatPipeline.handleRecordingComplete
        }
        onRecordingReady={videoMode === "short" ? handleRecordingReady : undefined}
      />

      <aside className="w-[400px] z-40 h-full glass-panel flex flex-col shrink-0">
        <div className="w-[400px]">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700  px-4 py-2 shadow-2xl">
            <span className="text-xs text-slate-400 font-medium">Mode:</span>
            <button
              onClick={() => setVideoMode("short")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                videoMode === "short"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Short (1-3 min)
            </button>
            <button
              onClick={() => setVideoMode("long")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                videoMode === "long"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Long Format (8+ min)
            </button>
          </div>
        </div>
        {videoMode === "short" ? (
          <Sidebar
            preferences={preferences}
            setPreferences={setPreferences}
            isGenerating={state.isGenerating}
            isSolving={state.isSolving}
            isAutoMode={state.isAutoMode}
            pipelineStep={state.pipelineStep}
            isFullPackage={state.isFullPackage}
            currentPackageIndex={state.currentQueueIdx}
            packageQueueLength={state.queue.length}
            onToggleFullPackage={handleToggleFullPackage}
            hasImage={!!state.imageUrl}
            onGenerate={(isManual: boolean) => {
              processPipelineItem(
                { duration: preferences.durationMinutes, source: "VIRAL", pieceCount: 500 },
                isManual,
              );
            }}
            onAutoMode={toggleAutoMode}
            onToggleSolve={handleToggleSolve}
            musicTracks={musicTracks}
            selectedTrackId={selectedTrackId}
            onAddMusicTracks={(files) => {
              const newTracks = Array.from(files).map((f: File) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: f.name,
                url: URL.createObjectURL(f),
                source: "manual" as const,
              }));
              setMusicTracks((prev) => [...prev, ...newTracks]);
              if (newTracks.length === 1) setSelectedTrackId(newTracks[0].id);
            }}
            onAddCloudTrack={handleAddCloudTrack}
            onSelectTrack={setSelectedTrackId}
            onRemoveTrack={(id) => {
              setMusicTracks((prev) => prev.filter((t) => t.id !== id));
              if (selectedTrackId === id) setSelectedTrackId(null);
            }}
            onGifChange={setEngagementGifUrl}
            onChannelLogoChange={setChannelLogoUrl}
          />
        ) : (
          <div className="flex flex-col h-full bg-[#050508] border-r border-white/5">
            <div className="shrink-0 px-4 py-3 bg-zinc-950/50 border-b border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📽️</span>
                <span className="text-sm font-bold text-purple-400">Long Format Studio</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <LongFormatConfig
                onStartProduction={handleStartLongFormatProduction}
                isGenerating={longFormatPipeline.progress.currentStep !== "IDLE"}
              />
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#020205] relative z-10 flex flex-col">
        <Header
          progress={videoMode === "short" ? state.progress : longFormatPipeline.progress.overallProgress}
          isColoring={videoMode === "short" ? state.isSolving : longFormatPipeline.isSolving}
          isRecording={videoMode === "short" ? state.isRecording : longFormatPipeline.isRecording}
          error={state.error}
          hasImage={videoMode === "short" ? !!state.imageUrl : !!longFormatPipeline.currentImageUrl}
        />

        <section className="h-[85vh] w-full relative bg-black shrink-0">
          <CanvasArea
            canvasHandleRef={canvasHandleRef}
            imageUrl={videoMode === "short" ? state.imageUrl : longFormatPipeline.currentImageUrl}
            durationMinutes={
              videoMode === "short"
                ? preferences.durationMinutes
                : (longFormatPipeline.currentScene?.duration || 60) / 60
            }
            isColoring={videoMode === "short" ? state.isSolving : longFormatPipeline.isSolving}
            pieceCount={
              videoMode === "short"
                ? preferences.pieceCount
                : longFormatPipeline.currentScene?.pieceCount || 500
            }
            shape={preferences.shape}
            material={preferences.material}
            movement={preferences.movement}
            background={preferences.background}
            topicCategory={preferences.topicCategory}
            engagementGifUrl={engagementGifUrl}
            channelLogoUrl={channelLogoUrl}
            onProgress={(p) => setState((prev) => ({ ...prev, progress: p }))}
            onFinished={handlePuzzleFinished}
            onToggleSolve={handleToggleSolve}
            docSnippets={state.docSnippets}
            storyArc={state.storyArc}
            showDocumentaryTips={preferences.showDocumentaryTips}
            progress={videoMode === "short" ? state.progress : longFormatPipeline.progress.sceneProgress}
          />
        </section>

        <div className="w-full bg-[#050508] border-t border-white/5 pb-32">
          {videoMode === "short" && (state.imageUrl || metadata || isMetadataLoading) && (
            <div className="max-w-7xl mx-auto px-8 py-20 space-y-20">
              <ThumbnailGenerator
                imageUrl={state.imageUrl}
                metadata={metadata}
                isLoading={isMetadataLoading}
                isShortsMode={true}
                narrativeLens={preferences.narrativeLens}
                onThumbnailReady={setThumbnailDataUrl}
              />
              <MetadataStudio metadata={metadata} isLoading={isMetadataLoading} />
            </div>
          )}
          {videoMode === "long" && longFormatPipeline.metadata && (
            <div className="max-w-7xl mx-auto px-8 py-20 space-y-20">
              <ThumbnailGenerator
                imageUrl={longFormatPipeline.currentImageUrl}
                metadata={longFormatPipeline.metadata}
                isLoading={false}
                isShortsMode={false}
                narrativeLens={preferences.narrativeLens}
                onThumbnailReady={setThumbnailDataUrl}
              />
              <MetadataStudio metadata={longFormatPipeline.metadata} isLoading={false} />
            </div>
          )}
        </div>
        <AudioStatus
          isSolving={videoMode === "short" ? state.isSolving : longFormatPipeline.isSolving}
          musicTrack={activeTrackName || "Standby"}
          hasError={state.audioError}
        />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BackendModeProvider>
      <AppContent />
    </BackendModeProvider>
  );
};

export default App;
