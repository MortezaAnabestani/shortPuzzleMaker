/**
 * Long Format Progress Bar Component
 *
 * Shows overall progress through the long-form video
 */

import React from 'react';
import { LongFormStructure } from '../../types-longform';

interface ProgressBarProps {
  structure: LongFormStructure;
  currentSceneIndex: number;
  sceneProgress: number; // 0-100 percentage within current scene
  position: 'top' | 'bottom';
  style: 'chapter-count' | 'percentage' | 'time-remaining';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  structure,
  currentSceneIndex,
  sceneProgress,
  position,
  style,
}) => {
  const totalScenes = structure.scenes.length;
  const currentScene = structure.scenes[currentSceneIndex];

  // Calculate overall progress
  const scenesCompleted = currentSceneIndex;
  const currentSceneWeight = sceneProgress / 100;
  const overallProgress = ((scenesCompleted + currentSceneWeight) / totalScenes) * 100;

  // Calculate time remaining
  const calculateTimeRemaining = (): string => {
    const remainingScenes = structure.scenes.slice(currentSceneIndex);
    const totalSecondsRemaining = remainingScenes.reduce((acc, scene, index) => {
      if (index === 0) {
        // For current scene, only count remaining time
        return acc + (scene.duration * (1 - sceneProgress / 100));
      }
      return acc + scene.duration;
    }, 0);

    const minutes = Math.floor(totalSecondsRemaining / 60);
    const seconds = Math.floor(totalSecondsRemaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4';

  return (
    <div
      className={`fixed ${positionClasses} left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-4xl`}
    >
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-2xl">
        {/* Header with style-specific info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {style === 'chapter-count' && (
              <>
                <span className="text-cyan-400 font-bold text-sm">
                  Chapter {currentSceneIndex + 1}/{totalScenes}
                </span>
                <span className="text-slate-400 text-xs">
                  {currentScene?.title}
                </span>
              </>
            )}
            {style === 'percentage' && (
              <span className="text-cyan-400 font-bold text-sm">
                {Math.round(overallProgress)}% Complete
              </span>
            )}
            {style === 'time-remaining' && (
              <>
                <span className="text-cyan-400 font-bold text-sm">
                  Time Remaining: {calculateTimeRemaining()}
                </span>
                <span className="text-slate-400 text-xs">
                  Scene {currentSceneIndex + 1}/{totalScenes}
                </span>
              </>
            )}
          </div>

          {/* Genre badge */}
          <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            {structure.genre.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Progress bar track */}
        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          {/* Scene markers */}
          <div className="absolute inset-0 flex">
            {structure.scenes.map((_, index) => {
              const sceneWidth = 100 / totalScenes;
              return (
                <div
                  key={index}
                  className="border-r border-slate-700"
                  style={{ width: `${sceneWidth}%` }}
                />
              );
            })}
          </div>

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          >
            {/* Animated glow */}
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Scene thumbnails (mini chapters) */}
        {structure.retentionHooks.chapterTitles && (
          <div className="flex gap-1 mt-2">
            {structure.scenes.map((scene, index) => {
              const isCompleted = index < currentSceneIndex;
              const isCurrent = index === currentSceneIndex;
              const isPending = index > currentSceneIndex;

              return (
                <div
                  key={scene.id}
                  className={`
                    flex-1 h-1 rounded-full transition-all duration-300
                    ${isCompleted ? 'bg-cyan-500' : ''}
                    ${isCurrent ? 'bg-cyan-400 animate-pulse' : ''}
                    ${isPending ? 'bg-slate-700' : ''}
                  `}
                  title={scene.title}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
