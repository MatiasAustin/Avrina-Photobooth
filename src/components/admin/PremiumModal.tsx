import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[40px] overflow-hidden shadow-3xl"
          >
            {/* Header Decor */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
            
            <div className="p-10 pt-16 space-y-8 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                   <Crown className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black uppercase tracking-tight">Unlock Professional <br/><span className="text-blue-500 italic">Capabilities</span></h2>
                <p className="text-neutral-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Fitur ini hanya tersedia untuk pengguna Professional. Tingkatkan akun Anda untuk mengelola event tanpa batas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  "Unlimited Booth Registry",
                  "Custom Branding & White Label",
                  "QRIS Auto-Confirmation",
                  "Remote Print Management",
                  "Advanced Revenue Analytics",
                  "Priority Email Support"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight text-neutral-300">
                    <Check className="w-4 h-4 text-blue-500" /> {feat}
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-3"
                >
                  <Zap className="w-4 h-4 fill-current" /> Upgrade ke Pro - Rp 150k
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-neutral-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
