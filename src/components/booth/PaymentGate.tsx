import { motion } from 'motion/react';
import { RefreshCcw, Wallet, QrCode } from 'lucide-react';

interface PaymentGateProps {
  price: number;
  qrisImageUrl?: string;
}

export function PaymentGate({ price, qrisImageUrl }: PaymentGateProps) {
  return (
    <motion.div 
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 bg-neutral-900/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] space-y-10 max-w-lg w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.5)] border-t-white/20"
    >
      <div className="space-y-3">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
           <QrCode className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tight italic">Scan <span className="text-white/20">To Pay</span></h2>
        <p className="text-neutral-400 font-mono text-[10px] uppercase tracking-[0.2em]">Transaction Amount: <span className="text-white">Rp {price.toLocaleString()}</span></p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-4 bg-white/5 rounded-[32px] blur-2xl group-hover:bg-white/10 transition-all duration-500" />
        <div className="relative bg-white p-6 rounded-[32px] shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
          {qrisImageUrl ? (
            <img src={qrisImageUrl} alt="QRIS" className="w-full h-full object-contain" />
          ) : (
            <div className="text-black/20 font-black text-xl italic uppercase text-center p-8 border-4 border-dashed border-black/10 rounded-2xl">
              QRIS Image Not Configured
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex flex-col gap-3 p-6 bg-white/5 rounded-3xl border border-white/5">
           <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
              <Wallet className="w-4 h-4" /> Pay with Cash
           </div>
           <p className="text-[10px] font-mono text-neutral-500 uppercase leading-relaxed">
             Please pay the staff directly. Once verified, your session will start automatically.
           </p>
        </div>

        <div className="flex items-center justify-center gap-3 py-4 text-white font-mono text-[10px] uppercase tracking-[0.3em] font-black">
          <RefreshCcw className="w-4 h-4 animate-spin text-white/50" />
          <span className="animate-pulse">Waiting for Payment Confirmation...</span>
        </div>
      </div>
    </motion.div>
  );
}
