import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface BoothLayoutProps {
  children: ReactNode;
}

// Extend types for webkit/iOS fullscreen API
declare global {
  interface Document {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
  }
  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

export function BoothLayout({ children }: BoothLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch/mobile device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    const handleChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (!fsEl) {
        // Enter fullscreen
        const el = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen not supported:', e);
    }
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background with blurry accents */}
      <div className="absolute inset-0 z-0 bg-[var(--color-pawtobooth-beige)]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3E6B43]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3E6B43]/10 rounded-full blur-[120px]" />
      </div>

      {children}

      {/* Fullscreen Button — only on touch/mobile devices */}
      {isTouchDevice && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-[9999] flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-black/10 text-[var(--color-pawtobooth-dark)] px-3 py-2 rounded-full shadow-lg transition-all hover:bg-white active:scale-95 select-none"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen
            ? <Minimize2 className="w-4 h-4 text-[#3E6B43]" />
            : <Maximize2 className="w-4 h-4 text-[#3E6B43]" />
          }
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </span>
        </button>
      )}

      {/* Kiosk Status Bar */}
      <div className="fixed bottom-0 inset-x-0 p-4 flex items-center justify-between pointer-events-none select-none text-[var(--color-pawtobooth-dark)]">
         <div className="flex items-center gap-4 text-[var(--color-pawtobooth-dark)]/40 font-mono text-[10px] uppercase tracking-widest">
            <span>Power: OK</span>
            <span>Camera: 4K Active</span>
            <span>Local Sync: LIVE</span>
         </div>
         <div className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] uppercase tracking-widest">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}
