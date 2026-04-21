import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Crown, Shield, CreditCard, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubscriptionManagerProps {
  currentTier: 'free' | 'pro' | string;
  userId: string;
  onUpdate: () => void;
}

export function SubscriptionManager({ currentTier, userId, onUpdate }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', userId);

      if (error) throw error;
      onUpdate();
      alert("Successfully upgraded to Professional Access! Enjoy your unlimited features.");
    } catch (e) {
      console.error("Upgrade error", e);
      alert("Upgrade failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Plan Management</h3>
        <div className={currentTier === 'pro' ? 'text-blue-500' : 'text-neutral-500'}>
           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest">
              {currentTier === 'pro' ? <Crown className="w-3 h-3 fill-current" /> : <Shield className="w-3 h-3" />}
              {currentTier === 'pro' ? 'Professional Active' : 'Free Tier'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
         {/* Plan Comparison Card */}
         <div className="bg-neutral-900/50 border border-white/10 rounded-[40px] p-10 space-y-8 flex flex-col">
            <div className="space-y-2">
               <h4 className="text-2xl font-black uppercase tracking-tight">Your Current <span className="text-white/30">Privileges</span></h4>
               <p className="text-neutral-500 text-sm">Review what's available under your current agreement.</p>
            </div>
            
            <div className="space-y-4 flex-1">
               {[
                 { label: "Admin Dashboard Access", included: true },
                 { label: "Live Booth Demo", included: true },
                 { label: "Event Registrations", included: currentTier === 'pro' },
                 { label: "Custom Templates", included: currentTier === 'pro' },
                 { label: "Remote Print Node", included: currentTier === 'pro' },
                 { label: "Cloud Gallery Export", included: currentTier === 'pro' },
                 { label: "Priority API Support", included: currentTier === 'pro' }
               ].map((feat, i) => (
                 <div key={i} className={`flex items-center gap-3 text-xs font-bold uppercase tracking-tight ${feat.included ? 'text-white' : 'text-neutral-600'}`}>
                    <Check className={`w-4 h-4 ${feat.included ? 'text-blue-500' : 'text-neutral-800'}`} />
                    {feat.label}
                 </div>
               ))}
            </div>
         </div>

         {/* Action Card */}
         {currentTier !== 'pro' ? (
           <div className="bg-white text-black rounded-[40px] p-10 space-y-8 flex flex-col shadow-2xl">
              <div className="space-y-4">
                 <div className="inline-flex px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Limited Time Offer</div>
                 <h4 className="text-4xl font-black uppercase tracking-tighter leading-none">Switch to <br/><span className="italic text-blue-600">Professional</span></h4>
                 <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black">150k</span>
                    <span className="text-lg font-bold opacity-30">/bln</span>
                 </div>
              </div>

              <div className="space-y-6 flex-1">
                 <p className="text-sm font-medium leading-relaxed opacity-70">
                    Buka akses penuh ke ekosistem Avrina. Kelola event tanpa batas, kustomisasi template sesuka hati, dan monitor pendapatan real-time.
                 </p>
                 <div className="p-6 bg-black/[0.03] border border-black/5 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                       <CreditCard className="w-5 h-5 text-blue-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Instant Activation</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Zap className="w-5 h-5 text-blue-600 fill-current" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Cancel Anytime</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
              >
                 {loading ? 'Processing...' : 'Upgrade Now'} <ArrowRight className="w-4 h-4" />
              </button>
           </div>
         ) : (
           <div className="bg-neutral-800/20 border border-white/5 rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500">
                 <Crown className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-2xl font-black uppercase tracking-tight">You are <span className="text-blue-500 italic">Unlimited</span></h4>
                 <p className="text-neutral-500 text-sm max-w-[240px] mx-auto">Selamat! Akun Anda aktif dengan fitur Professional Access.</p>
              </div>
              <button disabled className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500">
                 Manage Billing (Coming Soon)
              </button>
           </div>
         )}
      </div>
    </div>
  );
}
