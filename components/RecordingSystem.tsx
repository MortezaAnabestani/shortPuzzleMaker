// Adding React import to resolve namespace errors
import React, { useEffect, useRef } from 'react';
import { YouTubeMetadata } from '../services/geminiService';
import { sonicEngine } from '../services/proceduralAudio';

interface RecordingSystemProps {
  isRecording: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  metadata: YouTubeMetadata | null;
  durationMinutes: number;
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingSystem: React.FC<RecordingSystemProps> = ({ isRecording, canvasRef, audioRef, metadata, durationMinutes, onRecordingComplete }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentMimeType = useRef<string>('');

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    const canvas = canvasRef.current;
    const audioEl = audioRef.current;
    if (!canvas || !audioEl) return;

    try {
      const ctx = sonicEngine.getContext();
      if (!ctx) return;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
      }
      const musicSource = sourceNodeRef.current;
      
      const musicGain = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      
      musicSource.disconnect();
      musicSource.connect(musicGain);
      musicGain.connect(ctx.destination);
      musicGain.connect(dest);
      
      const sfxGain = sonicEngine.getMasterGain();
      if (sfxGain) {
        sfxGain.connect(dest);
      }
      
      gainNodeRef.current = musicGain;

      const now = ctx.currentTime;
      musicGain.gain.setValueAtTime(0, now);
      // کاهش ولوم موسیقی در ضبط نهایی به ۶۰٪ برای غلبه افکت‌های صوتی
      musicGain.gain.linearRampToValueAtTime(0.6, now + 2.0); 

      const videoStream = (canvas as any).captureStream(60);
      const audioTrack = dest.stream.getAudioTracks()[0];
      
      const combinedStream = new MediaStream([...videoStream.getVideoTracks(), audioTrack]);

      const mimeType = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      currentMimeType.current = mimeType;
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 35000000 
      });

      chunksRef.current = []; 

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: currentMimeType.current });
        onRecordingComplete(finalBlob);
        
        if (sfxGain) {
          try { sfxGain.disconnect(dest); } catch(e) {}
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Recording system failure:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const ctx = sonicEngine.getContext();
      if (gainNodeRef.current && ctx) {
        const now = ctx.currentTime;
        gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 1.5); 
      }
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 1600);
    }
  };

  return null;
};

export default RecordingSystem;