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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-7xl px-8 flex flex-col lg:flex-row gap-12 items-start pb-20"
    >
      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-5xl font-black uppercase tracking-tight italic text-[var(--color-pawtobooth-dark)]">Select <span className="text-[#3E6B43]/60">Your Favs</span></h2>
            <div className="flex items-center gap-4">
               <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                 <MousePointer2 className="w-3 h-3" /> Tap photos to pick, then drag photos on the right to align
               </p>
               <div className="h-px flex-1 bg-black/5" />
               <p className="text-xs font-black uppercase tracking-widest text-[#3E6B43]">
                 {selectedIndices.length} / {slotCount} SELECTED
               </p>
            </div>
          </div>
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
                </button>

                {!isTimeout && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectiveRetake(i); }}
                    className="absolute bottom-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-black/5 text-[#3E6B43] opacity-0 group-hover:opacity-100 transition-all hover:scale-110 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retake</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Editing Controls */}
        <AnimatePresence>
          {activeEditIdx !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#3E6B43]/10 rounded-2xl text-[#3E6B43]">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-xs tracking-widest">Adjust Photo #{activeEditIdx + 1}</h4>
                    <p className="text-[10px] text-black/40 uppercase tracking-widest">Zoom and Drag to fit the frame</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveEditIdx(null)}
                  className="px-6 py-2 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-widest"
                >
                  Done
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest w-12">Zoom</span>
                  <input 
                    type="range" 
                    min="1" max="3" step="0.01"
                    value={transforms[activeEditIdx].scale}
                    onChange={(e) => updateTransform(activeEditIdx, { scale: parseFloat(e.target.value) })}
                    className="flex-1 accent-[#3E6B43]"
                  />
                  <span className="text-[10px] font-mono w-12">{Math.round(transforms[activeEditIdx].scale * 100)}%</span>
                </div>
                <button 
                  onClick={() => updateTransform(activeEditIdx, { x: 0, y: 0, scale: 1 })}
                  className="text-[10px] font-black uppercase tracking-widest text-[#3E6B43] hover:underline"
                >
                  Reset Position
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-6 pt-8">
          <button 
            onClick={onRetake}
            disabled={isTimeout}
            className={cn(
              "flex items-center gap-3 border px-10 py-5 rounded-full transition-all uppercase text-xs font-black tracking-[0.2em]",
              isTimeout ? "opacity-50 grayscale cursor-not-allowed" : "border-black/20 text-black/40 hover:text-black bg-white shadow-sm"
            )}
          >
            <RefreshCcw className="w-4 h-4" /> Reset All
          </button>
          <button 
            onClick={() => onFinalize(arrangedPhotos, transforms)}
            disabled={!isComplete}
            className="flex-1 flex items-center justify-center gap-3 bg-[#3E6B43] text-white px-12 py-5 rounded-full font-black uppercase text-sm tracking-[0.2em] hover:-translate-y-0.5 hover:bg-black transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isComplete ? 'Finalize Print' : `Select ${slotCount - selectedIndices.length} more`} <Check className="w-6 h-6 border-2 border-white rounded-full" />
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[400px] shrink-0 space-y-6 lg:sticky lg:top-8">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60 text-center flex items-center justify-center gap-2">
           <Move className="w-3 h-3" /> Drag Photos Below to Align
        </h3>
        <div className="bg-white p-4 rounded-[40px] border border-black/5 shadow-2xl relative overflow-hidden">
           <div className="flex gap-4 aspect-[4/6] relative bg-neutral-100 overflow-hidden">
              {[0, 1].map((stripIdx) => (
                <div key={stripIdx} className="flex-1 flex flex-col gap-2 relative z-0">
                  {Array.from({ length: slotCount }).map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => arrangedPhotos[i] && setActiveEditIdx(i)}
                      className={cn(
                        "w-full aspect-square bg-neutral-200 overflow-hidden relative cursor-move transition-shadow",
                        activeEditIdx === i && "ring-4 ring-[#3E6B43] ring-inset z-20 shadow-2xl"
                      )}
                    >
                      {arrangedPhotos[i] ? (
                        <motion.img 
                          drag
                          dragMomentum={false}
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
                            touchAction: 'none'
                          }}
                          src={arrangedPhotos[i]} 
                          className="w-full h-full object-cover pointer-events-none select-none" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/10 font-black text-4xl">
                           {i + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {templateImageUrl && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                   <img src={templateImageUrl} className="w-full h-full object-cover" />
                </div>
              )}
           </div>
           
           <div className="mt-6 flex items-center justify-center gap-3 py-4 border-t border-black/5">
              <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
              <p className="text-[8px] font-mono uppercase tracking-widest text-black/40">Manual Alignment Active</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
