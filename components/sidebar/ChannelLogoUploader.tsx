
import React, { useRef, useState } from 'react';
import { User, Upload, X, Terminal, ShieldCheck } from 'lucide-react';

interface ChannelLogoUploaderProps {
  onLogoSelect: (url: string | null) => void;
  disabled?: boolean;
}

const ChannelLogoUploader: React.FC<ChannelLogoUploaderProps> = ({ onLogoSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onLogoSelect(url);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onLogoSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full border border-white/5 bg-zinc-900/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity_Asset</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-600">OUTRO_LOGO</span>
      </div>

      <div className="p-3">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {!previewUrl ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full h-16 border border-dashed border-white/10 hover:border-blue-500/40 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-3 transition-all group"
          >
            <Upload className="w-4 h-4 text-zinc-500 group-hover:text-blue-500" />
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-widest">Upload Profile Logo</span>
          </button>
        ) : (
          <div className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-blue-500/30 overflow-hidden bg-zinc-800">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Logo Preview" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-200 uppercase">Channel_Avatar</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-mono text-emerald-500/70">MOUNTED_OK</span>
                </div>
              </div>
            </div>
            <button onClick={handleClear} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelLogoUploader;
