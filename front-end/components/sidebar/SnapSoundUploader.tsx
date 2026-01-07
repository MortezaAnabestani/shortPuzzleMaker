import React, { useRef, useState } from "react";
import { Volume2, Upload, X, CheckCircle2, FileAudio, Waves, Zap, BoxSelect } from "lucide-react";
import { sonicEngine, SoundType } from "../../services/proceduralAudio";

interface SoundSlot {
  type: SoundType;
  label: string;
  icon: React.ReactNode;
}

const SOUND_SLOTS: SoundSlot[] = [
  { type: "MOVE", label: "صدای حرکت قطعات", icon: <Zap className="w-3.5 h-3.5" /> },
  { type: "SNAP", label: "صدای قفل شدن (Snap)", icon: <BoxSelect className="w-3.5 h-3.5" /> },
  { type: "WAVE", label: "صدای موج نهایی", icon: <Waves className="w-3.5 h-3.5" /> },
  { type: "DESTRUCT", label: "صدای انفجار/تخریب", icon: <X className="w-3.5 h-3.5" /> },
];

const SnapSoundUploader: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const [loadedSounds, setLoadedSounds] = useState<Set<SoundType>>(new Set());
  const fileInputs = useRef<Map<SoundType, HTMLInputElement>>(new Map());

  const handleFileChange = async (type: SoundType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await sonicEngine.setSound(type, file);
        setLoadedSounds((prev) => new Set(prev).add(type));
      } catch (err) {
        alert("خطا در بارگذاری فایل.");
      }
    }
  };

  const handleClear = (type: SoundType) => {
    sonicEngine.clearSound(type);
    setLoadedSounds((prev) => {
      const n = new Set(prev);
      n.delete(type);
      return n;
    });
    if (fileInputs.current.get(type)) {
      fileInputs.current.get(type)!.value = "";
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 text-zinc-400 px-1">
        <Volume2 className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">Audio Profile Studio</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {SOUND_SLOTS.map((slot) => {
          const isLoaded = loadedSounds.has(slot.type);
          return (
            <div
              key={slot.type}
              className="group relative flex items-center justify-between bg-zinc-900/40 border border-white/5 p-2 rounded-xl hover:border-blue-500/20 transition-all"
            >
              <input
                type="file"
                // Fix: ref callback must return void. Map.set returns the Map, causing a TS error.
                ref={(el) => {
                  if (el) fileInputs.current.set(slot.type, el);
                }}
                onChange={(e) => handleFileChange(slot.type, e)}
                accept="audio/*"
                className="hidden"
              />

              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isLoaded ? "bg-blue-600 text-white shadow-lg" : "bg-zinc-800 text-zinc-600"
                  }`}
                >
                  {slot.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-zinc-300 tracking-wide">{slot.label}</span>
                  <span className="text-[8px] font-mono text-zinc-600 uppercase">
                    {isLoaded ? "Buffered_Ready" : "Waiting_Input"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!isLoaded ? (
                  <button
                    disabled={disabled}
                    onClick={() => fileInputs.current.get(slot.type)?.click()}
                    className="p-2 bg-white/5 hover:bg-blue-600/20 rounded-lg text-zinc-500 hover:text-blue-400 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    <button
                      onClick={() => handleClear(slot.type)}
                      className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SnapSoundUploader;
