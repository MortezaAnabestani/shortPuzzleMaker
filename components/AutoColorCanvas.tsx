
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface AutoColorCanvasProps {
  imageUrl: string;
  durationMinutes: number;
  onProgress: (p: number) => void;
  isColoring: boolean;
  onFinished: () => void;
}

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const AutoColorCanvas = forwardRef<CanvasHandle, AutoColorCanvasProps>(({ 
  imageUrl, 
  durationMinutes, 
  onProgress, 
  isColoring,
  onFinished
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing Studio...");
  
  const colorImageRef = useRef<HTMLImageElement | null>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentsRef = useRef<{x: number, y: number, color: string, revealed: boolean}[]>([]);
  const animationRef = useRef<number>(0);
  const dimensions = { width: 1080, height: 1920 };

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    if (!imageUrl) return;
    setIsReady(false);
    setStatus("Processing Visual Asset...");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => processImage(img);
  }, [imageUrl]);

  const processImage = (img: HTMLImageElement) => {
    colorImageRef.current = img;
    const { width, height } = dimensions;

    const sCanvas = document.createElement('canvas');
    sCanvas.width = width;
    sCanvas.height = height;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.drawImage(img, 0, 0, width, height);
    
    // استخراج خطوط برای افکت Happy Color
    const imgData = sCtx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      const v = avg < 130 ? 30 : 255; 
      data[i] = data[i+1] = data[i+2] = v;
    }
    sCtx.putImageData(imgData, 0, 0);
    sketchCanvasRef.current = sCanvas;

    // تقسیم‌بندی به سگمنت‌های رنگی
    const segments = [];
    const step = 32; 
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        segments.push({ x, y, revealed: false });
      }
    }
    segmentsRef.current = segments.sort(() => Math.random() - 0.5);

    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      mainCanvas.width = width;
      mainCanvas.height = height;
      const ctx = mainCanvas.getContext('2d')!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(sCanvas, 0, 0);
    }

    setStatus("Ready to Paint");
    setIsReady(true);
    onProgress(0);
  };

  const startColoring = useCallback(() => {
    if (!isColoring || !isReady) return;

    const mainCanvas = canvasRef.current!;
    const ctx = mainCanvas.getContext('2d')!;
    const sketchCanvas = sketchCanvasRef.current!;
    const colorImg = colorImageRef.current!;
    const { width, height } = dimensions;

    const startTime = performance.now();
    const totalDurationMs = durationMinutes * 60 * 1000;
    const totalSegments = segmentsRef.current.length;

    const renderLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDurationMs, 1);
      
      const segmentsToReveal = Math.floor(progress * totalSegments);
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      
      ctx.save();
      for (let i = 0; i < segmentsToReveal; i++) {
        const seg = segmentsRef.current[i];
        ctx.drawImage(colorImg, seg.x, seg.y, 34, 34, seg.x, seg.y, 34, 34);
      }
      ctx.restore();

      ctx.globalAlpha = 0.5;
      ctx.drawImage(sketchCanvas, 0, 0);
      ctx.globalAlpha = 1.0;

      // Ken Burns Motion بر اساس سرعت
      if (containerRef.current) {
        const scale = 1 + (progress * 0.08);
        containerRef.current.style.transform = `scale(${scale})`;
      }

      onProgress(progress * 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(renderLoop);
      } else {
        ctx.drawImage(colorImg, 0, 0, width, height);
        onFinished();
      }
    };

    animationRef.current = requestAnimationFrame(renderLoop);
  }, [isColoring, isReady, durationMinutes, onFinished, onProgress]);

  useEffect(() => {
    if (isColoring) {
      startColoring();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isColoring, startColoring]);

  return (
    <div className="relative w-full h-full bg-[#050508] flex items-center justify-center overflow-hidden">
      <div 
        ref={containerRef}
        className="relative aspect-[9/16] h-[95%] bg-white shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-out"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain"
        />
      </div>
      
      {!isReady && imageUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020205] z-50">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
            </div>
          </div>
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse">{status}</h2>
        </div>
      )}

      {isColoring && (
        <div className="absolute bottom-10 right-10 flex items-center gap-4 px-6 py-3 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-full z-30 shadow-2xl animate-in slide-in-from-right-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {Math.round(durationMinutes * 60)}s Sequence
          </span>
        </div>
      )}
    </div>
  );
});

export default AutoColorCanvas;
