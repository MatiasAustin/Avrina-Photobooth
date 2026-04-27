import { motion } from 'motion/react';
import { PLATFORM_NAME } from '../../lib/constants';

interface BoothHeroProps {
  onStart: () => void;
}

export function BoothHero({ onStart }: BoothHeroProps) {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="z-10 text-center bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-white/40 shadow-2xl flex flex-col gap-6"
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-sans font-black tracking-tighter text-[var(--color-pawtobooth-dark)] uppercase">
          {PLATFORM_NAME} <span className="text-[#3E6B43] italic">v1.0</span>
        </h1>
        <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 font-mono tracking-widest uppercase italic">
          Freeze your moment
        </p>
      </div>

      <button
        onClick={onStart}
        className="group relative px-10 py-4 bg-[#3E6B43] text-white font-bold text-sm uppercase tracking-widest rounded-full hover:bg-[var(--color-pawtobooth-dark)] transition-colors shadow-lg"
      >
        <span className="relative z-10">Start Session</span>
        <div className="absolute inset-0 bg-[#3E6B43] blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full h-full w-full" />
      </button>
    </motion.div>
  );
}
