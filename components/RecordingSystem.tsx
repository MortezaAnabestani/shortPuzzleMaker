
import React, { useEffect, useRef } from 'react';
import { YouTubeMetadata } from '../services/geminiService';
import { sonicEngine } from '../services/proceduralAudio';

interface RecordingSystemProps {
  isRecording: boolean;
  getCanvas: () => HTMLCanvasElement | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  metadata: YouTubeMetadata | null;
  durationMinutes: number;
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingSystem: React.FC<RecordingSystemProps> = ({ isRecording, getCanvas, audioRef, metadata, durationMinutes, onRecordingComplete }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const currentMimeType = useRef<string>('');

  const initAudioGraph = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return null;

    const ctx = sonicEngine.getContext();
    if (!ctx) return null;

    try {
      // ایجاد سورس صوتی (فقط یکبار برای هر المنت در طول چرخه حیات)
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
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

      // اتصال افکت‌های صوتی سیستم (SFX) به ضبط
      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        try { sfxGain.disconnect(dest); } catch(e) {}
        sfxGain.connect(dest);
      }

      return dest.stream;
    } catch (e) {
      console.error("Critical Audio Graph Error:", e);
      // در صورت بروز خطا، حداقل استریم مقصد را برمی‌گردانیم تا ریکورد کلا متوقف نشود
      return streamDestRef.current?.stream || null;
    }
  };

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    const canvas = getCanvas();
    const audioEl = audioRef.current;
    if (!canvas || !audioEl) return;

    try {
      const ctx = sonicEngine.getContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioStream = initAudioGraph();
      if (!audioStream) {
        throw new Error("Could not initialize audio stream");
      }

      // شروع ملایم صدا
      if (musicGainRef.current) {
        musicGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        musicGainRef.current.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1.0);
      }

      // اطمینان از پخش موسیقی
      if (audioEl.src) {
        audioEl.play().catch(e => console.warn("Recording Playback Blocked:", e));
      }

      const videoStream = (canvas as any).captureStream(60);
      const audioTracks = audioStream.getAudioTracks();
      
      // ترکیب ترک‌های ویدئو و صدا
      const tracks = [...videoStream.getVideoTracks()];
      if (audioTracks.length > 0) tracks.push(audioTracks[0]);
      
      const combinedStream = new MediaStream(tracks);

      const mimeType = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      currentMimeType.current = mimeType;
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 25000000 
      });

      chunksRef.current = []; 
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: currentMimeType.current });
        onRecordingComplete(finalBlob);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Recording Engine Failure:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const ctx = sonicEngine.getContext();
      
      // فید-اوت سریع صدا در انتهای ویدئو
      if (musicGainRef.current && ctx) {
        musicGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      }
      
      // توقف ریکوردر بعد از نیم ثانیه فید-اوت
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 500);
    }
  };

  return null;
};

export default RecordingSystem;
