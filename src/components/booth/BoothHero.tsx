import { motion } from 'motion/react';

interface BoothHeroProps {
  onStart: () => void;
}

export function BoothHero({ onStart }: BoothHeroProps) {
  return (
    <motion.div 
      key="idle"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="z-10 text-center space-y-12"
    >
      <div className="space-y-4">
        <h1 className="text-7xl md:text-8xl font-sans font-bold tracking-tighter text-white">
          AVRINA <span className="text-white/20 italic">v1.0</span>
        </h1>
        <p className="text-lg text-neutral-400 font-mono tracking-widest uppercase italic">
          Freeze your moment
        </p>
      </div>
      
      <button 
        onClick={onStart}
        className="group relative px-12 py-6 bg-white text-black font-bold text-xl uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
      >
        <span className="relative z-10">Start Session</span>
        <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full h-full w-full" />
      </button>
    </motion.div>
  );
}
