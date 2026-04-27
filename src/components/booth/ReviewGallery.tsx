import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { RefreshCcw, Check, MousePointer2, Image as ImageIcon, RotateCcw, Move, ZoomIn } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { PLATFORM_NAME } from '../../lib/constants';

interface PhotoTransform {
  x: number;
  y: number;
  scale: number;
}

interface ReviewGalleryProps {
  photos: string[];
  slotCount: number;
  templateImageUrl?: string | null;
  onRetake: () => void;
  onSelectiveRetake: (index: number) => void;
  onFinalize: (arrangedPhotos: string[], transforms: PhotoTransform[]) => void;
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
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
  const [transforms, setTransforms] = useState<PhotoTransform[]>(
    Array(slotCount).fill({ x: 0, y: 0, scale: 1 })
  );

  const handlePhotoClick = (idx: number) => {
    const currentPos = selectedIndices.indexOf(idx);
    if (currentPos !== -1) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else if (selectedIndices.length < slotCount) {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const updateTransform = (slotIdx: number, updates: Partial<PhotoTransform>) => {
    setTransforms(prev => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], ...updates };
      return next;
    });
  };

  const arrangedPhotos = selectedIndices.map(idx => photos[idx]);
  const isComplete = selectedIndices.length === slotCount;

  return (
    <motion.div 
      key="review"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="z-10 w-full max-w-7xl px-8 flex flex-col lg:flex-row gap-16 items-start pb-32 pt-12 mx-auto"
    >
      {/* Left: Selection Gallery */}
      <div className="flex-1 space-y-10 w-full">
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-6xl font-black uppercase tracking-tighter italic text-[var(--color-pawtobooth-dark)] leading-none">
              Select <span className="text-[#3E6B43]">Your Favs</span>
            </h2>
            <div className="flex items-center gap-6">
               <p className="text-[var(--color-pawtobooth-dark)]/40 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                 <MousePointer2 className="w-4 h-4 text-[#3E6B43]" /> Tap to pick, drag on the right to align
               </p>
               <div className="h-px flex-1 bg-black/5" />
               <div className="bg-[#3E6B43]/5 px-4 py-2 rounded-full border border-[#3E6B43]/10">
                 <p className="text-xs font-black uppercase tracking-widest text-[#3E6B43]">
                   {selectedIndices.length} / {slotCount} SELECTED
                 </p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {photos.map((photo, i) => {
            const selectionOrder = selectedIndices.indexOf(i);
            const isSelected = selectionOrder !== -1;
            
            return (
              <div key={i} className="relative group">
                <button 
                  onClick={() => handlePhotoClick(i)}
                  className={cn(
                    "relative w-full aspect-square rounded-[3rem] overflow-hidden border-4 transition-all duration-500",
                    isSelected 
                      ? "border-[#3E6B43] scale-[1.05] shadow-[0_20px_50px_rgba(62,107,67,0.3)] z-10" 
                      : "border-black/5 hover:border-black/10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 bg-white"
                  )}
                >
                  <img src={photo} className="w-full h-full object-cover" />
                  
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-6 right-6 w-14 h-14 bg-[#3E6B43] text-white rounded-full flex items-center justify-center font-black text-2xl shadow-2xl border-4 border-white"
                      >
                        {selectionOrder + 1}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                {!isTimeout && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectiveRetake(i); }}
                    className="absolute bottom-4 right-4 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 text-[#3E6B43] opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center gap-2 z-20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retake</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 pt-12">
          <button 
            onClick={onRetake}
            disabled={isTimeout}
            className={cn(
              "flex items-center gap-4 border px-12 py-6 rounded-full transition-all uppercase text-xs font-black tracking-[0.2em] shadow-sm",
              isTimeout ? "opacity-50 grayscale cursor-not-allowed" : "border-black/10 text-black/40 hover:text-white hover:bg-red-500 hover:border-red-500 bg-white"
            )}
          >
            <RefreshCcw className="w-5 h-5" /> Reset Selection
          </button>
          <button 
            onClick={() => onFinalize(arrangedPhotos, transforms)}
            disabled={!isComplete}
            className="flex-1 flex items-center justify-center gap-4 bg-[#3E6B43] text-white px-12 py-6 rounded-full font-black uppercase text-sm tracking-[0.2em] hover:scale-[1.02] hover:bg-black transition-all shadow-xl shadow-[#3E6B43]/20 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isComplete ? 'Confirm Layout' : `Select ${slotCount - selectedIndices.length} More`} 
            <Check className="w-7 h-7 bg-white/20 rounded-full p-1" />
          </button>
        </div>
      </div>

      {/* Right: 4R Preview Canvas */}
      {/* Right: 4R Preview Canvas */}
      <div className="w-full lg:w-[480px] shrink-0 space-y-8 lg:sticky lg:top-12">
        <div className="space-y-2">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--color-pawtobooth-dark)]/40 text-center flex items-center justify-center gap-3">
             <Move className="w-4 h-4 text-[#3E6B43]" /> Adjust to Template
          </h3>
        </div>

        <div className="bg-white p-6 rounded-[50px] border border-black/5 shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative group">
           <div className="relative aspect-[4/6] bg-neutral-100 rounded-[2rem] overflow-hidden shadow-inner">
              
              {/* Layer 0: Selected Photos Background */}
              {selectedIndices.map((photoIdx, i) => (
                <motion.div
                  key={`slot-${photoIdx}`}
                  drag
                  dragMomentum={false}
                  onDragStart={() => setActiveEditIdx(i)}
                  onDrag={(e, info) => {
                    updateTransform(i, { 
                      x: transforms[i].x + info.delta.x,
                      y: transforms[i].y + info.delta.y 
                    });
                  }}
                  style={{ 
                    x: transforms[i].x, 
                    y: transforms[i].y, 
                    scale: transforms[i].scale,
                    width: '55%', // Slightly larger initial size
                    aspectRatio: '1/1',
                    touchAction: 'none',
                    position: 'absolute',
                    top: `${10 + (i * 10)}%`, // Stagger initial positions so they don't overlap perfectly
                    left: '22%',
                    zIndex: activeEditIdx === i ? 30 : 10 // Active photo always on top
                  }}
                  className={cn(
                    "cursor-move overflow-hidden bg-neutral-200 shadow-2xl border-4 transition-shadow",
                    activeEditIdx === i ? "border-[#3E6B43] ring-8 ring-[#3E6B43]/20" : "border-white shadow-lg"
                  )}
                >
                   <img 
                     src={photos[photoIdx]} 
                     className="w-full h-full object-cover pointer-events-none select-none" 
                   />
                   <div className="absolute top-2 left-2 w-7 h-7 bg-[#3E6B43] text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">
                      {i + 1}
                   </div>
                </motion.div>
              ))}

              {/* Layer 2: Template Overlay (Fixed on Top, semi-transparent during edit) */}
              {templateImageUrl && (
                <div 
                  className={cn(
                    "absolute inset-0 pointer-events-none transition-opacity duration-300",
                    activeEditIdx !== null ? "z-20 opacity-50" : "z-[25] opacity-100"
                  )}
                >
                   <img src={templateImageUrl} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Helper for empty slots */}
              {selectedIndices.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-black/5 gap-4">
                   <ImageIcon className="w-20 h-20" />
                   <p className="font-black uppercase tracking-[0.3em] text-xs">Pick a photo to start</p>
                </div>
              )}
           </div>

           {/* Active Photo Controls */}
           <AnimatePresence>
             {activeEditIdx !== null && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="mt-6 p-8 bg-neutral-50 rounded-[2.5rem] border border-black/5 space-y-6 shadow-sm"
               >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#3E6B43] rounded-lg text-white">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-[var(--color-pawtobooth-dark)]">Size Adjustment #{activeEditIdx + 1}</span>
                    </div>
                    <button 
                      onClick={() => setActiveEditIdx(null)} 
                      className="px-4 py-2 bg-white border border-black/5 rounded-full text-[10px] font-black text-black/40 uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      Done
                    </button>
                 </div>
                 <div className="flex items-center gap-4">
                   <input 
                      type="range" 
                      min="0.3" max="3" step="0.01"
                      value={transforms[activeEditIdx].scale}
                      onChange={(e) => updateTransform(activeEditIdx, { scale: parseFloat(e.target.value) })}
                      className="flex-1 accent-[#3E6B43]"
                   />
                   <span className="text-[10px] font-mono font-bold text-[#3E6B43]">{Math.round(transforms[activeEditIdx].scale * 100)}%</span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
           
           <div className="mt-8 flex items-center justify-center gap-4 py-4 border-t border-black/5">
              <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-black/40 font-bold">Live Layout Editor Active</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
