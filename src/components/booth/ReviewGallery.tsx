import { motion } from 'motion/react';
import { RefreshCcw, Check } from 'lucide-react';

interface ReviewGalleryProps {
  photos: string[];
  onRetake: () => void;
  onFinalize: () => void;
}

export function ReviewGallery({ photos, onRetake, onFinalize }: ReviewGalleryProps) {
  return (
    <motion.div 
      key="review"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 w-full max-w-6xl px-8 space-y-12"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold uppercase tracking-tight">Review Photos</h2>
        <p className="text-neutral-400">Great shots! Ready to finalize or try again?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {photos.map((photo, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group">
            <img src={photo} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded font-mono text-[10px] uppercase tracking-tighter">
              Shot {i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={onRetake}
          className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all uppercase text-sm font-bold tracking-widest"
        >
          <RefreshCcw className="w-4 h-4" /> Retake
        </button>
        <button 
          onClick={onFinalize}
          className="flex items-center gap-2 bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Let's Go <Check className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
