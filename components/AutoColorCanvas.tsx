
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
  const [status, setStatus] = useState("Initializing Engine...");
  
  const colorImageRef = useRef<HTMLImageElement | null>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const dimensions = { width: 1920, height: 1080 };

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    if (!imageUrl) return;
    setIsReady(false);
    setStatus("Downloading Asset...");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => processImage(img);
  }, [imageUrl]);

  const processImage = (img: HTMLImageElement) => {
    colorImageRef.current = img;
    const { width, height } = dimensions;

    // 1. Create the Sketch Overlay (Pencil lines on white)
    setStatus("Generating Sketch Mask...");
    const sCanvas = document.createElement('canvas');
    sCanvas.width = width;
    sCanvas.height = height;
    const sCtx = sCanvas.getContext('2d', { willReadFrequently: true })!;
    sCtx.drawImage(img, 0, 0, width, height);
    
    const imgData = sCtx.getImageData(0, 0, width, height);
    const data32 = new Uint32Array(imgData.data.buffer);
    
    // Create sketch data: grayscale + edge detection-ish logic
    for (let i = 0; i < data32.length; i++) {
      const p = data32[i];
      const r = p & 0xFF, g = (p >> 8) & 0xFF, b = (p >> 16) & 0xFF;
      const brightness = (r + g + b) / 3;
      
      // If darkish, make it a graphite gray line, otherwise pure white
      if (brightness < 185) {
        data32[i] = 0xFF888888; // Graphite gray
      } else {
        data32[i] = 0xFFFFFFFF; // Pure white
      }
    }
    sCtx.putImageData(imgData, 0, 0);
    sketchCanvasRef.current = sCanvas;

    // 2. Create the Reveal Mask Canvas
    const mCanvas = document.createElement('canvas');
    mCanvas.width = width;
    mCanvas.height = height;
    maskCanvasRef.current = mCanvas;

    // Initial Render: Just show the sketch
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      mainCanvas.width = width;
      mainCanvas.height = height;
      const ctx = mainCanvas.getContext('2d')!;
      ctx.drawImage(sCanvas, 0, 0);
    }

    setStatus("Studio Ready");
    setIsReady(true);
    onProgress(0);
  };

  const startReveal = useCallback(() => {
    if (!isColoring || !isReady) return;

    const mainCanvas = canvasRef.current!;
    const ctx = mainCanvas.getContext('2d')!;
    const maskCanvas = maskCanvasRef.current!;
    const mCtx = maskCanvas.getContext('2d')!;
    const sketchCanvas = sketchCanvasRef.current!;
    const colorImg = colorImageRef.current!;
    const { width, height } = dimensions;

    const startTime = performance.now();
    const totalDurationMs = durationMinutes * 60 * 1000;

    // Generate a snake-like path covering the whole screen
    const rows = 12; // Number of horizontal passes
    const rowHeight = height / rows;
    
    const renderLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDurationMs, 1);
      
      // Update Reveal Mask
      // We use a "growing" path or a sweeping brush
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.strokeStyle = 'white';
      mCtx.lineWidth = rowHeight * 2.5; // Wide brush to ensure overlap

      // Drawing a procedural "S" sweep
      const currentPos = progress * width * rows;
      const currentRow = Math.floor(currentPos / width);
      const currentXInRow = currentPos % width;
      
      mCtx.beginPath();
      // Calculate path for this frame
      const pointsToDraw = 10; // Smooth out the path
      for (let i = 0; i <= pointsToDraw; i++) {
        const p = Math.max(0, progress - (i * 0.001));
        const pos = p * width * rows;
        const r = Math.floor(pos / width);
        const x = pos % width;
        const actualX = (r % 2 === 0) ? x : width - x;
        const actualY = (r * rowHeight) + (rowHeight / 2);
        
        if (i === 0) mCtx.moveTo(actualX, actualY);
        else mCtx.lineTo(actualX, actualY);
      }
      mCtx.stroke();

      // Final Composition
      // 1. Draw the full color image first
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(colorImg, 0, 0, width, height);

      // 2. Draw the sketch overlay, but MASKED out by the revealed areas
      // Standard "scratch" effect: we want to show sketch WHERE mask is EMPTY
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(sketchCanvas, 0, 0);
      ctx.restore();

      // Ken Burns Motion
      if (containerRef.current) {
        const scale = 1 + (progress * 0.12);
        const xShift = progress * 30;
        const yShift = -progress * 15;
        containerRef.current.style.transform = `scale(${scale}) translate(${xShift}px, ${yShift}px)`;
      }

      onProgress(progress * 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(renderLoop);
      } else {
        onFinished();
      }
    };

    animationRef.current = requestAnimationFrame(renderLoop);
  }, [isColoring, isReady, durationMinutes, onFinished, onProgress]);

  useEffect(() => {
    if (isColoring) {
      startReveal();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isColoring, startReveal]);

  return (
    <div className="relative w-full max-w-6xl aspect-video bg-white rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-[10px] border-slate-900">
      <div 
        ref={containerRef}
        className="w-full h-full transition-transform duration-700 ease-out will-change-transform bg-white"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain"
        />
      </div>
      
      {!isReady && imageUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-50 backdrop-blur-3xl">
          <div className="relative mb-12">
            <div className="w-32 h-32 border-4 border-red-600/10 border-t-red-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse shadow-[0_0_20px_#dc2626]" />
            </div>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-[0.5em] text-white italic animate-pulse">{status}</h2>
          <p className="text-[10px] text-slate-500 font-black mt-6 tracking-[1.2em] uppercase">SCRATCH-REVEAL ENGINE v9.0</p>
        </div>
      )}

      {isColoring && (
        <div className="absolute bottom-12 right-12 flex items-center gap-6 px-10 py-5 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] z-30 shadow-2xl">
          <div className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 shadow-[0_0_20px_#dc2626]"></span>
          </div>
          <span className="text-[14px] font-black text-white uppercase tracking-[0.5em]">Live Cinematic Reveal</span>
        </div>
      )}
    </div>
  );
});

export default AutoColorCanvas;
