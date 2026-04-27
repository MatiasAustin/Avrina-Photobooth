import { RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoTemplate, BoothState } from '../../types';
import { cn } from '../../lib/utils';

interface CaptureStageProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTemplate: PhotoTemplate | null;
  countdown: number;
  currentShot: number;
  totalShots: number;
  lastCapturedPhoto?: string | null;
  state: BoothState;
  onRetake: () => void;
  onNext: () => void;
  isTimeout?: boolean;
  globalTimeLeft?: number | null;
}

export function CaptureStage({ 
  videoRef, 
  selectedTemplate, 
  countdown, 
  currentShot, 
  totalShots,
  lastCapturedPhoto,
  state,
  onRetake,
  onNext,
  isTimeout = false,
  globalTimeLeft = null
}: CaptureStageProps) {
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isReview = state === 'review_shot';

  return (
    <motion.div 
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-pawtobooth-beige)]/40 backdrop-blur-sm"
    >
      {/* 4x6 Aspect Ratio Container (Standard Photobooth Strip Layout) */}
      <div className="relative h-[85vh] aspect-[4/6] max-w-[90vw] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white pointer-events-auto">
        
        {/* Camera/Photo Area */}
        <div className="absolute inset-0 z-0">
          {isReview && lastCapturedPhoto ? (
            <motion.img 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              src={lastCapturedPhoto} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          )}
        </div>

        {/* Template Overlay - The Masterpiece */}
        {selectedTemplate?.image_url && (
          <div className={cn(
            "absolute inset-0 z-10 pointer-events-none transition-opacity duration-500",
            isReview ? "opacity-100" : "opacity-60"
          )}>
             <img 
               src={selectedTemplate.image_url} 
               className="w-full h-full object-cover" 
               referrerPolicy="no-referrer" 
             />
          </div>
        )}

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <span className="text-[12rem] font-black text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] italic">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls Overlay (only during review) */}
        {isReview && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute inset-x-0 bottom-0 z-40 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-2"
          >
             <h3 className="text-3xl font-black uppercase italic tracking-tight text-white">Shot #{currentShot + 1} Captured!</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-ping" />
                <p className="text-white/60 font-mono text-[10px] uppercase tracking-[0.2em]">Processing next photo...</p>
             </div>
          </motion.div>
        )}
      </div>

      {/* Floating Status Bar (Bottom of Screen) */}
      <div className="mt-8 bg-white/90 backdrop-blur-2xl px-10 py-5 rounded-full border border-black/5 flex items-center gap-12 text-xs font-mono uppercase tracking-widest z-30 shadow-2xl pointer-events-auto text-[var(--color-pawtobooth-dark)]">
         <div className="flex items-center gap-4">
           <span className="text-[var(--color-pawtobooth-dark)]/40 font-black">Status</span>
           <span className="font-black text-base">{currentShot + 1} <span className="text-black/10">/</span> {totalShots}</span>
         </div>
         
         <div className="w-[1px] h-8 bg-black/5" />
         
         <div className={cn("flex items-center gap-4", isTimeout && "text-red-500")}>
           <span className="text-[var(--color-pawtobooth-dark)]/40 font-black italic">Time Left</span>
           <span className={cn("font-black text-base", isTimeout && "animate-pulse")}>{formatTime(globalTimeLeft)}</span>
         </div>
      </div>
    </motion.div>
  );
}
