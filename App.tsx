
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArtStyle, PieceShape, PieceMaterial, MovementType, UserPreferences, TopicType, PuzzleBackground } from './types';
import { useProductionPipeline } from './hooks/useProductionPipeline';
import { CanvasHandle } from './components/PuzzleCanvas';
import Sidebar from './components/Sidebar';
import CanvasArea from './components/CanvasArea';
import MetadataStudio from './components/engagement/MetadataStudio';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import AudioStatus from './components/layout/AudioStatus';
import RecordingSystem from './components/RecordingSystem';
import { MusicTrack } from './components/sidebar/MusicUploader';
import { sonicEngine } from './services/proceduralAudio';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    style: ArtStyle.HYPER_REALISTIC, subject: 'Historical Discovery Story',
    durationMinutes: 1.0, pieceCount: 500, shape: PieceShape.JIGSAW,
    material: PieceMaterial.CARDBOARD, movement: MovementType.STANDARD,
    background: PuzzleBackground.FROSTED_DISCOVERY,
    topicType: TopicType.MANUAL,
    showDocumentaryTips: true 
  });

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [engagementGifUrl, setEngagementGifUrl] = useState<string | null>(null);
  const [channelLogoUrl, setChannelLogoUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  
  const lastPlayedPieceCountRef = useRef(0);

  const { 
    state, setState, metadata, isMetadataLoading, 
    setThumbnailDataUrl, setLastVideoBlob, processPipelineItem 
  } = useProductionPipeline(
    preferences, setPreferences, musicTracks, selectedTrackId, 
    setActiveTrackName, null, audioRef
  );

  const handleAddCloudTrack = useCallback((url: string, title: string) => {
    const newTrack: MusicTrack = {
      id: Math.random().toString(36).substr(2, 9),
      name: title,
      url: url
    };
    setMusicTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id); 
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (state.isSolving) {
        audioRef.current.volume = 0;
        audioRef.current.play().catch(() => setState(s => ({ ...s, audioError: true })));
        let vol = 0;
        fadeIntervalRef.current = window.setInterval(() => {
          vol += 0.02;
          if (vol >= 0.6) { vol = 0.6; if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current); }
          if (audioRef.current) audioRef.current.volume = vol;
        }, 30);
      } else {
        let vol = audioRef.current.volume;
        fadeIntervalRef.current = window.setInterval(() => {
          vol -= 0.02;
          if (vol <= 0) {
            vol = 0;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
          }
          if (audioRef.current) audioRef.current.volume = vol;
        }, 30);
      }
    }
    return () => { if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current); };
  }, [state.isSolving, setState]);

  const handleToggleSolve = async () => {
    if (!state.isSolving) {
      await sonicEngine.unlock();
      lastPlayedPieceCountRef.current = Math.floor((state.progress / 100) * preferences.pieceCount);
    }
    setState(s => ({ 
      ...s, 
      isSolving: !s.isSolving, 
      isRecording: !s.isRecording, 
      pipelineStep: s.isSolving ? 'IDLE' : 'RECORDING' 
    }));
  };

  const handleAutoMode = () => {
    if (state.isAutoMode) {
      setState(s => ({ ...s, isAutoMode: false, currentQueueIdx: -1, queue: [] }));
      return;
    }

    const queue: any[] = [
      { duration: 0.25, source: 'VIRAL', pieceCount: 400 },
      { duration: 0.35, source: 'VIRAL', pieceCount: 600 },
      { duration: 0.50, source: 'VIRAL', pieceCount: 800 },
      { duration: 0.60, source: 'BREAKING', pieceCount: 1000 },
      { duration: 0.75, source: 'VIRAL', pieceCount: 1200 }
    ];

    setState(s => ({ 
      ...s, 
      isAutoMode: true, 
      queue: queue, 
      currentQueueIdx: 0,
      pipelineStep: 'IDLE' 
    }));
  };

  return (
    <div className="flex h-screen bg-[#020205] text-slate-100 overflow-hidden font-['Inter'] relative">
      <audio ref={audioRef} loop crossOrigin="anonymous" />
      
      <RecordingSystem 
        isRecording={state.isRecording} 
        canvasRef={{ current: canvasHandleRef.current?.getCanvas() || null } as any} 
        audioRef={audioRef} metadata={metadata} durationMinutes={preferences.durationMinutes}
        onRecordingComplete={setLastVideoBlob}
      />

      <aside className="w-[420px] z-40 h-full glass-panel flex flex-col shrink-0">
        <Sidebar 
          preferences={preferences} setPreferences={setPreferences} 
          isGenerating={state.isGenerating} isSolving={state.isSolving} 
          isAutoMode={state.isAutoMode} pipelineStep={state.pipelineStep}
          isFullPackage={state.isFullPackage} currentPackageIndex={state.currentQueueIdx}
          packageQueueLength={state.queue.length}
          onToggleFullPackage={() => setState(p => ({ ...p, isFullPackage: !p.isFullPackage }))}
          hasImage={!!state.imageUrl} 
          onGenerate={(isManual: boolean) => {
            processPipelineItem({ 
              duration: preferences.durationMinutes, 
              source: 'VIRAL', 
              pieceCount: preferences.pieceCount 
            }, isManual);
          }} 
          onAutoMode={handleAutoMode}
          onToggleSolve={handleToggleSolve}
          musicTracks={musicTracks} selectedTrackId={selectedTrackId}
          onAddMusicTracks={(files) => {
            const newTracks = Array.from(files).map((f: File) => ({ id: Math.random().toString(36).substr(2, 9), name: f.name, url: URL.createObjectURL(f), file: f }));
            setMusicTracks(prev => [...prev, ...newTracks]);
            if (newTracks.length === 1) setSelectedTrackId(newTracks[0].id);
          }}
          onAddCloudTrack={handleAddCloudTrack}
          onSelectTrack={setSelectedTrackId}
          onRemoveTrack={id => {
            setMusicTracks(prev => prev.filter(t => t.id !== id));
            if (selectedTrackId === id) setSelectedTrackId(null);
          }}
          onGifChange={setEngagementGifUrl}
          onChannelLogoChange={setChannelLogoUrl}
        />
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#020205] relative z-10 flex flex-col">
        <section className="h-[82vh] w-full relative bg-black shrink-0">
          <CanvasArea 
              canvasHandleRef={canvasHandleRef} imageUrl={state.imageUrl} 
              durationMinutes={preferences.durationMinutes} pieceCount={preferences.pieceCount} 
              shape={preferences.shape} material={preferences.material} 
              movement={preferences.movement} 
              background={preferences.background}
              topicCategory={preferences.topicCategory}
              engagementGifUrl={engagementGifUrl}
              channelLogoUrl={channelLogoUrl}
              isColoring={state.isSolving} onProgress={p => setState(prev => ({ ...prev, progress: p }))} 
              onFinished={() => setState(s => ({ ...s, isSolving: false, isRecording: false, pipelineStep: 'PACKAGING' }))} 
              onToggleSolve={handleToggleSolve}
              docSnippets={state.docSnippets}
              showDocumentaryTips={preferences.showDocumentaryTips}
              progress={state.progress}
          />
        </section>
        
        <div className="w-full bg-[#050508] border-t border-white/5 pb-32 min-h-screen">
          {(state.imageUrl || metadata || isMetadataLoading) ? (
            <div className="max-w-7xl mx-auto px-8 py-20 space-y-32">
              <ThumbnailGenerator 
                imageUrl={state.imageUrl} 
                metadata={metadata} 
                isLoading={isMetadataLoading} 
                isShortsMode={true} 
                onThumbnailReady={setThumbnailDataUrl} 
              />
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
              <MetadataStudio metadata={metadata} isLoading={isMetadataLoading} />
            </div>
          ) : (
            <div className="h-[50vh] flex flex-col items-center justify-center opacity-10">
               <div className="text-[10px] font-black uppercase tracking-[1.5em] text-white">Project_Data_Awaiting</div>
            </div>
          )}
        </div>
        
        <AudioStatus isSolving={state.isSolving} musicTrack={activeTrackName || "Standby"} hasError={state.audioError} />
      </main>
    </div>
  );
};

export default App;
