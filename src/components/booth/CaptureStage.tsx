import { RefObject } from 'react';
import { motion } from 'motion/react';
import { PhotoTemplate, BoothState } from '../../types';

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
  return (
    <motion.div 
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Captured Photo Overlay - Only in review_shot */}
        {state === 'review_shot' && lastCapturedPhoto && (
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-8 pointer-events-auto bg-[var(--color-pawtobooth-beige)]/80 backdrop-blur-md"
          >
             <div className="relative w-full max-w-2xl aspect-square">
                <img src={lastCapturedPhoto} className="w-full h-full object-cover rounded-[3rem] shadow-sm border-4 border-black/5" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent flex flex-col justify-end p-8 gap-6 rounded-2xl">
                   <div className="space-y-1">
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter text-[var(--color-pawtobooth-dark)]">Shot #{currentShot + 1} Captured!</h3>
                      {isTimeout ? (
                        <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest leading-none">Time's Up: Retake disabled</p>
                      ) : (
                        <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-sm uppercase tracking-widest leading-none">Review your pose or retake it</p>
                      )}
                   </div>
                   <div className="flex gap-4 text-[var(--color-pawtobooth-dark)]">
                      <button 
                        onClick={onRetake}
                        disabled={isTimeout}
                        className={`flex-1 py-5 backdrop-blur-xl border border-black/10 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all ${
                          isTimeout ? 'opacity-20 cursor-not-allowed bg-transparent' : 'bg-black/5 hover:bg-black/10'
                        }`}
                      >
                        Retake Shot
                      </button>
                      <button 
                        onClick={onNext}
                        className="flex-1 py-5 bg-[#3E6B43] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-pawtobooth-dark)] active:scale-[0.98] transition-all shadow-md"
                      >
                        {currentShot + 1 >= totalShots ? 'Finalize Session' : 'Next Photo'}
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {/* Template Overlay Preview - Lower opacity during live preview so user can see themselves */}
        {selectedTemplate && (
          <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 flex items-center justify-center ${state === 'review_shot' ? 'opacity-30' : 'opacity-40'}`}>
            <img src={selectedTemplate.image_url} className="w-full h-full object-cover mix-blend-screen" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {countdown > 0 && (
            <motion.span 
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[15rem] md:text-[20rem] font-bold text-[var(--color-pawtobooth-dark)] drop-shadow-lg z-30"
            >
              {countdown}
            </motion.span>
          )}
        </div>

        {/* 1:1 Safe Area Mask (Indicates the actual square crop) */}
        {state !== 'review_shot' && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            {/* Darkened Sides for Square crop (assuming screen is 16:9, we darken the sides to show a 1:1 square in the middle) */}
            <div className="absolute inset-y-0 left-0 w-[calc(50%-50vh)] bg-white/60 backdrop-blur-[2px] pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-[calc(50%-50vh)] bg-white/60 backdrop-blur-[2px] pointer-events-none" />
            
            {/* Center Area Border/Indicator */}
            <div className="h-full aspect-square border-2 border-white/60 relative flex flex-col items-center justify-start p-6">
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 shadow-sm" />
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 shadow-sm" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 shadow-sm" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 shadow-sm" />
               
               <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/80 tracking-[0.3em] uppercase bg-white/60 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">Square Safe Area</p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-full border border-black/5 flex items-center gap-8 text-sm font-mono uppercase tracking-widest z-30 shadow-md pointer-events-auto text-[var(--color-pawtobooth-dark)]">
           <div className="flex items-center gap-3">
             <span className="text-[var(--color-pawtobooth-dark)]/60">Status</span>
             <span className="font-bold">{currentShot + 1} / {totalShots}</span>
           </div>
           
           <div className="w-[1px] h-6 bg-black/10" />
           
           <div className={`flex items-center gap-3 ${isTimeout ? 'text-red-500' : ''}`}>
             <span className="text-[var(--color-pawtobooth-dark)]/60 italic">Time Left</span>
             <span className={`font-bold ${isTimeout ? 'animate-pulse' : ''}`}>{formatTime(globalTimeLeft)}</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
