import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, ArrowLeft, Share2, MessageCircle, Check, X, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PLATFORM_NAME } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface SessionSummaryProps {
  sessionId: string;
  eventName?: string;
  photoUrl: string;
  onPrint: () => void;
  onReset: () => void;
}

export function SessionSummary({ sessionId, eventName, photoUrl, onPrint, onReset }: SessionSummaryProps) {
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `photobooth-session-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitPhone = async () => {
    if (!phone || phone.length < 9) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ customer_phone: phone })
        .eq('id', sessionId);
      
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => {
        setShowPhoneInput(false);
        setIsSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to save number. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      key="summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-4xl px-8 space-y-12 mx-auto"
    >
      <div className="bg-white/90 backdrop-blur-xl border border-black/5 rounded-[50px] p-12 flex flex-col md:flex-row gap-12 items-center shadow-2xl text-[var(--color-pawtobooth-dark)] relative overflow-hidden">
        {/* Success Overlay */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#3E6B43] flex flex-col items-center justify-center text-white p-12 text-center"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Number Saved!</h3>
              <p className="opacity-80 mt-2 font-medium">The administrator can now send the link to your WhatsApp.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-10 text-center md:text-left z-10">
          <div className="space-y-4">
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Your Session <br/><span className="text-[#3E6B43]">is Ready</span></h2>
            <p className="text-[var(--color-pawtobooth-dark)]/60 font-medium max-w-md">Your professional photo strip has been generated and is ready for pickup.</p>
          </div>

          <div className="flex flex-col gap-4 max-w-sm mx-auto md:mx-0">
            {sessionId !== 'demo' && (
              <button 
                onClick={onPrint} 
                className="group relative flex items-center justify-center gap-3 bg-[#3E6B43] text-white px-10 py-5 rounded-[24px] font-black uppercase text-sm tracking-widest hover:bg-[var(--color-pawtobooth-dark)] active:scale-95 transition-all shadow-xl shadow-[#3E6B43]/20"
              >
                <Printer className="w-5 h-5 group-hover:animate-bounce" /> Print Photo Strip
              </button>
            )}
            
            <button 
              onClick={() => setShowPhoneInput(true)}
              className="flex items-center justify-center gap-3 bg-white border-2 border-black/5 px-10 py-5 rounded-[24px] text-[var(--color-pawtobooth-dark)] font-black uppercase text-sm tracking-widest hover:bg-black/5 active:scale-95 transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" /> Get Digital Copy
            </button>
          </div>

          {sessionId !== 'demo' && !showPhoneInput && (
            <div className="flex items-center gap-6 p-6 bg-[var(--color-pawtobooth-light)] rounded-[32px] border border-black/5 shadow-inner">
              <div className="bg-white p-3 rounded-2xl shrink-0 border border-black/5 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/gallery/${sessionId}`} size={80} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-tight text-[#3E6B43]">Instant Access</p>
                <p className="text-[11px] text-[var(--color-pawtobooth-dark)]/40 font-mono uppercase leading-tight font-bold">Scan to download your high-resolution photos instantly</p>
              </div>
            </div>
          )}

          {showPhoneInput && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 bg-[#25D366]/5 border-2 border-[#25D366]/20 rounded-[32px] space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-[#25D366] tracking-widest">Enter WhatsApp Number</h4>
                <button onClick={() => setShowPhoneInput(false)} className="text-black/20 hover:text-black"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                   <input 
                    type="tel" 
                    placeholder="0812345678..." 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl text-lg font-black focus:ring-2 ring-[#25D366]/20 outline-none"
                   />
                </div>
                <button 
                  disabled={phone.length < 9 || isSubmitting}
                  onClick={submitPhone}
                  className="px-6 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#25D366]/20 disabled:opacity-50"
                >
                  {isSubmitting ? "..." : "Send"}
                </button>
              </div>
              <p className="text-[9px] font-bold text-black/30 uppercase text-center">Your number will only be used to send your photos.</p>
            </motion.div>
          )}
        </div>

        <div className="w-full md:w-1/2 aspect-[4/6] bg-white rounded-[40px] overflow-hidden group shadow-2xl relative border-[12px] border-white shrink-0">
           <img src={photoUrl} alt="Session result" className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
           <div className="absolute top-4 right-4 bg-[#3E6B43] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Final Render
           </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={onReset}
          className="group flex items-center gap-3 text-[var(--color-pawtobooth-dark)]/40 hover:text-[#3E6B43] transition-all uppercase text-[10px] font-black tracking-[0.3em] bg-white/50 backdrop-blur px-8 py-3 rounded-full border border-black/5"
        >
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Done / Back to Home
        </button>
      </div>
    </motion.div>
  );
}
