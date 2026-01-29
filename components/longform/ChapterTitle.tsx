import React, { useEffect, useState } from 'react';

interface ChapterTitleProps {
  title: string;
  subtitle?: string;
  chapterNumber: number;
  totalChapters: number;
  onComplete?: () => void;
}

export const ChapterTitle: React.FC<ChapterTitleProps> = ({
  title,
  subtitle,
  chapterNumber,
  totalChapters,
  onComplete
}) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fade in animation
    const showTimer = setTimeout(() => setVisible(true), 100);

    // Start fade out
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);

    // Complete and unmount
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center
        bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80
        transition-opacity duration-500
        ${visible && !fadeOut ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="text-center max-w-4xl px-8">
        {/* Chapter Number */}
        <div className="mb-6">
          <span className="text-purple-400 text-xl font-light tracking-widest">
            CHAPTER {chapterNumber} / {totalChapters}
          </span>
        </div>

        {/* Main Title */}
        <h1
          className={`
            text-6xl font-bold mb-4
            bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400
            bg-clip-text text-transparent
            transform transition-all duration-700
            ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}
          `}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className={`
              text-2xl text-gray-300 font-light
              transform transition-all duration-700 delay-200
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {subtitle}
          </p>
        )}

        {/* Decorative Line */}
        <div
          className={`
            mt-8 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent
            transform transition-all duration-1000 delay-300
            ${visible ? 'scale-x-100' : 'scale-x-0'}
          `}
        />
      </div>
    </div>
  );
};