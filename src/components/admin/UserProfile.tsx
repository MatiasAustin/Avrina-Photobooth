import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Shield, Crown, Save, ExternalLink, User, Lock, Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  profile: any;
  onUpdate: () => void;
}

export function UserProfile({ profile, onUpdate }: UserProfileProps) {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState(profile?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setShopName(profile.full_name);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: shopName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Store profile updated successfully!' });
      onUpdate();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', profile.id);

      if (error) throw error;
      setShowConfirmCancel(false);
      onUpdate();
      alert("Subscription cancelled. Your account has been reverted to the Free tier.");
    } catch (err) {
      alert("Failed to cancel subscription. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsProcessing(true);
    try {
      // Cascading delete should handle events/sessions if schema is correct
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;
      
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      alert("Failed to delete account. You may have active events that prevent deletion.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Store Settings</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-white">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-12">
          <form onSubmit={handleSave} className="bg-neutral-900/50 border border-white/5 rounded-[40px] p-10 space-y-8">
            <div className="space-y-6">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <User className="w-3 h-3" /> Nama Toko / Brand Name
                  </label>
                  <input 
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Contoh: Avrina Photostudio"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-lg"
                    required
                  />
                  <p className="text-[10px] text-neutral-600 font-medium">Nama ini akan muncul di header dashboard dan galeri publik Anda.</p>
               </div>

               <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Alamat Email Terdaftar
                  </label>
                  <div className="w-full bg-neutral-800/20 border border-white/5 text-neutral-500 rounded-2xl px-6 py-4 font-mono text-sm flex items-center justify-between">
                    {profile?.email || 'Not available'}
                    <Lock className="w-3 h-4 opacity-30" />
                  </div>
                  <p className="text-[10px] text-neutral-600 font-medium italic">Email tidak dapat diubah secara manual demi alasan keamanan.</p>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
               {message && (
                 <span className={cn(
                   "text-xs font-bold",
                   message.type === 'success' ? "text-green-500" : "text-red-500"
                 )}>
                   {message.text}
                 </span>
               )}
               <button 
                 type="submit"
                 disabled={isSaving || shopName === profile?.full_name}
                 className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
               >
                 <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
               </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="space-y-6">
             <div className="flex items-center gap-4 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-[0.2em]">Danger Zone</h4>
             </div>
             
             <div className="bg-red-500/5 border border-red-500/10 rounded-[40px] overflow-hidden divide-y divide-red-500/10">
                {profile?.subscription_tier === 'pro' && (
                  <div className="p-8 flex items-center justify-between group hover:bg-red-500/5 transition-all">
                    <div className="space-y-1">
                       <p className="font-black text-sm uppercase tracking-tight">Cancel Subscription</p>
                       <p className="text-xs text-neutral-500">Kembali ke paket Free. Anda akan kehilangan akses ke fitur premium.</p>
                    </div>
                    <button 
                      onClick={() => setShowConfirmCancel(true)}
                      className="px-6 py-3 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Batalkan Layanan
                    </button>
                  </div>
                )}

                <div className="p-8 flex items-center justify-between group hover:bg-red-500/5 transition-all">
                  <div className="space-y-1">
                     <p className="font-black text-sm uppercase tracking-tight">Delete Account</p>
                     <p className="text-xs text-neutral-500">Hapus seluruh data toko, event, dan sesi foto secara permanen.</p>
                  </div>
                  <button 
                    onClick={() => setShowConfirmDelete(true)}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-red-500/20"
                  >
                    Hapus Permanen
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className={cn(
             "rounded-[40px] p-8 border space-y-8",
             profile?.subscription_tier === 'pro' 
              ? "bg-blue-600/5 border-blue-600/20" 
              : "bg-black border-white/5"
           )}>
              <div className="flex items-center justify-between">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center",
                   profile?.subscription_tier === 'pro' ? "bg-blue-600 text-white" : "bg-white/5 text-neutral-500"
                 )}>
                   {profile?.subscription_tier === 'pro' ? <Crown className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                 </div>
                 <span className="text-[10px] font-mono text-neutral-500">STATUS AKUN</span>
              </div>

              <div className="space-y-2">
                 <h4 className="text-2xl font-black uppercase tracking-tighter">
                   {profile?.subscription_tier === 'pro' ? 'Professional' : 'Free Tier'}
                 </h4>
                 <p className="text-xs text-neutral-500 leading-relaxed">
                   {profile?.subscription_tier === 'pro' 
                    ? "Akses tak terbatas ke semua fitur Avrina aktif." 
                    : "Beberapa fitur premium terkunci. Tingkatkan untuk akses penuh."}
                 </p>
              </div>

              {profile?.subscription_tier !== 'pro' && (
                <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2">
                  Upgrade Sekarang <ExternalLink className="w-3 h-3" />
                </button>
              )}
           </div>

           <div className="bg-neutral-900 border border-white/5 rounded-[40px] p-8 space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Bantuan</h5>
              <p className="text-xs text-neutral-500 leading-relaxed">Butuh bantuan teknis atau ingin memindahkan akun ke email lain?</p>
              <a href="mailto:support@avrina.com" className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                 Hubungi Support <ExternalLink className="w-3 h-3" />
              </a>
           </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {(showConfirmCancel || showConfirmDelete) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900 border border-white/10 rounded-[40px] p-10 max-w-md w-full space-y-8 shadow-2xl"
            >
               <div className="flex items-center justify-between">
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <button onClick={() => { setShowConfirmCancel(false); setShowConfirmDelete(false); }} className="p-2 text-neutral-500 hover:text-white">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {showConfirmCancel ? 'Batalkan Langganan?' : 'Hapus Seluruh Data?'}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {showConfirmCancel 
                      ? 'Layanan Anda akan segera dihentikan dan fitur premium akan langsung terkunci. Anda yakin?' 
                      : 'Tindakan ini tidak bisa dibatalkan. Seluruh event, foto, dan profil toko Anda akan dihapus permanen dari sistem kami.'}
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setShowConfirmCancel(false); setShowConfirmDelete(false); }}
                    className="py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={showConfirmCancel ? handleCancelSubscription : handleDeleteAccount}
                    disabled={isProcessing}
                    className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    {isProcessing ? 'Memproses...' : 'Ya, Lanjutkan'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
