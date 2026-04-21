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
  onNext
}: CaptureStageProps) {
  return (
    <motion.div 
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 relative flex flex-col items-center gap-8"
    >
      <div className="relative rounded-[3rem] overflow-hidden border-[12px] border-neutral-900 shadow-[0_0_80px_rgba(0,0,0,0.5)] bg-black group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`z-0 w-full max-w-[80vw] h-auto aspect-video object-cover scale-x-[-1] transition-opacity duration-500 ${state === 'review_shot' ? 'opacity-30' : 'opacity-100'}`}
        />
        
        {/* Captured Photo Overlay - Only in review_shot */}
        {state === 'review_shot' && lastCapturedPhoto && (
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
          >
             <div className="relative w-full h-full">
                <img src={lastCapturedPhoto} className="w-full h-full object-cover rounded-2xl shadow-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8 gap-6 rounded-2xl">
                   <div className="space-y-1">
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Shot #{currentShot + 1} Captured!</h3>
                      <p className="text-white/60 font-mono text-sm uppercase tracking-widest leading-none">Review your pose or retake it</p>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={onRetake}
                        className="flex-1 py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all"
                      >
                        Retake Shot
                      </button>
                      <button 
                        onClick={onNext}
                        className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
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
          <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${state === 'review_shot' ? 'opacity-30' : 'opacity-40'}`}>
            <img src={selectedTemplate.image_url} className="w-full h-full object-cover mix-blend-screen" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {countdown > 0 && (
            <motion.span 
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[12rem] font-bold text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            >
              {countdown}
            </motion.span>
          )}
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-6 py-2 rounded-full border border-white/10 flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
           <span className="text-white/40">Capturing Photo</span>
           <span className="text-white">{currentShot + 1} / {totalShots}</span>
        </div>
      </div>
    </motion.div>
  );
}
