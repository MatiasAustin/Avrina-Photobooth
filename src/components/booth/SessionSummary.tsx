import { motion } from 'motion/react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PLATFORM_NAME } from '../../lib/constants';

interface SessionSummaryProps {
  sessionId: string;
  eventName?: string;
  photoUrl: string;
  onPrint: () => void;
  onReset: () => void;
}

export function SessionSummary({ sessionId, eventName, photoUrl, onPrint, onReset }: SessionSummaryProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `photobooth-session-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      key="summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-4xl px-8 space-y-12"
    >
      <div className="bg-white/90 backdrop-blur border border-black/5 rounded-[40px] p-12 flex flex-col md:flex-row gap-12 items-center shadow-sm text-[var(--color-pawtobooth-dark)]">
        <div className="flex-1 space-y-8 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-5xl font-bold tracking-tighter uppercase leading-none">Your Session <br/><span className="text-[#3E6B43]">is Ready</span></h2>
            <p className="text-[var(--color-pawtobooth-dark)]/80">Download your photos and {sessionId !== 'demo' ? 'join the print queue.' : 'save it to your device.'}</p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {sessionId !== 'demo' && (
              <button onClick={onPrint} className="flex items-center gap-2 bg-[#3E6B43] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-[var(--color-pawtobooth-dark)] hover:-translate-y-0.5 transition-all shadow-sm">
                <Printer className="w-4 h-4" /> Print Photo
              </button>
            )}
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white border border-black/20 px-8 py-3 rounded-full text-[var(--color-pawtobooth-dark)] font-bold uppercase text-xs tracking-widest hover:bg-black/5 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Save Local
            </button>
          </div>

          {sessionId !== 'demo' && (
            <div className="flex items-center gap-4 p-4 bg-[var(--color-pawtobooth-light)] rounded-2xl border border-black/5">
              <div className="bg-white p-2 rounded-lg shrink-0 border border-black/5">
                <QRCodeSVG value={`${window.location.origin}/gallery/${sessionId}`} size={64} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#3E6B43]">Instant Access</p>
                <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 font-mono uppercase tracking-tighter">Scan to download your photos from the {PLATFORM_NAME} Cloud</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 aspect-[4/6] bg-white rounded-[32px] overflow-hidden group shadow-2xl relative border-8 border-white">
           <img src={photoUrl} alt="Session result" className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>
      </div>

      <button 
        onClick={onReset}
        className="mx-auto flex items-center gap-2 text-[var(--color-pawtobooth-dark)]/60 hover:text-[#3E6B43] transition-colors uppercase text-xs font-bold tracking-[0.2em]"
      >
         <ArrowLeft className="w-4 h-4" /> Done / Back to Home
      </button>
    </motion.div>
  );
}
