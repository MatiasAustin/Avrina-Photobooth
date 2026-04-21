import { motion } from 'motion/react';
import { RefreshCcw, Check, MousePointer2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface ReviewGalleryProps {
  photos: string[];
  onRetake: () => void;
  onFinalize: (arrangedPhotos: string[]) => void;
}

export function ReviewGallery({ photos: initialPhotos, onRetake, onFinalize }: ReviewGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handlePhotoClick = (idx: number) => {
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap
      const newPhotos = [...photos];
      const temp = newPhotos[selectedIdx];
      newPhotos[selectedIdx] = newPhotos[idx];
      newPhotos[idx] = temp;
      setPhotos(newPhotos);
      setSelectedIdx(null);
    }
  };

  return (
    <motion.div 
      key="review"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-7xl px-8 flex flex-col lg:flex-row gap-12 items-start"
    >
      <div className="flex-1 space-y-12">
        <div className="space-y-2">
          <h2 className="text-5xl font-black uppercase tracking-tight italic">Review <span className="text-white/20">Gallery</span></h2>
          <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <MousePointer2 className="w-3 h-3" /> Tap two photos to swap their order
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {photos.map((photo, i) => (
            <button 
              key={i} 
              onClick={() => handlePhotoClick(i)}
              className={cn(
                "relative aspect-[4/3] rounded-[32px] overflow-hidden border-4 transition-all duration-500 group",
                selectedIdx === i ? "border-white scale-95" : "border-white/5 hover:border-white/20"
              )}
            >
              <img src={photo} className="w-full h-full object-cover" />
              <div className={cn(
                "absolute inset-0 bg-white/20 backdrop-blur-sm transition-opacity flex items-center justify-center",
                selectedIdx === i ? "opacity-100" : "opacity-0 group-hover:opacity-10"
              )}>
                 <span className="bg-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                   {selectedIdx === i ? 'Selected' : 'Swap'}
                 </span>
              </div>
              <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-tighter border border-white/10">
                Slot {i + 1}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-8">
          <button 
            onClick={onRetake}
            className="flex items-center gap-3 border border-white/20 px-10 py-5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase text-xs font-black tracking-[0.2em]"
          >
            <RefreshCcw className="w-4 h-4" /> Start Over
          </button>
          <button 
            onClick={() => onFinalize(photos)}
            className="flex-1 flex items-center justify-center gap-3 bg-white text-black px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            Finalize Strip <Check className="w-6 h-6 border-2 border-black rounded-full" />
          </button>
        </div>
      </div>

      {/* 2x6 Strip Preview (Double) */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-6">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 text-center">Live Strip Preview (Print Layout)</h3>
        <div className="bg-neutral-900/50 p-6 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="aspect-[4/6] bg-white rounded-2xl overflow-hidden p-4 flex gap-4">
            {[0, 1].map((stripIdx) => (
              <div key={stripIdx} className="flex-1 flex flex-col gap-2">
                {[...photos, ...Array(Math.max(0, 6 - photos.length)).fill(null)].slice(stripIdx * 3, (stripIdx + 1) * 3).map((p, i) => (
                  <div key={i} className="flex-1 bg-neutral-200 rounded-sm overflow-hidden relative border border-black/5">
                    {p ? <img src={p} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black/10 font-black text-2xl italic">{(stripIdx * 3) + i + 1}</div>}
                  </div>
                ))}
                <div className="h-10 flex flex-col items-center justify-center border-t border-black/5 pt-1">
                   <span className="text-[6px] font-black text-neutral-400 tracking-tighter italic uppercase text-center leading-none">Avrina Photobooth<br/>v1.0 Strip</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-neutral-600 text-center mt-4 font-mono uppercase tracking-widest italic">Classic 4x6 Double-Strip Format (3 Shots)</p>
        </div>
      </div>
    </motion.div>
  );
}
