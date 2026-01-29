import React, { useEffect, useRef, useCallback } from "react";
import { YouTubeMetadata } from "../services/geminiService";
import { sonicEngine } from "../services/proceduralAudio";

interface RecordingSystemProps {
  isRecording: boolean;
  getCanvas: () => HTMLCanvasElement | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  metadata: YouTubeMetadata | null;
  durationMinutes: number;
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingSystem: React.FC<RecordingSystemProps> = ({
  isRecording,
  getCanvas,
  audioRef,
  metadata,
  durationMinutes,
  onRecordingComplete,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const currentMimeType = useRef<string>("");
  const recordingStartTimeRef = useRef<number>(0);
  const isRecordingActiveRef = useRef<boolean>(false);

  const initAudioGraph = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return null;

    const ctx = sonicEngine.getContext();
    if (!ctx) return null;

    try {
      // CRITICAL FIX: Check if audio element has a valid source before creating source node
      if (!audioEl.src && !audioEl.currentSrc) {
        console.warn(`⚠️ [AudioGraph] No audio source available, skipping audio graph setup`);
        // Return empty audio stream instead of null to avoid breaking the recorder
        const emptyDest = ctx.createMediaStreamDestination();
        return emptyDest.stream;
      }

      // ایجاد سورس صوتی (فقط یکبار برای هر المنت در طول چرخه حیات)
      if (!sourceNodeRef.current) {
        console.log(`🔊 [AudioGraph] Creating MediaElementAudioSourceNode...`);
        try {
          sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
          console.log(`✅ [AudioGraph] Source node created successfully`);
        } catch (e) {
          console.error(`❌ [AudioGraph] Failed to create source node:`, e);
          // If we can't create source node, return empty stream
          const emptyDest = ctx.createMediaStreamDestination();
          return emptyDest.stream;
        }
      }

      // ایجاد مقصد استریم برای ضبط
      if (!streamDestRef.current) {
        streamDestRef.current = ctx.createMediaStreamDestination();
      }

      // ایجاد کنترلر ولوم (Gain)
      if (!musicGainRef.current) {
        musicGainRef.current = ctx.createGain();
      }

      const musicSource = sourceNodeRef.current;
      const musicGain = musicGainRef.current;
      const dest = streamDestRef.current;

      // قطع اتصالات قبلی به صورت ایمن (جلوگیری از خطای Not Connected)
      try {
        musicSource.disconnect();
      } catch (e) {
        // اگر متصل نباشد، نادیده می‌گیریم
      }

      // برقراری اتصالات گراف صوتی
      musicSource.connect(musicGain);
      musicGain.connect(ctx.destination); // برای شنیدن صدا از اسپیکر
      musicGain.connect(dest); // برای ارسال به ریکوردر

      console.log(`🎵 [AudioGraph] Audio routing complete: audio → gain → [speakers + recorder]`);

      // اتصال افکت‌های صوتی سیستم (SFX) به ضبط
      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        try {
          sfxGain.disconnect(dest);
        } catch (e) {}
        sfxGain.connect(dest);
        console.log(`🔊 [AudioGraph] SFX routing complete: sfx → recorder`);
      }

      return dest.stream;
    } catch (e) {
      console.error("Critical Audio Graph Error:", e);
      // در صورت بروز خطا، حداقل استریم مقصد را برمی‌گردانیم تا ریکورد کلا متوقف نشود
      return streamDestRef.current?.stream || null;
    }
  }, [audioRef]);

  // Reset audio source node when audio source changes (important for Auto Mode with different tracks)
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleLoadStart = () => {
      console.log(`🔄 [RecordingSystem] Audio source changing, resetting source node...`);
      // Disconnect old source node safely
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceNodeRef.current = null;
        console.log(`✅ [RecordingSystem] Source node reset complete`);
      }
    };

    audioEl.addEventListener('loadstart', handleLoadStart);
    return () => {
      audioEl.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioRef]);

  // Define stopRecording BEFORE the useEffect that uses it
  const stopRecording = useCallback(() => {
    console.log(`🛑 [RecordingSystem] Stop recording requested...`);
    console.log(`   MediaRecorder state: ${mediaRecorderRef.current?.state || 'null'}`);
    console.log(`   isRecordingActive: ${isRecordingActiveRef.current}`);

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      console.warn(`⚠️ [RecordingSystem] No active recording to stop`);
      isRecordingActiveRef.current = false;
      return;
    }

    const ctx = sonicEngine.getContext();
    const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;

    console.log(`   Recording duration so far: ${recordingDuration.toFixed(1)}s`);
    console.log(`   Chunks collected so far: ${chunksRef.current.length}`);

    // فید-اوت سریع صدا در انتهای ویدئو
    if (musicGainRef.current && ctx) {
      try {
        musicGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      } catch (e) {
        console.warn(`⚠️ Audio fade-out failed:`, e);
      }
    }

    // CRITICAL: Request final data chunk before stopping
    if (mediaRecorderRef.current.state === "recording") {
      console.log(`   📦 Requesting final data chunk...`);
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        console.warn(`⚠️ requestData failed:`, e);
      }
    }

    // توقف ریکوردر بعد از نیم ثانیه فید-اوت
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        console.log(`   🛑 Stopping MediaRecorder...`);
        mediaRecorderRef.current.stop();
      }
    }, 500);
  }, []);

  // startRecording function
  const startRecording = useCallback(async () => {
    const canvas = getCanvas();
    const audioEl = audioRef.current;

    console.log(`🎬 [RecordingSystem] Starting recording IMMEDIATELY...`);
    console.log(`   Canvas: ${canvas ? "OK" : "MISSING"}`);
    console.log(`   Audio Element: ${audioEl ? "OK" : "MISSING"}`);

    if (!canvas) {
      console.error(`❌ [RecordingSystem] Cannot start - missing canvas`);
      return;
    }

    // Prevent double-start
    if (isRecordingActiveRef.current) {
      console.warn(`⚠️ [RecordingSystem] Recording already active, ignoring start request`);
      return;
    }

    isRecordingActiveRef.current = true;
    recordingStartTimeRef.current = Date.now();

    try {
      const ctx = sonicEngine.getContext();

      // Resume audio context immediately (non-blocking)
      if (ctx && ctx.state === "suspended") {
        console.log(`   Resuming suspended audio context...`);
        ctx.resume().catch(e => console.warn(`Audio context resume failed:`, e));
      }

      // CRITICAL FIX: Start video capture IMMEDIATELY - don't wait for audio
      console.log(`   🎥 Starting video capture IMMEDIATELY...`);
      const videoStream = (canvas as any).captureStream(60);
      const tracks = [...videoStream.getVideoTracks()];

      console.log(`   Video tracks captured: ${tracks.length}`);

      // Initialize audio graph synchronously (best effort)
      let audioStream: MediaStream | null = null;
      try {
        audioStream = initAudioGraph();
        if (audioStream) {
          const audioTracks = audioStream.getAudioTracks();
          console.log(`   Audio stream tracks: ${audioTracks.length}`);
          if (audioTracks.length > 0) {
            tracks.push(audioTracks[0]);
          }
        }
      } catch (e) {
        console.warn(`⚠️ [RecordingSystem] Audio graph init failed, continuing video-only:`, e);
      }

      // Start audio playback (non-blocking)
      if (audioEl && (audioEl.src || audioEl.currentSrc)) {
        console.log(`   🎵 Starting audio playback...`);
        audioEl.play().catch(e => {
          console.warn(`⚠️ Audio playback failed:`, e);
        });

        // Fade in audio
        if (musicGainRef.current && ctx) {
          musicGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
          musicGainRef.current.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.0);
        }
      } else {
        console.warn(`   ⚠️ No audio source - recording video only`);
      }

      const combinedStream = new MediaStream(tracks);

      const mimeType =
        ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) =>
          MediaRecorder.isTypeSupported(t)
        ) || "video/webm";
      currentMimeType.current = mimeType;

      console.log(`   📼 Creating MediaRecorder with MIME: ${mimeType}`);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 25000000,
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`   📦 Chunk received: ${(e.data.size / 1024).toFixed(1)}KB (total chunks: ${chunksRef.current.length})`);
        }
      };

      recorder.onstop = () => {
        isRecordingActiveRef.current = false;
        const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        const finalBlob = new Blob(chunksRef.current, { type: currentMimeType.current });

        console.log(`\n📹 [RecordingSystem] ══════════════════════════════════`);
        console.log(`   Recording COMPLETE!`);
        console.log(`   Duration: ${recordingDuration.toFixed(1)}s`);
        console.log(`   Blob size: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Chunks collected: ${chunksRef.current.length}`);
        console.log(`   MIME type: ${currentMimeType.current}`);
        console.log(`   Expected duration: ${durationMinutes * 60}s`);
        console.log(`══════════════════════════════════════════════════════\n`);

        // CRITICAL: Verify blob is valid and complete
        if (finalBlob.size === 0) {
          console.error(`❌ [RecordingSystem] FATAL: Blob is empty! No data was recorded!`);
        } else if (recordingDuration < (durationMinutes * 60 * 0.8)) {
          console.warn(`⚠️ [RecordingSystem] WARNING: Recording duration (${recordingDuration.toFixed(1)}s) is less than 80% of expected (${(durationMinutes * 60).toFixed(1)}s)`);
        } else {
          console.log(`✅ [RecordingSystem] Recording duration looks good!`);
        }

        onRecordingComplete(finalBlob);
        console.log(`✅ [RecordingSystem] onRecordingComplete callback invoked`);
      };

      recorder.onerror = (e) => {
        console.error(`❌ [RecordingSystem] MediaRecorder error:`, e);
        isRecordingActiveRef.current = false;
      };

      // CRITICAL: Start recording IMMEDIATELY with smaller chunks for more reliable capture
      recorder.start(500); // 500ms chunks for finer granularity
      mediaRecorderRef.current = recorder;

      console.log(`   ✅ MediaRecorder started! Recording in progress...`);
      console.log(`   ⏱️ Recording started at: ${new Date().toISOString()}`);

    } catch (e) {
      console.error("❌ Recording Engine Failure:", e);
      isRecordingActiveRef.current = false;
    }
  }, [getCanvas, audioRef, durationMinutes, onRecordingComplete, initAudioGraph]);

  // Main effect to control recording
  useEffect(() => {
    console.log(`🔄 [RecordingSystem] isRecording changed to: ${isRecording}`);
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    // Cleanup on unmount
    return () => {
      if (isRecordingActiveRef.current) {
        console.log(`🧹 [RecordingSystem] Cleanup: stopping active recording`);
        stopRecording();
      }
    };
  }, [isRecording, startRecording, stopRecording]);

  return null;
};

export default RecordingSystem;
