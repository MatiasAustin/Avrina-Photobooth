import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Wallet, QrCode, CheckCircle2, SmartphoneNfc, CircleDollarSign } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface PaymentGateProps {
  price: number;
  qrisImageUrl?: string;
  onCancel?: () => void;
}

export function PaymentGate({ price, qrisImageUrl, onCancel }: PaymentGateProps) {
  const [activeTab, setActiveTab] = useState<'qris' | 'cash'>(qrisImageUrl ? 'qris' : 'cash');

  const formatted = `Rp ${price.toLocaleString('id-ID')}`;

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="z-50 w-full max-w-sm flex flex-col gap-3"
    >
      {/* Card */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[32px] overflow-hidden shadow-2xl text-[var(--color-pawtobooth-dark)]">
        
        {/* Compact Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
           <div className="space-y-0.5">
             <p className="text-[8px] font-black uppercase tracking-widest text-[#3E6B43]">Payment Required</p>
             <h2 className="text-3xl font-black uppercase tracking-tighter italic">{formatted}</h2>
           </div>
           
           <div className="flex bg-[var(--color-pawtobooth-light)] p-1 rounded-full border border-black/5">
              {qrisImageUrl && (
                <button
                  onClick={() => setActiveTab('qris')}
                  className={cn(
                    'px-4 py-1.5 rounded-full font-black uppercase text-[8px] tracking-widest transition-all',
                    activeTab === 'qris' ? 'bg-[#3E6B43] text-white' : 'text-[var(--color-pawtobooth-dark)]/40'
                  )}
                >
                  QRIS
                </button>
              )}
              <button
                onClick={() => setActiveTab('cash')}
                className={cn(
                  'px-4 py-1.5 rounded-full font-black uppercase text-[8px] tracking-widest transition-all',
                  activeTab === 'cash' ? 'bg-[#3E6B43] text-white' : 'text-[var(--color-pawtobooth-dark)]/40'
                )}
              >
                CASH
              </button>
           </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'qris' && qrisImageUrl && (
            <motion.div
              key="qris"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 pt-2 flex items-center gap-6"
            >
              <div className="relative group shrink-0">
                <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-black/5">
                  <img src={qrisImageUrl} alt="QRIS" className="w-32 h-32 object-contain" />
                </div>
              </div>

              <div className="space-y-3">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-tight">How to pay:</p>
                    <p className="text-[9px] font-mono text-[var(--color-pawtobooth-dark)]/60 leading-tight">1. Scan QR Code <br/> 2. Pay {formatted} <br/> 3. Wait for confirmation</p>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-2 bg-[#3E6B43]/5 rounded-xl border border-[#3E6B43]/10">
                    <RefreshCcw className="w-3 h-3 text-[#3E6B43] animate-spin" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#3E6B43]">Syncing...</span>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cash' && (
            <motion.div
              key="cash"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 py-10 flex flex-col items-center text-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-pawtobooth-light)] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#3E6B43]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase italic">Bayar ke Staff</h3>
                <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] max-w-[200px]">
                  Silakan berikan tunai <span className="text-[#3E6B43] font-bold">{formatted}</span> ke staff booth.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cancel Button - Subtle */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mx-auto px-6 py-2 bg-black/5 hover:bg-black/10 backdrop-blur-md rounded-full text-[var(--color-pawtobooth-dark)]/40 hover:text-[var(--color-pawtobooth-dark)] font-black text-[8px] uppercase tracking-[0.2em] transition-all"
        >
          ← Cancel Session
        </button>
      )}
    </motion.div>
  );
}
