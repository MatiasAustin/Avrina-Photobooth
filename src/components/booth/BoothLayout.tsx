import { ReactNode } from 'react';

interface BoothLayoutProps {
  children: ReactNode;
}

export function BoothLayout({ children }: BoothLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background with blurry accents */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {children}
      
      {/* Kiosk Status Bar */}
      <div className="fixed bottom-0 inset-x-0 p-4 flex items-center justify-between pointer-events-none select-none">
         <div className="flex items-center gap-4 text-neutral-600 font-mono text-[10px] uppercase tracking-widest">
            <span>Power: OK</span>
            <span>Camera: 4K Active</span>
            <span>Local Sync: LIVE</span>
         </div>
         <div className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}
