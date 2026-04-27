import { motion } from 'motion/react';
import { PLATFORM_NAME } from '../../lib/constants';

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
      className="z-10 text-center space-y-12 bg-[var(--color-pawtobooth-beige)]/80 p-16 rounded-[4rem] backdrop-blur-md border border-black/5 shadow-2xl"
    >
      <div className="space-y-4" style={{ bottom: "40px", position: "relative", margin: "15%" }}>
        <h1 className="text-7xl md:text-8xl font-sans font-bold tracking-tighter text-[var(--color-pawtobooth-dark)] drop-shadow-sm">
          {PLATFORM_NAME.toUpperCase()} <span className="text-[#3E6B43] italic">v1.0</span>
        </h1>
        <p className="text-lg text-[var(--color-pawtobooth-dark)]/60 font-mono tracking-widest uppercase italic drop-shadow-sm">
          Freeze your moment
        </p>
      </div>

      <button
        onClick={onStart}
        className="group relative px-12 py-6 bg-[#3E6B43] text-white font-bold text-xl uppercase tracking-widest rounded-full hover:bg-[var(--color-pawtobooth-dark)] transition-colors shadow-lg"
      >
        <span className="relative z-10">Start Session</span>
        <div className="absolute inset-0 bg-[#3E6B43] blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full h-full w-full" />
      </button>
    </motion.div>
  );
}
