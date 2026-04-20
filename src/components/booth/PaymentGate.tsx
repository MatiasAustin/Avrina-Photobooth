import { motion } from 'motion/react';
import { RefreshCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentGateProps {
  price: number;
  qrisData: string | null;
}

export function PaymentGate({ price, qrisData }: PaymentGateProps) {
  return (
    <motion.div 
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 bg-neutral-900 border border-white/10 p-8 rounded-3xl space-y-8 max-w-md w-full text-center shadow-2xl"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold uppercase tracking-tight">Scan to Pay</h2>
        <p className="text-neutral-400 text-sm">Please pay Rp {price.toLocaleString()} to start</p>
      </div>
      
      <div className="bg-white p-4 rounded-xl inline-block mx-auto">
        <QRCodeSVG value={qrisData || ''} size={256} level="H" />
      </div>

      <div className="flex items-center justify-center gap-2 text-neutral-500 font-mono text-xs uppercase animate-pulse">
        <RefreshCcw className="w-4 h-4 animate-spin-slow" />
        Waiting for payment...
      </div>
    </motion.div>
  );
}
