import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Check, MousePointer2, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { PLATFORM_NAME } from '../../lib/constants';

interface ReviewGalleryProps {
  photos: string[];
  slotCount: number;
  templateImageUrl?: string | null;
  onRetake: () => void;
  onSelectiveRetake: (index: number) => void;
  onFinalize: (arrangedPhotos: string[]) => void;
  isTimeout?: boolean;
}

export function ReviewGallery({ 
  photos, 
  slotCount,
  templateImageUrl,
  onRetake, 
  onSelectiveRetake,
  onFinalize,
  isTimeout = false 
}: ReviewGalleryProps) {
  // selectedIndices keeps track of which photos are picked and in what order
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handlePhotoClick = (idx: number) => {
    const currentPos = selectedIndices.indexOf(idx);
    
    if (currentPos !== -1) {
      // Deselect
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      // Select if we haven't reached the limit
      if (selectedIndices.length < slotCount) {
        setSelectedIndices([...selectedIndices, idx]);
      }
    }
  };

  const arrangedPhotos = selectedIndices.map(idx => photos[idx]);
  const isComplete = selectedIndices.length === slotCount;

  return (
    <motion.div 
      key="review"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-7xl px-8 flex flex-col lg:flex-row gap-12 items-start"
    >
      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-5xl font-black uppercase tracking-tight italic text-[var(--color-pawtobooth-dark)]">Select <span className="text-[#3E6B43]/60">Your Favs</span></h2>
            <div className="flex items-center gap-4">
               <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                 <MousePointer2 className="w-3 h-3" /> Tap photos in the order you want them to appear
               </p>
               <div className="h-px flex-1 bg-black/5" />
               <p className="text-xs font-black uppercase tracking-widest text-[#3E6B43]">
                 {selectedIndices.length} / {slotCount} SELECTED
               </p>
            </div>
          </div>
          
          {isTimeout && (
            <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
               <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Session Timeout: Start over disabled</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map((photo, i) => {
            const selectionOrder = selectedIndices.indexOf(i);
            const isSelected = selectionOrder !== -1;
            
            return (
              <div key={i} className="relative group">
                <button 
                  onClick={() => handlePhotoClick(i)}
                  className={cn(
                    "relative w-full aspect-square rounded-[3rem] overflow-hidden border-4 transition-all duration-500 shadow-md",
                    isSelected ? "border-[#3E6B43] scale-105 shadow-2xl" : "border-black/5 hover:border-black/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <img src={photo} className="w-full h-full object-cover" />
                  
                  {/* Selection Badge */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-6 right-6 w-12 h-12 bg-[#3E6B43] text-white rounded-full flex items-center justify-center font-black text-xl shadow-xl border-4 border-white"
                      >
                        {selectionOrder + 1}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn(
                    "absolute inset-0 bg-white/20 backdrop-blur-[2px] transition-opacity flex items-center justify-center",
                    isSelected ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                  )}>
                     <span className="bg-white text-[var(--color-pawtobooth-dark)] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-md">
                       Pick Me
                     </span>
                  </div>
                </button>

                {/* Selective Retake Button */}
                {!isTimeout && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectiveRetake(i);
                    }}
                    className="absolute bottom-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-black/5 text-[#3E6B43] opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retake</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 pt-8">
          <button 
            onClick={onRetake}
            disabled={isTimeout}
            className={cn(
              "flex items-center gap-3 border px-10 py-5 rounded-full transition-all uppercase text-xs font-black tracking-[0.2em]",
              isTimeout 
                ? "border-black/5 text-[var(--color-pawtobooth-dark)]/10 cursor-not-allowed opacity-50" 
                : "border-black/20 text-[var(--color-pawtobooth-dark)]/40 hover:text-[var(--color-pawtobooth-dark)] hover:bg-black/5 bg-white shadow-sm"
            )}
          >
            <RefreshCcw className="w-4 h-4" /> Reset All
          </button>
          <button 
            onClick={() => onFinalize(arrangedPhotos)}
            disabled={!isComplete}
            className="flex-1 flex items-center justify-center gap-3 bg-[#3E6B43] text-white px-12 py-5 rounded-full font-black uppercase text-sm tracking-[0.2em] hover:-translate-y-0.5 hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-md disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            {isComplete ? 'Finalize Print' : `Select ${slotCount - selectedIndices.length} more`} <Check className="w-6 h-6 border-2 border-white rounded-full" />
          </button>
        </div>
      </div>

      {/* Live Strip Preview */}
      <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-8">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60 text-center">Live Strip Preview</h3>
        <div className="bg-white p-4 rounded-[40px] border border-black/5 shadow-2xl relative overflow-hidden">
           <div className="flex gap-4 aspect-[4/6] relative">
              {[0, 1].map((stripIdx) => (
                <div key={stripIdx} className="flex-1 flex flex-col gap-2 relative z-0">
                  {Array.from({ length: slotCount }).map((_, i) => (
                    <div key={i} className="w-full aspect-square bg-neutral-50 rounded-sm overflow-hidden relative border border-black/5">
                      {arrangedPhotos[i] ? (
                        <img src={arrangedPhotos[i]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/5 font-black text-4xl">
                           {i + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Template Overlay on top of preview */}
              {templateImageUrl && (
                <div className="absolute inset-0 z-10 pointer-events-none flex gap-4">
                   <img src={templateImageUrl} className="w-[calc(50%-8px)] h-full object-cover" />
                   <img src={templateImageUrl} className="w-[calc(50%-8px)] h-full object-cover" />
                </div>
              )}
           </div>
           
           <div className="mt-6 flex items-center justify-center gap-3 py-4 border-t border-black/5">
              <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
              <p className="text-[8px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40">WYSIWYG Generator Active</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
