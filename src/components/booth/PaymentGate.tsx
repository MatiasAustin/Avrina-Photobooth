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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="z-10 w-full max-w-lg flex flex-col gap-6"
    >
      {/* Header — Price & Title */}
      <div className="text-center space-y-2">
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em]">Payment Required</p>
        <h2 className="text-6xl font-black uppercase tracking-tight italic">{formatted}</h2>
        <p className="text-neutral-400 font-mono text-xs">
          Bayar sekarang untuk memulai sesi foto Anda
        </p>
      </div>

      {/* Card */}
      <div className="bg-neutral-900/80 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">

        {/* Tab Toggle */}
        <div className="flex border-b border-white/5">
          {qrisImageUrl && (
            <button
              onClick={() => setActiveTab('qris')}
              className={cn(
                'flex-1 py-5 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-[0.2em] transition-all',
                activeTab === 'qris' ? 'text-white border-b-2 border-white' : 'text-neutral-600 hover:text-neutral-400'
              )}
            >
              <SmartphoneNfc className="w-4 h-4" /> QRIS
            </button>
          )}
          <button
            onClick={() => setActiveTab('cash')}
            className={cn(
              'flex-1 py-5 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-[0.2em] transition-all',
              activeTab === 'cash' ? 'text-white border-b-2 border-white' : 'text-neutral-600 hover:text-neutral-400'
            )}
          >
            <CircleDollarSign className="w-4 h-4" /> Tunai / Cash
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'qris' && qrisImageUrl && (
            <motion.div
              key="qris"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="p-8 space-y-6"
            >
              {/* Steps */}
              <div className="space-y-2">
                {[
                  `Buka aplikasi e-wallet atau m-banking Anda`,
                  `Scan QR Code di bawah ini`,
                  `Konfirmasi pembayaran sebesar ${formatted}`,
                  `Tunggu konfirmasi dari staff kami`,
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-[9px] font-black text-white flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-neutral-400 font-mono leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* QRIS Image */}
              <div className="relative group mx-auto w-fit">
                <div className="absolute -inset-3 bg-white/5 rounded-[28px] blur-xl group-hover:bg-white/10 transition-all duration-500" />
                <div className="relative bg-white p-5 rounded-[28px] shadow-2xl">
                  <img src={qrisImageUrl} alt="QRIS" className="w-52 h-52 object-contain" />
                </div>
              </div>

              <p className="text-center text-[9px] font-mono text-neutral-600 uppercase tracking-widest">
                Scan menggunakan GoPay · OVO · DANA · m-Banking
              </p>
            </motion.div>
          )}

          {activeTab === 'cash' && (
            <motion.div
              key="cash"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="p-8 space-y-6"
            >
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-neutral-400" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black uppercase italic">Bayar ke Staff</h3>
                  <p className="text-neutral-500 font-mono text-xs leading-relaxed">
                    Silakan bayar tunai sebesar <span className="text-white font-bold">{formatted}</span> langsung ke staff yang berjaga di dekat booth ini.
                  </p>
                </div>

                {/* Steps */}
                <div className="w-full space-y-2">
                  {[
                    `Siapkan uang tunai ${formatted}`,
                    `Berikan ke staff yang bertugas`,
                    `Staff akan mengkonfirmasi pembayaran Anda`,
                    `Booth akan otomatis terbuka setelah dikonfirmasi`,
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-[9px] font-black text-white flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-neutral-400 font-mono leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Waiting Notification Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4"
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <RefreshCcw className="w-5 h-5 text-white animate-spin" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-neutral-900" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wider">Menunggu Konfirmasi</p>
          <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
            Booth akan otomatis terbuka begitu staff mengkonfirmasi pembayaran Anda
          </p>
        </div>
      </motion.div>

      {/* Cancel Button */}
      {onCancel && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onCancel}
          className="w-full py-4 text-neutral-600 hover:text-neutral-400 font-mono text-[10px] uppercase tracking-widest transition-colors"
        >
          ← Batal & Kembali
        </motion.button>
      )}
    </motion.div>
  );
}
