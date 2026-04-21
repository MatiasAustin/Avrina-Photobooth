import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Crown, Search, ArrowLeft, MoreHorizontal, UserCheck, UserMinus, Activity, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { SUBSCRIPTION_PRICE } from '../../lib/constants';

export function DevDashboard({ session }: { session: any }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'operators' | 'settings'>('operators');
  
  // Platform Settings State
  const [settings, setSettings] = useState({
    support_whatsapp: '',
    subscription_price: '150000',
    qris_image_url: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

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

  const saveSetting = async (key: string, value: any) => {
    setSavingSettings(true);
    await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setSavingSettings(false);
    fetchSettings();
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (!error) fetchProfiles();
    setActiveMenu(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Hapus operator ini secara permanen? Seluruh data event dan fotonya akan ikut terhapus.")) return;
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (!error) fetchProfiles();
    setActiveMenu(null);
  };

  const checkAdmin = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchProfiles = async () => {
    setLoading(true);
    // Fetch profiles with a count of their events and sessions
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        events (
          id,
          sessions (count)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      const processedProfiles = data.map(p => {
        const eventCount = p.events?.length || 0;
        const sessionCount = p.events?.reduce((acc: number, curr: any) => {
          return acc + (curr.sessions?.[0]?.count || 0);
        }, 0) || 0;
        
        return {
          ...p,
          eventCount,
          sessionCount
        };
      });
      setProfiles(processedProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, [session]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchSettings();
    }
  }, [isAdmin]);

  const updateUserTier = async (userId: string, tier: 'free' | 'pro') => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);
    
    if (!error) fetchProfiles();
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        <div className="relative text-center space-y-10 max-w-sm">
          <motion.div 
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="w-32 h-32 bg-red-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
          >
             <Shield className="w-16 h-16 text-red-600 drop-shadow-2xl" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">System <span className="text-red-600">Locked</span></h1>
            <p className="text-neutral-500 text-sm italic font-medium leading-relaxed uppercase tracking-widest">Operator account does not have root privileges for this zone.</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            Return to Surface
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };
 Jonah

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search)
  );

  const stats = {
    total: profiles.length,
    premium: profiles.filter(p => p.subscription_tier === 'pro').length,
    revenue: profiles.filter(p => p.subscription_tier === 'pro').length * parseInt(settings.subscription_price)
  };

  const handleQRISUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSavingSettings(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `qris_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      await saveSetting('qris_image_url', publicUrl);
      alert("QRIS updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Pastikan Anda sudah membuat bucket 'platform-assets' di Supabase.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Sidebar / Navigation */}
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <button onClick={() => navigate('/')} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-neutral-400">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Dev <span className="text-blue-600">Console</span></h1>
                <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest mt-1">Platform Admin Management</p>
             </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
             <button 
               onClick={() => setActiveTab('operators')}
               className={cn(
                 "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === 'operators' ? "bg-white text-black shadow-xl" : "text-neutral-500 hover:text-white"
               )}
             >
               Operators
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={cn(
                 "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === 'settings' ? "bg-white text-black shadow-xl" : "text-neutral-500 hover:text-white"
               )}
             >
               Settings
             </button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <Users className="w-5 h-5 text-neutral-500" />
                 <span className="text-[10px] font-mono text-neutral-500">TOTAL OPERATORS</span>
              </div>
              <p className="text-4xl font-black">{stats.total}</p>
           </div>
           <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <Crown className="w-5 h-5 text-blue-500" />
                 <span className="text-[10px] font-mono text-neutral-500">PREMIUM SUBS</span>
              </div>
              <p className="text-4xl font-black">{stats.premium}</p>
           </div>
           <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <DollarSign className="w-5 h-5 text-green-500" />
                 <span className="text-[10px] font-mono text-neutral-500">MRR (ESTIMATED)</span>
              </div>
              <p className="text-4xl font-black">Rp {(stats.revenue / 1000).toLocaleString()}k</p>
           </div>
        </div>

        {/* User Table Card */}
        <div className="bg-neutral-900 rounded-[40px] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-lg font-black uppercase tracking-tight">Active Users</h3>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:border-blue-600 outline-none transition-all w-64"
                />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Operator Details</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Joined Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                <AnimatePresence mode="wait">
          {activeTab === 'operators' ? (
            <motion.div 
              key="operators"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-12"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <Users className="w-5 h-5 text-neutral-500" />
                       <span className="text-[10px] font-mono text-neutral-500 uppercase">Total Operators</span>
                    </div>
                    <p className="text-4xl font-black">{stats.total}</p>
                 </div>
                 <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <Crown className="w-5 h-5 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]" />
                       <span className="text-[10px] font-mono text-neutral-500 uppercase">Premium Subs</span>
                    </div>
                    <p className="text-4xl font-black">{stats.premium}</p>
                 </div>
                 <div className="p-8 rounded-[32px] bg-neutral-900 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <DollarSign className="w-5 h-5 text-green-500" />
                       <span className="text-[10px] font-mono text-neutral-500 uppercase">Estimated MRR</span>
                    </div>
                    <p className="text-4xl font-black">Rp {(stats.revenue / 1000).toLocaleString()}k</p>
                 </div>
              </div>

              {/* User Table Card */}
              <div className="bg-neutral-900 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <h3 className="text-lg font-black uppercase tracking-tight">Active Users</h3>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input 
                        type="text" 
                        placeholder="Search by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/50 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:border-blue-600 outline-none transition-all w-full md:w-64"
                      />
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                        <th className="px-8 py-6">Operator Details</th>
                        <th className="px-8 py-6">Usage Stats</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6">Joined Date</th>
                        <th className="px-8 py-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-medium">
                      {filteredProfiles.map((p) => (
                        <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black text-xs text-neutral-400">
                                 {p.full_name?.[0] || '?'}
                               </div>
                               <div>
                                  <p className="font-black text-white">{p.full_name || 'Unnamed Operator'}</p>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(p.id); }}
                                    className="text-[10px] text-neutral-500 font-mono hover:text-blue-500 transition-colors flex items-center gap-1.5 group"
                                  >
                                    {p.id.slice(0, 8)}... <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                  </button>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="text-center px-4 border-r border-white/5">
                                   <p className="text-white font-black">{p.eventCount}</p>
                                   <p className="text-[8px] text-neutral-500 uppercase tracking-tighter">Events</p>
                                </div>
                                <div className="text-center">
                                   <p className="text-white font-black">{p.sessionCount}</p>
                                   <p className="text-[8px] text-neutral-500 uppercase tracking-tighter">Photos</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className={cn(
                               "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                               p.subscription_tier === 'pro' 
                                ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" 
                                : "bg-white/5 text-neutral-500 border border-white/10"
                             )}>
                               {p.subscription_tier === 'pro' ? <Crown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                               {p.subscription_tier === 'pro' ? 'Professional' : 'Free Tier'}
                             </div>
                             {p.role === 'admin' && (
                               <div className="mt-1">
                                 <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">System Admin</span>
                               </div>
                             )}
                          </td>
                          <td className="px-8 py-6 text-neutral-500 font-mono text-xs uppercase">
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2 relative">
                                {p.subscription_tier === 'free' ? (
                                  <button onClick={(e) => { e.stopPropagation(); updateUserTier(p.id, 'pro'); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                    Set Pro
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); updateUserTier(p.id, 'free'); }} className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-600 transition-all">
                                    Reset Free
                                  </button>
                                )}
                                <div className="relative">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === p.id ? null : p.id); }}
                                     className={cn(
                                       "p-2 rounded-xl transition-all",
                                       activeMenu === p.id ? "bg-white text-black shadow-lg" : "text-neutral-600 hover:text-white bg-white/5"
                                     )}
                                   >
                                      <MoreHorizontal className="w-5 h-5" />
                                   </button>
                                   {activeMenu === p.id && (
                                     <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                        <button onClick={(e) => { e.stopPropagation(); handleRoleToggle(p.id, p.role); }} className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 flex items-center gap-3 border-b border-white/5">
                                           <Shield className="w-3 h-3 text-blue-500" /> {p.role === 'admin' ? 'Set as User' : 'Set as Admin'}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(p.id); }} className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 text-red-500 flex items-center gap-3">
                                           <UserMinus className="w-3 h-3" /> Delete Data
                                        </button>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl space-y-12 pb-20"
            >
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Platform <span className="text-neutral-500">Settings</span></h2>
                  <p className="text-neutral-500 font-medium italic">Konfigurasi operasional dan sistem pembayaran SaaS.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Support WhatsApp Number</label>
                        <input 
                          type="text" 
                          value={settings.support_whatsapp}
                          onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                          onBlur={(e) => saveSetting('support_whatsapp', e.target.value)}
                          className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-6 py-4 font-mono text-sm focus:border-blue-600 outline-none transition-all text-white"
                          placeholder="e.g. 62812345678"
                        />
                        <p className="text-[10px] text-neutral-600 italic">Format 62. Digunakan untuk instruksi pembayaran pelanggan.</p>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Subscription Price (IDR)</label>
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 font-black">Rp</span>
                           <input 
                             type="number" 
                             value={settings.subscription_price}
                             onChange={(e) => setSettings({ ...settings, subscription_price: e.target.value })}
                             onBlur={(e) => saveSetting('subscription_price', e.target.value)}
                             className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-14 pr-6 py-4 font-mono text-sm focus:border-blue-600 outline-none transition-all text-white"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">QRIS Payment Code Image</label>
                     <div className="relative group aspect-square bg-neutral-900 border-2 border-white/10 rounded-[32px] overflow-hidden flex flex-col items-center justify-center p-8 gap-4 border-dashed hover:border-blue-500/50 transition-all">
                        {settings.qris_image_url ? (
                          <>
                            <img src={settings.qris_image_url} alt="QRIS" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 text-center p-4">
                               <label className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                  Ganti Gambar QRIS
                                  <input type="file" className="hidden" onChange={handleQRISUpload} accept="image/*" />
                               </label>
                            </div>
                          </>
                        ) : (
                          <>
                             <div className="p-6 bg-white/5 rounded-3xl">
                                <QrCode className="w-8 h-8 text-neutral-500" />
                             </div>
                             <label className="text-[10px] text-blue-500 font-bold uppercase tracking-widest cursor-pointer hover:underline text-center">
                                Upload file QRIS<br/>(PNG/JPG)
                                <input type="file" className="hidden" onChange={handleQRISUpload} accept="image/*" />
                             </label>
                          </>
                        )}
                        {savingSettings && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Zap className="w-8 h-8 animate-spin text-blue-500" /></div>}
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-blue-600/5 border border-blue-600/20 rounded-[32px] flex flex-col md:flex-row md:items-center gap-6 justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                        <Activity className="w-6 h-6" />
                     </div>
                     <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-tight text-white">Cloud Autosave Active</h4>
                        <p className="text-[10px] text-neutral-500 font-medium">Perubahan disimpan otomatis ke database saat Anda selesai mengedit (onBlur).</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
