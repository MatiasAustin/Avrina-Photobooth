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
      className="z-[100] absolute inset-0 bg-[var(--color-pawtobooth-beige)]"
    >
      {/* Square Capture Container - Forced Absolute Centering */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vh] aspect-square max-w-[90vw] bg-black rounded-[2rem] shadow-2xl overflow-hidden border-[12px] border-white z-20">
        
        {/* Camera Area */}
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

        {/* Countdown */}
        <AnimatePresence>
          {countdown > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <div className="w-48 h-48 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/50">
                <span className="text-[8rem] font-black text-white italic drop-shadow-lg">
                  {countdown}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcement */}
        {isReview && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute inset-x-0 bottom-0 z-40 p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-2"
          >
             <h3 className="text-3xl font-black uppercase italic tracking-tight text-white">Shot Captured!</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <p className="text-white/60 font-mono text-[10px] uppercase tracking-[0.2em]">Next photo in 2s...</p>
             </div>
          </motion.div>
        )}
      </div>

      {/* Floating Status Bar - Forced Absolute Bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white px-10 py-5 rounded-full border border-black/5 flex items-center gap-12 text-xs font-mono uppercase tracking-widest z-[110] shadow-2xl text-[var(--color-pawtobooth-dark)]">
         <div className="flex items-center gap-4">
            <span className="text-[var(--color-pawtobooth-dark)]/40 font-black">Photo</span>
            <span className="font-black text-xl text-[#3E6B43]">{currentShot + 1} <span className="text-black/10">/</span> {totalShots}</span>
         </div>
         
         <div className="w-[1px] h-8 bg-black/5" />
         
         <div className={cn("flex items-center gap-4", isTimeout && "text-red-500")}>
            <span className="text-[var(--color-pawtobooth-dark)]/40 font-black italic">Session</span>
            <span className={cn("font-black text-xl", isTimeout && "animate-pulse")}>{formatTime(globalTimeLeft)}</span>
         </div>
      </div>
    </motion.div>
  );
}
