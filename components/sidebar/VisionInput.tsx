
import React, { useState } from 'react';
import { 
  Radio, Zap, ChevronRight, X, Loader2, LayoutGrid, Sparkles, 
  Heart, Flame, User, Star, Camera, BookOpen, Waves, Terminal, 
  ArrowRight, Hash, Globe, Landmark
} from 'lucide-react';
import { getTrendingTopics, generateVisualPromptFromTopic, fetchFactNarrative } from '../../services/geminiService';
import { TopicType } from '../../types';

export const VIRAL_CATEGORIES = [
  { id: 'ancient', label: 'Ancient Wonders', icon: <Landmark className="w-3.5 h-3.5" />, topic: 'Grand cinematic reconstructions of lost ancient wonders, pyramids, or temples with epic lighting and atmospheric historical accuracy.' },
  { id: 'portrait', label: 'Artistic Portrait', icon: <Camera className="w-3.5 h-3.5" />, topic: 'Diverse and expressive human portraiture exploring deep emotions and unique facial character through varied professional lighting.' },
  { id: 'celebrity', label: 'Celebrity Spotlight', icon: <Star className="w-3.5 h-3.5" />, topic: 'Iconic moments of global cultural influence, captured in high-glamour settings or legendary performances.' },
  { id: 'anim', label: 'Famous Animation', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Fantastical 3D digital worlds and high-detail character artistry from imaginary realms in dynamic encounters.' },
  { id: 'fashion', label: 'High-Fashion', icon: <User className="w-3.5 h-3.5" />, topic: 'Avant-garde style and luxury aesthetics, showcasing cutting-edge fashion trends and professional editorial studio artistry.' },
  { id: 'physique', label: 'Artistic Silhouette', icon: <User className="w-3.5 h-3.5" />, topic: 'The elegance of human form and athletic movement, captured as high-contrast artistic study through silhouettes.' },
  { id: 'sensual', label: 'Sensual Moods', icon: <Flame className="w-3.5 h-3.5" />, topic: 'Mysterious and evocative aesthetic scenes focusing on warmth, atmosphere, and sophisticated mood through cinematic lighting.' },
  { id: 'glamour', label: 'Luxury World', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'The peak of opulence, wealth, and grand aesthetics, featuring elite settings and high-value subjects.' },
  { id: 'cyber', label: 'Cyberpunk Future', icon: <Zap className="w-3.5 h-3.5" />, topic: 'Vivid futuristic cityscapes and advanced technological worlds, exploring the high-tech neon aesthetic.' },
  { id: 'myth', label: 'Mythical Legends', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Epic visual interpretations of ancient legends, cosmic deities, and celestial beings in grand environments.' },
  { id: 'cars', label: 'Supercars Apex', icon: <Zap className="w-3.5 h-3.5" />, topic: 'The energy and aesthetic of advanced mechanical engineering and hypercars in diverse cinematic settings.' },
  { id: 'dream', label: 'Surreal Dreams', icon: <Sparkles className="w-3.5 h-3.5" />, topic: 'Surreal visual explorations of the subconscious, featuring impossible architecture and vivid physics.' },
];

interface VisionInputProps {
  value: string;
  onChange: (value: string, topicType?: TopicType, topicCategory?: string) => void;
  disabled?: boolean;
}

const VisionInput: React.FC<VisionInputProps> = ({ value, onChange, disabled }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleFetchTrends = async () => {
    setIsSearching(true);
    setTopics([]);
    setShowCategories(false);
    try {
      const trending = await getTrendingTopics();
      setTopics(trending);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchNarrative = async () => {
    setIsSearching(true);
    setShowCategories(false);
    setTopics([]);
    try {
      const narrative = await fetchFactNarrative();
      const visualPrompt = await generateVisualPromptFromTopic(narrative);
      onChange(visualPrompt, TopicType.NARRATIVE, 'Historical Discovery');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTopic = async (topic: string, isFromViralCategories: boolean = false, categoryLabel?: string) => {
    setIsGeneratingScene(true);
    setTopics([]);
    setShowCategories(false);
    try {
      const visualPrompt = await generateVisualPromptFromTopic(topic);
      if (isFromViralCategories) {
        onChange(visualPrompt, TopicType.VIRAL, categoryLabel);
      } else {
        onChange(visualPrompt, TopicType.BREAKING);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  return (
    <div className="w-full flex flex-col border border-white/5 bg-zinc-900/50 rounded-2xl overflow-hidden shadow-xl transition-all focus-within:border-blue-500/30">
      {/* Header Toolbar - Dynamic Signal Selection */}
      <div className="flex flex-col border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Signal Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${isSearching ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[8px] font-mono text-zinc-600 uppercase">Uplink Status</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={handleFetchNarrative}
            disabled={disabled || isSearching || isGeneratingScene}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all whitespace-nowrap"
          >
            <BookOpen className="w-3 h-3" />
            <span>NARRATIVE</span>
          </button>

          <button 
            onClick={handleFetchTrends}
            disabled={disabled || isSearching || isGeneratingScene}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 transition-all whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            <span>BREAKING</span>
          </button>

          <button 
            onClick={() => setShowCategories(!showCategories)}
            disabled={disabled || isSearching || isGeneratingScene}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap
              ${showCategories 
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'}
            `}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>VIRAL</span>
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value, TopicType.MANUAL)}
          className={`
            w-full h-44 bg-transparent p-5 text-[14px] font-mono leading-relaxed text-zinc-200 
            placeholder:text-zinc-700 resize-none outline-none custom-scrollbar
            ${isGeneratingScene ? 'opacity-20 blur-[1px]' : ''}
          `}
          placeholder="// INPUT NARRATIVE SEED OR SELECT SIGNAL SOURCE..."
          disabled={disabled || isSearching || isGeneratingScene}
          spellCheck={false}
        />

        {/* Overlay: Categories (Full Height Panel) */}
        {showCategories && (
          <div className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> SELECT VIRAL NICHE
              </span>
              <button onClick={() => setShowCategories(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar grid grid-cols-1 gap-2">
              {VIRAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectTopic(cat.topic, true, cat.label)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-white/5 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white tracking-wide">
                        {cat.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-[10px] text-zinc-600 line-clamp-2 mt-1 group-hover:text-zinc-400 italic">
                      {cat.topic}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overlay: Trending Topics */}
        {topics.length > 0 && (
          <div className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" /> LIVE GLOBAL SIGNALS
              </span>
              <button onClick={() => setTopics([])} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {topics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTopic(topic)}
                  className="w-full text-left p-5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white leading-relaxed">
                    {topic}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isGeneratingScene && (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em] animate-pulse">
              Generating Visual Narrative...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisionInput;
