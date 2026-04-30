import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Download, Share2, Printer, CheckCircle2, XCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PLATFORM_NAME } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { downloadPhoto } from '../../lib/image-utils';

interface SessionSummaryProps {
  sessionId: string;
  eventName?: string;
  photoUrl: string;
  onPrint: () => void;
  onReset: () => void;
}

export function SessionSummary({ sessionId, eventName, photoUrl, onPrint, onReset }: SessionSummaryProps) {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'done'>('idle');

  const handleDownloadAction = () => {
    downloadPhoto(photoUrl, `pawtobooth-${sessionId}.jpg`);
  };

  const submitEmail = async () => {
    if (!email || !email.includes('@')) return;
    if (!sessionId || sessionId === 'demo') {
      setIsSuccess(true);
      setTimeout(() => {
        setShowEmailInput(false);
        setIsSuccess(false);
      }, 2000);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ customer_email: email })
        .eq('id', sessionId);
      
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => {
        setShowEmailInput(false);
        setIsSuccess(false);
      }, 2000);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to save email: ${e.message || 'Database error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintAction = () => {
    setPrintStatus('printing');
    onPrint();
    setTimeout(() => {
      setPrintStatus('done');
      setTimeout(() => setPrintStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <motion.div 
      key="summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 w-full max-w-4xl px-8 space-y-12 mx-auto pt-24 pb-20"
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
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Email Saved!</h3>
              <p className="opacity-80 mt-2 font-medium">Your photo will be sent to your inbox shortly.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-10 text-center md:text-left z-10">
          <div className="space-y-4">
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">Your Session <br/><span className="text-[#3E6B43]">is Ready</span></h2>
            <p className="text-[var(--color-pawtobooth-dark)]/60 font-medium max-w-md">Your professional photo strip has been generated and is ready for pickup.</p>
          </div>

          <div className="flex flex-col gap-4 max-w-sm mx-auto md:mx-0 w-full">
            <button 
              onClick={handlePrintAction}
              disabled={printStatus !== 'idle'}
              className={cn(
                "group relative flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-xl shadow-[#3E6B43]/20",
                printStatus === 'done' ? "bg-green-500 text-white" : "bg-[#3E6B43] text-white hover:bg-[var(--color-pawtobooth-dark)] active:scale-95"
              )}
            >
              {printStatus === 'printing' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : printStatus === 'done' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Printer className="w-5 h-5 group-hover:animate-bounce" />
              )}
              {printStatus === 'printing' ? "Printing..." : printStatus === 'done' ? "Added to Queue!" : "Print Photo Strip"}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setShowEmailInput(true)}
                 className="flex items-center justify-center gap-3 bg-white border-2 border-black/5 py-5 rounded-[24px] text-[var(--color-pawtobooth-dark)] font-black uppercase text-[10px] tracking-widest hover:bg-black/5 active:scale-95 transition-all shadow-lg"
               >
                 <Mail className="w-4 h-4 text-[#3E6B43]" /> Digital Copy
               </button>
               <button 
                 onClick={handleDownloadAction}
                 className="flex items-center justify-center gap-3 bg-white border-2 border-black/5 py-5 rounded-[24px] text-[var(--color-pawtobooth-dark)] font-black uppercase text-[10px] tracking-widest hover:bg-black/5 active:scale-95 transition-all shadow-lg"
               >
                 <Download className="w-4 h-4" /> Save Locally
               </button>
            </div>

            {sessionId !== 'demo' && (
              <div className="flex items-center gap-6 p-6 bg-[var(--color-pawtobooth-light)] rounded-[32px] border border-black/5 shadow-inner">
                <div className="bg-white p-3 rounded-2xl shrink-0 border border-black/5 shadow-sm">
                  <QRCodeSVG value={`${window.location.origin}/gallery/${sessionId}`} size={80} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-tight text-[#3E6B43]">Instant Access</p>
                  <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/40 font-mono uppercase leading-tight font-bold">Scan to download your high-res photos instantly</p>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showEmailInput && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
              >
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.9, opacity: 0 }}
                   className="w-full max-w-lg bg-white rounded-[40px] p-10 space-y-8 shadow-2xl"
                   onClick={e => e.stopPropagation()}
                 >
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black uppercase italic tracking-tight">Your <span className="text-[#3E6B43]">Photos</span></h3>
                      <button onClick={() => setShowEmailInput(false)} className="p-2 hover:bg-black/5 rounded-xl"><XCircle className="w-6 h-6 text-black/20" /></button>
                    </div>
                    
                    <div className="space-y-6">
                       <p className="text-sm text-black/40 font-bold uppercase tracking-widest">Enter your email for the digital copy</p>
                       <div className="relative">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                          <input 
                            autoFocus
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="yourname@example.com"
                            className="w-full pl-16 pr-6 py-5 bg-[var(--color-pawtobooth-light)] border-2 border-transparent focus:border-[#3E6B43]/20 rounded-3xl text-lg font-black outline-none transition-all placeholder:text-black/10"
                          />
                       </div>
                       <button 
                         onClick={submitEmail}
                         disabled={!email || isSubmitting}
                         className="w-full py-5 bg-[#3E6B43] text-white rounded-3xl font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#3E6B43]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                       >
                         {isSubmitting ? "Sending..." : "Send to My Email"}
                       </button>
                    </div>
                 </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
