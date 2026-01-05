
import React, { useState, useEffect } from 'react';
import { BookOpen, Quote } from 'lucide-react';

interface DocumentaryOverlayProps {
  progress: number;
  snippets: string[];
  isEnabled: boolean;
  isSolving: boolean;
}

const DocumentaryOverlay: React.FC<DocumentaryOverlayProps> = ({ progress, snippets, isEnabled, isSolving }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isEnabled || !isSolving || snippets.length === 0) {
      setIsVisible(false);
      return;
    }

    // Thresholds: 15%, 35%, 55%, 75%, 90%
    const thresholds = [15, 35, 55, 75, 90];
    const thresholdIndex = thresholds.findIndex((t) => progress >= t && progress < t + 7); 

    if (thresholdIndex !== -1) {
      setCurrentIndex(thresholdIndex % snippets.length);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [progress, isEnabled, isSolving, snippets]);

  if (!isEnabled || !isVisible || currentIndex === -1) return null;

  return (
    <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[110] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-start gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500/70">
            Documentary_Insight
          </span>
          <p className="text-[12px] font-bold text-white leading-tight break-words">
            {snippets[currentIndex]}
          </p>
        </div>
        <div className="absolute -top-3 -left-3 opacity-5">
            <Quote className="w-12 h-12 text-white" />
        </div>
      </div>
      
      {/* Dynamic Progress Bar for the snippet */}
      <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500/40 animate-pulse w-full" />
      </div>
    </div>
  );
};

export default DocumentaryOverlay;
