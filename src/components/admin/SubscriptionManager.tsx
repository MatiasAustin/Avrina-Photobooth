import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, Zap, ArrowRight, ShieldCheck, QrCode, MessageSquare, ArrowLeft, Copy, CreditCard, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { SUPPORT_WA_NUMBER, SUBSCRIPTION_PRICE, PLATFORM_NAME } from '../../lib/constants';

interface SubscriptionManagerProps {
  currentTier: string;
  userId: string;
  onUpdate: () => void;
}

export function SubscriptionManager({ currentTier, userId, onUpdate }: SubscriptionManagerProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [settings, setSettings] = useState({
    support_whatsapp: SUPPORT_WA_NUMBER,
    subscription_price: SUBSCRIPTION_PRICE.toString(),
    qris_image_url: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('system_settings').select('*');
      if (data) {
        const newSettings = { ...settings };
        data.forEach(s => {
          if (s.key === 'support_whatsapp') newSettings.support_whatsapp = s.value;
          if (s.key === 'subscription_price') newSettings.subscription_price = s.value;
          if (s.key === 'qris_image_url') newSettings.qris_image_url = s.value;
        });
        setSettings(newSettings);
      }
    };
    fetchSettings();
  }, []);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(settings.subscription_price);
    alert("Jumlah disalin!");
  };

  const displayPrice = parseInt(settings.subscription_price).toLocaleString('id-ID');
  const waMessage = encodeURIComponent(`Halo Admin ${PLATFORM_NAME}, saya ingin konfirmasi pembayaran untuk paket Pro.\n\nUser ID: ${userId}\nJumlah: Rp ${displayPrice}`);
  const waLink = `https://wa.me/${settings.support_whatsapp}?text=${waMessage}`;

  if (showPayment) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
        <button 
          onClick={() => setShowPayment(false)}
          className="flex items-center gap-2 text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)] transition-colors group text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Pilihan Paket
        </button>

        <div className="bg-white border border-black/5 rounded-[40px] p-10 space-y-10 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#3E6B43]/10 blur-[100px] pointer-events-none" />
           
           <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">Detail Pembayaran</h2>
              <p className="text-sm text-[var(--color-pawtobooth-dark)]/60 italic">Silakan selesaikan pembayaran untuk aktivasi Pro</p>
           </div>

           <div className="flex flex-col items-center gap-6">
              <div className="bg-[var(--color-pawtobooth-light)] p-6 rounded-[32px] shadow-sm border border-black/5 relative group">
                 <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    {settings.qris_image_url ? (
                      <img src={settings.qris_image_url} alt="QRIS Official" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[var(--color-pawtobooth-dark)]/40">
                        <QrCode className="w-16 h-16 opacity-20" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">QRIS Not Set</span>
                      </div>
                    )}
                 </div>
                 <div className="absolute -top-3 -right-3 bg-[#3E6B43] text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest shadow-xl border-2 border-white">
                    OFFICIAL QRIS
                 </div>
              </div>
              <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest">Pindai kode QR untuk membayar</p>
           </div>

           <div className="bg-[var(--color-pawtobooth-light)] rounded-3xl p-8 space-y-6 border border-black/5">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest">Total Pembayaran</span>
                 <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-[#3E6B43] font-mono">Rp {displayPrice}</span>
                    <button onClick={handleCopyAmount} className="p-2 hover:bg-black/5 rounded-lg transition-colors text-[var(--color-pawtobooth-dark)]/60">
                       <Copy className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              
              <div className="h-[1px] bg-black/5" />

              <div className="space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#3E6B43]/20 text-[#3E6B43] flex items-center justify-center flex-shrink-0 text-[10px] font-black">1</div>
                    <p className="text-xs text-[var(--color-pawtobooth-dark)]/80 leading-relaxed font-medium">Scan QRIS menggunakan aplikasi Dana/OVO/M-Banking/Gopay Anda.</p>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#3E6B43]/20 text-[#3E6B43] flex items-center justify-center flex-shrink-0 text-[10px] font-black">2</div>
                    <p className="text-xs text-[var(--color-pawtobooth-dark)]/80 leading-relaxed font-medium">Klik konfirmasi WhatsApp untuk mengirim bukti transfer ke Admin.</p>
                 </div>
              </div>
           </div>

           <a 
             href={waLink}
             target="_blank"
             rel="noopener noreferrer"
             className="w-full py-6 bg-[var(--color-pawtobooth-dark)] text-white rounded-[24px] font-black uppercase text-sm tracking-[0.2em] hover:bg-[#3E6B43] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md"
           >
             <MessageSquare className="w-5 h-5" /> Konfirmasi di WhatsApp
           </a>

           <p className="text-center text-[10px] text-[var(--color-pawtobooth-dark)]/40 italic font-medium leading-relaxed">
              Aktivasi manual dilakukan oleh tim dev dalam 5-15 menit <br/> setelah bukti transfer divalidasi.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)] italic">Upgrade <span className="text-[#3E6B43] underline decoration-black/10">Professional</span></h2>
        <p className="text-[var(--color-pawtobooth-dark)]/60 text-lg max-w-2xl mx-auto italic font-medium leading-relaxed">Tingkatkan kreativitas dan otomasi bisnis photobooth Anda ke level berikutnya.</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Starter Plan */}
        <div className="bg-white border border-black/5 rounded-[48px] p-10 flex flex-col justify-between transition-all hover:shadow-lg group shadow-sm">
           <div className="space-y-8">
              <div className="space-y-2">
                 <h3 className="text-lg font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Starter</h3>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black italic tracking-tighter text-[var(--color-pawtobooth-dark)]">Free</span>
                 </div>
              </div>
              <p className="text-[var(--color-pawtobooth-dark)]/80 text-sm leading-relaxed font-medium">Cocok untuk mencoba fitur dasar photobooth secara lokal.</p>
              <div className="space-y-4">
                 {['Unlimited Local Session', 'Digital Gallery Export', 'Basic Photo Editor'].map(f => (
                   <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-pawtobooth-light)] flex items-center justify-center border border-black/5">
                        <Check className="w-3 h-3 text-[var(--color-pawtobooth-dark)]/60" />
                      </div>
                      <span className="text-xs font-bold text-[var(--color-pawtobooth-dark)]">{f}</span>
                   </div>
                 ))}
              </div>
           </div>
           <button disabled className="mt-12 w-full py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)]/60 cursor-default border border-black/5">
              {currentTier !== 'pro' ? 'Current Plan' : 'Standard Access'}
           </button>
        </div>

        {/* Pro Plan */}
        <div className="relative bg-white border-2 border-[#3E6B43]/50 rounded-[48px] p-10 flex flex-col justify-between transition-all shadow-[0_0_100px_rgba(62,107,67,0.15)] scale-105 z-10">
           <div className="absolute top-8 right-8 px-4 py-1.5 bg-[#3E6B43] text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">Best Value</div>
           <div className="space-y-8">
              <div className="space-y-2">
                 <h3 className="text-lg font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Professional</h3>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black italic tracking-tighter text-[var(--color-pawtobooth-dark)]">{(parseInt(settings.subscription_price)/1000).toLocaleString('id-ID')}k</span>
                    <span className="text-[var(--color-pawtobooth-dark)]/60 font-bold">/bln</span>
                 </div>
              </div>
              <p className="text-[var(--color-pawtobooth-dark)]/80 text-sm leading-relaxed font-medium">Layanan penuh untuk bisnis photobooth profesional dan modern.</p>
              <div className="space-y-4">
                 {[
                   'Custom Overlays & Templates',
                   'Cloud QR Code System',
                   'Public Mini-Gallery Hosting',
                   'Print Management Node',
                   'Full Analytics Dashboard'
                 ].map(f => (
                   <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3E6B43] flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[var(--color-pawtobooth-dark)]">{f}</span>
                   </div>
                 ))}
              </div>
           </div>
           <button 
             onClick={() => setShowPayment(true)}
             disabled={currentTier === 'pro'}
             className={cn(
               "mt-12 w-full py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3",
               currentTier === 'pro' 
                 ? "bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)]/60 cursor-default border border-black/5"
                 : "bg-[var(--color-pawtobooth-dark)] text-white hover:bg-[#3E6B43] hover:scale-105 active:scale-95 shadow-lg"
             )}
           >
              {currentTier === 'pro' ? 'Professional Active' : 'Upgrade to Pro'} <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="max-w-2xl mx-auto bg-[var(--color-pawtobooth-light)] border border-black/5 rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-8 justify-between shadow-sm">
         <div className="flex gap-6 items-center">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5">
               <ShieldCheck className="w-7 h-7 text-[#3E6B43]" />
            </div>
            <div className="space-y-0.5">
               <h4 className="font-black text-sm uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">Verifikasi Developer Terpercaya</h4>
               <p className="text-xs text-[var(--color-pawtobooth-dark)]/60 leading-relaxed font-medium">Pembayaran Anda akan divalidasi langsung oleh tim dev kami via WhatsApp.</p>
            </div>
         </div>
         <div className="px-6 py-3 bg-white rounded-2xl border border-black/5 shadow-sm text-[10px] font-black uppercase tracking-widest text-[#3E6B43]">
            Secure Transaction
         </div>
      </div>
    </div>
  );
}
