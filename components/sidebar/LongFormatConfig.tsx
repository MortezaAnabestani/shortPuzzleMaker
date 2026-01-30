/**
 * Long Format Configuration UI
 *
 * User interface for selecting and configuring long-form video generation (8+ minutes)
 */

import React, { useState } from 'react';
import { LongFormGenre, LongFormStructure } from '../../types-longform';
import { LONGFORM_TEMPLATES } from '../../services/longform/genreTemplates';

interface LongFormatConfigProps {
  onStartProduction: (structure: LongFormStructure) => void;
  isGenerating: boolean;
}

const GENRE_INFO: Record<
  LongFormGenre,
  { emoji: string; label: string; description: string; example: string }
> = {
  [LongFormGenre.HISTORICAL_RECONSTRUCTION]: {
    emoji: '🏛️',
    label: 'Historical Reconstruction',
    description: 'Step-by-step recreation of major historical events',
    example: 'e.g., Fall of the Roman Empire, World War II',
  },
  [LongFormGenre.SCIENTIFIC_DEEPDIVE]: {
    emoji: '🔬',
    label: 'Scientific Deep-Dive',
    description: 'Explaining complex scientific phenomena with visualization',
    example: 'e.g., From Galaxy to DNA, Evolution of the Universe',
  },
  [LongFormGenre.GEOGRAPHIC_JOURNEY]: {
    emoji: '🌍',
    label: 'Geographic Journey',
    description: 'Virtual travel to stunning locations around the world',
    example: 'e.g., Seven Wonders, Hidden Places',
  },
  [LongFormGenre.ART_EVOLUTION]: {
    emoji: '🎨',
    label: 'Art Evolution',
    description: 'History of art from the beginning to today',
    example: 'e.g., Evolution of Painting, Grand Architecture',
  },
  [LongFormGenre.LIFE_CYCLE_STORY]: {
    emoji: '🧬',
    label: 'Life Cycle Story',
    description: 'The story of birth, growth, and death of a being',
    example: 'e.g., Life Cycle of a Star, Animal Lives',
  },
  [LongFormGenre.CONSTRUCTION_TIMELAPSE]: {
    emoji: '🏗️',
    label: 'Construction Timelapse',
    description: 'Building great structures from start to finish',
    example: 'e.g., Building the Eiffel Tower, Great Dams',
  },
  [LongFormGenre.STORY_ARC]: {
    emoji: '🎭',
    label: 'Story Arc',
    description: 'A complete story with beginning, middle, and end',
    example: 'e.g., Historical Legends, Biographies',
  },
  [LongFormGenre.MYSTERY_REVEAL]: {
    emoji: '🔮',
    label: 'Mystery Reveal',
    description: 'A mystery that gets solved step by step',
    example: 'e.g., Bermuda Triangle, Egyptian Pyramids',
  },
};

export const LongFormatConfig: React.FC<LongFormatConfigProps> = ({
  onStartProduction,
  isGenerating,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<LongFormGenre | null>(null);
  const [duration, setDuration] = useState<number>(8);

  const handleStartProduction = () => {
    if (!selectedGenre) return;

    const templateCreator = LONGFORM_TEMPLATES[selectedGenre];
    if (!templateCreator) {
      console.error(`No template found for genre: ${selectedGenre}`);
      return;
    }

    const structure = templateCreator();
    structure.totalDuration = duration;

    console.log(`🎬 [LongFormat] Starting production:`, structure);
    onStartProduction(structure);
  };

  return (
    <div className="long-format-config space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          📽️ Long Format Mode
        </h2>
        <p className="text-sm text-slate-400">
          Create high-retention puzzle videos (8+ minutes)
        </p>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Total Duration: <span className="text-cyan-400 font-bold">{duration} minutes</span>
        </label>
        <input
          type="range"
          min="8"
          max="30"
          step="1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          disabled={isGenerating}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>8 min</span>
          <span>15 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Genre Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          Select Genre:
        </label>
        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {Object.values(LongFormGenre).map((genre) => {
            const info = GENRE_INFO[genre];
            const isSelected = selectedGenre === genre;

            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                disabled={isGenerating}
                className={`
                  text-left p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{info.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {info.label}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      {info.description}
                    </p>
                    <p className="text-xs text-cyan-400 font-mono">
                      {info.example}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="text-cyan-500">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Genre Info */}
      {selectedGenre && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-cyan-400">
            📊 Video Structure:
          </h4>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• 5-7 independent scenes (60-120 seconds each)</li>
            <li>• Dynamic music (changes between scenes)</li>
            <li>• Fact Cards every 20-30 seconds</li>
            <li>• Progress Bar and Chapter Titles</li>
            <li>• Cinematic transition animations</li>
          </ul>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartProduction}
        disabled={!selectedGenre || isGenerating}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white text-base
          transition-all duration-200 transform
          ${
            !selectedGenre || isGenerating
              ? 'bg-slate-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:scale-[1.02] shadow-lg shadow-cyan-500/30'
          }
        `}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </span>
        ) : (
          <span>🚀 Start Long Format Production</span>
        )}
      </button>

      {/* Info Footer */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800">
        💡 Tip: Long-form videos with multi-scene structure have higher retention rates
      </div>
    </div>
  );
};

export default LongFormatConfig;
