import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Crown, Search, ArrowLeft, MoreHorizontal, UserCheck, UserMinus, Activity, DollarSign, Copy, QrCode, Zap } from 'lucide-react';
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
    qris_image_url: '',
    app_name: '',
    app_logo_url: '',
    app_favicon_url: ''
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
        if (s.key === 'app_name') newSettings.app_name = s.value;
        if (s.key === 'app_logo_url') newSettings.app_logo_url = s.value;
        if (s.key === 'app_favicon_url') newSettings.app_favicon_url = s.value;
      });
      setSettings(newSettings);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      setSavingSettings(true);
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });
      
      if (error) throw error;
      
      console.log(`Setting ${key} saved successfully`);
    } catch (err) {
      console.error('Error saving setting:', err);
      alert('Gagal menyimpan ke database. Pastikan tabel system_settings sudah dibuat.');
    } finally {
      setSavingSettings(false);
      fetchSettings();
    }
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
      <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.05),transparent_70%)]" />
        <div className="relative text-center space-y-10 max-w-sm">
          <motion.div 
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="w-32 h-32 bg-red-500/10 rounded-[40px] flex items-center justify-center mx-auto border border-red-500/20 shadow-sm"
          >
             <Shield className="w-16 h-16 text-red-600 drop-shadow-sm" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]">System <span className="text-red-600">Locked</span></h1>
            <p className="text-[var(--color-pawtobooth-dark)]/60 text-sm italic font-medium leading-relaxed uppercase tracking-widest">Operator account does not have root privileges for this zone.</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-5 bg-[#3E6B43] text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-md"
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

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSavingSettings(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${settingKey}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      await saveSetting(settingKey, publicUrl);
      alert(`${settingKey} updated successfully!`);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Pastikan Anda sudah membuat bucket 'platform-assets' di Supabase.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] text-[var(--color-pawtobooth-dark)] font-sans selection:bg-[var(--color-pawtobooth-green)] selection:text-[var(--color-pawtobooth-beige)]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3E6B43]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3E6B43]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto p-8 space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
          <div className="flex items-center gap-6">
             <button 
               onClick={() => navigate('/')} 
               className="p-4 bg-white/5 border border-white/10 rounded-[24px] hover:bg-white/10 transition-all text-neutral-400 group"
             >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
             </button>
             <div className="space-y-1">
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                  Dev <span className="text-blue-600 italic">Console</span>
                </h1>
                <div className="flex items-center gap-2 text-neutral-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Management Active</p>
                </div>
             </div>
          </div>
          
          <div className="flex bg-[var(--color-pawtobooth-light)] p-1.5 rounded-[24px] border border-black/5 backdrop-blur-xl">
             <button 
               onClick={() => setActiveTab('operators')}
               className={cn(
                 "px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                 activeTab === 'operators' 
                  ? "bg-white text-[var(--color-pawtobooth-dark)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]" 
                  : "text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)]"
               )}
             >
               <div className="flex items-center gap-2">
                 <Users className="w-3.5 h-3.5" /> Operators
               </div>
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={cn(
                 "px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                 activeTab === 'settings' 
                  ? "bg-white text-[var(--color-pawtobooth-dark)] shadow-[0_10px_30px_rgba(0,0,0,0.05)]" 
                  : "text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)]"
               )}
             >
               <div className="flex items-center gap-2">
                 <Shield className="w-3.5 h-3.5" /> Platform Settings
               </div>
             </button>
          </div>
        </header>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Total Operators', value: stats.total, icon: Users, color: 'text-[var(--color-pawtobooth-dark)]/40' },
             { label: 'Premium Accounts', value: stats.premium, icon: Crown, color: 'text-blue-500' },
             { label: 'Estimated MRR', value: `Rp ${(stats.revenue / 1000).toLocaleString()}k`, icon: DollarSign, color: 'text-[#3E6B43]' }
           ].map((stat, i) => (
             <div key={i} className="p-8 rounded-[40px] bg-white border border-black/5 shadow-sm space-y-4 group hover:border-black/10 transition-colors">
                <div className="flex items-center justify-between">
                   <div className={cn("p-3 rounded-2xl bg-black/5", stat.color)}>
                     <stat.icon className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-black font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'operators' ? (
              <motion.div 
                key="operators"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="bg-white border border-black/5 rounded-[48px] overflow-hidden backdrop-blur-sm shadow-sm">
                  <div className="p-10 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight">Active Operator Database</h3>
                        <p className="text-xs text-[var(--color-pawtobooth-dark)]/60 font-medium italic">Manage and monitor all platform participants.</p>
                     </div>
                     <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-pawtobooth-dark)]/60" />
                        <input 
                          type="text" 
                          placeholder="Search name, email, or ID..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="bg-[var(--color-pawtobooth-light)] border border-black/5 rounded-[20px] pl-14 pr-8 py-4 text-sm focus:border-[#3E6B43] focus:bg-white outline-none transition-all w-full md:w-80 font-medium text-[var(--color-pawtobooth-dark)]"
                        />
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/60">
                          <th className="px-10 py-8">Operator Identity</th>
                          <th className="px-10 py-8">Activity Metrics</th>
                          <th className="px-10 py-8">Platform Status</th>
                          <th className="px-10 py-8">Account Date</th>
                          <th className="px-10 py-8">Management</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 text-sm font-medium">
                        {filteredProfiles.map((p) => (
                          <tr key={p.id} className="group hover:bg-black/[0.02] transition-colors">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 bg-black/5 rounded-[18px] border border-black/5 flex items-center justify-center font-black text-sm text-[var(--color-pawtobooth-dark)]/40 group-hover:bg-[#3E6B43]/10 group-hover:border-[#3E6B43]/20 group-hover:text-[#3E6B43] transition-all duration-500">
                                   {p.full_name?.[0] || '?'}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="font-black text-[var(--color-pawtobooth-dark)] text-base">{p.full_name || 'Unnamed Operator'}</p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(p.id); }}
                                      className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 font-mono hover:text-[#3E6B43] transition-colors flex items-center gap-2 group/id"
                                    >
                                      {p.id.slice(0, 12)}... <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-all" />
                                    </button>
                                 </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-6">
                                  <div className="text-center px-6 border-r border-black/5">
                                     <p className="text-[var(--color-pawtobooth-dark)] font-black text-lg">{p.eventCount}</p>
                                     <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest font-black">Events</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="text-[var(--color-pawtobooth-dark)] font-black text-lg">{p.sessionCount}</p>
                                     <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest font-black">Photos</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="space-y-2">
                                 <div className={cn(
                                   "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em]",
                                   p.subscription_tier === 'pro' 
                                    ? "bg-blue-600/10 text-blue-500 border border-blue-600/20 shadow-sm" 
                                    : "bg-black/5 text-[var(--color-pawtobooth-dark)]/60 border border-black/5"
                                 )}>
                                   {p.subscription_tier === 'pro' ? <Crown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                   {p.subscription_tier === 'pro' ? 'Professional' : 'Free Tier'}
                                 </div>
                                 {p.role === 'admin' && (
                                   <div className="flex items-center gap-2 text-blue-400">
                                      <Shield className="w-3 h-3" />
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">System Admin</span>
                                   </div>
                                 )}
                               </div>
                            </td>
                            <td className="px-10 py-8 text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase">
                              {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-3">
                                  {p.subscription_tier === 'free' ? (
                                    <button 
                                      onClick={() => updateUserTier(p.id, 'pro')} 
                                      className="px-5 py-2.5 bg-[#3E6B43] hover:bg-[var(--color-pawtobooth-dark)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    >
                                      Set Pro
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => updateUserTier(p.id, 'free')} 
                                      className="px-5 py-2.5 bg-black/5 text-[var(--color-pawtobooth-dark)]/60 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-all"
                                    >
                                      Revoke Pro
                                    </button>
                                  )}
                                  <div className="relative">
                                     <button 
                                       onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)}
                                       className={cn(
                                         "p-2.5 rounded-xl transition-all border",
                                         activeMenu === p.id 
                                          ? "bg-[#3E6B43] text-white border-[#3E6B43] shadow-md scale-110" 
                                          : "text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)] bg-black/5 border-black/5"
                                       )}
                                     >
                                        <MoreHorizontal className="w-5 h-5" />
                                     </button>

                                     <AnimatePresence>
                                       {activeMenu === p.id && (
                                         <motion.div 
                                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                           animate={{ opacity: 1, y: 0, scale: 1 }}
                                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                           className="absolute right-0 top-full mt-4 w-52 bg-white border border-black/5 rounded-[24px] shadow-lg z-50 overflow-hidden text-[var(--color-pawtobooth-dark)]"
                                         >
                                            <button 
                                              onClick={() => handleRoleToggle(p.id, p.role)} 
                                              className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-black/5 flex items-center gap-3 border-b border-black/5 transition-colors"
                                            >
                                               <Shield className="w-4 h-4 text-blue-500" /> {p.role === 'admin' ? 'Change to User' : 'Grant Admin'}
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteUser(p.id)} 
                                              className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 text-red-500 flex items-center gap-3 transition-colors"
                                            >
                                               <UserMinus className="w-4 h-4" /> Terminate User
                                            </button>
                                         </motion.div>
                                       )}
                                     </AnimatePresence>
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
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-4xl mx-auto space-y-12 pb-32"
              >
                 <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]">Platform <span className="text-[#3E6B43] italic underline decoration-[#3E6B43]/20">Configuration</span></h2>
                    <p className="text-[var(--color-pawtobooth-dark)]/60 font-medium italic text-lg max-w-xl mx-auto">Master controls for subscription fees, support channels, and payment assets.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-10">
                        {/* Branding Settings */}
                        <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                           <div className="flex items-center gap-4 text-[#3E6B43]">
                              <div className="w-10 h-10 bg-[#3E6B43]/10 rounded-2xl flex items-center justify-center">
                                <Crown className="w-5 h-5" />
                              </div>
                              <h4 className="text-sm font-black uppercase tracking-widest">Platform Branding</h4>
                           </div>
                           
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Application Name</label>
                              <input 
                                type="text" 
                                value={settings.app_name}
                                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                                onBlur={(e) => saveSetting('app_name', e.target.value)}
                                className="w-full bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl px-6 py-5 font-mono text-sm focus:border-[#3E6B43] outline-none transition-all text-[var(--color-pawtobooth-dark)] placeholder:text-black/30"
                                placeholder="e.g. Pawtobooth"
                              />
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Logo URL</label>
                                 <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={settings.app_logo_url}
                                      onChange={(e) => setSettings({ ...settings, app_logo_url: e.target.value })}
                                      onBlur={(e) => saveSetting('app_logo_url', e.target.value)}
                                      className="flex-1 w-full bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl px-4 py-3 font-mono text-xs focus:border-[#3E6B43] outline-none transition-all text-[var(--color-pawtobooth-dark)]"
                                      placeholder="https://..."
                                    />
                                    <label className="px-4 py-3 bg-[#3E6B43] text-white rounded-2xl cursor-pointer hover:bg-[#2B4C2F] transition-all flex items-center justify-center">
                                       <Activity className="w-4 h-4" />
                                       <input type="file" className="hidden" onChange={(e) => handleAssetUpload(e, 'app_logo_url')} accept="image/*" />
                                    </label>
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Favicon URL</label>
                                 <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={settings.app_favicon_url}
                                      onChange={(e) => setSettings({ ...settings, app_favicon_url: e.target.value })}
                                      onBlur={(e) => saveSetting('app_favicon_url', e.target.value)}
                                      className="flex-1 w-full bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl px-4 py-3 font-mono text-xs focus:border-[#3E6B43] outline-none transition-all text-[var(--color-pawtobooth-dark)]"
                                      placeholder="https://..."
                                    />
                                    <label className="px-4 py-3 bg-[#3E6B43] text-white rounded-2xl cursor-pointer hover:bg-[#2B4C2F] transition-all flex items-center justify-center">
                                       <Activity className="w-4 h-4" />
                                       <input type="file" className="hidden" onChange={(e) => handleAssetUpload(e, 'app_favicon_url')} accept="image/*" />
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>

                       <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                          <div className="flex items-center gap-4 text-blue-500">
                             <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                               <Users className="w-5 h-5" />
                             </div>
                             <h4 className="text-sm font-black uppercase tracking-widest">Support Access</h4>
                          </div>
                          
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Support WhatsApp Number</label>
                             <input 
                               type="text" 
                               value={settings.support_whatsapp}
                               onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                               onBlur={(e) => saveSetting('support_whatsapp', e.target.value)}
                               className="w-full bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl px-6 py-5 font-mono text-sm focus:border-blue-600 outline-none transition-all text-[var(--color-pawtobooth-dark)] placeholder:text-[var(--color-pawtobooth-dark)]/40 shadow-sm"
                               placeholder="e.g. 62812345678"
                             />
                             <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/60 italic font-medium">Customer redirect for manual payment confirmation.</p>
                          </div>
                       </div>

                       <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                          <div className="flex items-center gap-4 text-[#3E6B43]">
                             <div className="w-10 h-10 bg-[#3E6B43]/10 rounded-2xl flex items-center justify-center">
                               <DollarSign className="w-5 h-5" />
                             </div>
                             <h4 className="text-sm font-black uppercase tracking-widest">Pricing Model</h4>
                          </div>

                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">Subscription Price (IDR)</label>
                             <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-pawtobooth-dark)]/60 font-bold">IDR</span>
                                <input 
                                  type="number" 
                                  value={settings.subscription_price}
                                  onChange={(e) => setSettings({ ...settings, subscription_price: e.target.value })}
                                  onBlur={(e) => saveSetting('subscription_price', e.target.value)}
                                  className="w-full bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl pl-16 pr-6 py-5 font-mono text-sm focus:border-[#3E6B43] outline-none transition-all text-[var(--color-pawtobooth-dark)] shadow-sm"
                                />
                             </div>
                             <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/60 italic font-medium">Platform-wide monthly fee for Professional access.</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-10 rounded-[48px] border border-black/5 shadow-sm space-y-8 flex flex-col items-center text-center">
                       <div className="space-y-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-[var(--color-pawtobooth-dark)]">Payment Gateway Asset</h4>
                          <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 italic max-w-[200px]">Displayed to customers during the checkout process.</p>
                       </div>

                       <div className="relative group aspect-square w-full max-w-[280px] bg-[var(--color-pawtobooth-light)] border-2 border-black/10 rounded-[40px] overflow-hidden flex flex-col items-center justify-center p-8 gap-4 border-dashed hover:border-[#3E6B43]/50 transition-all shadow-sm">
                          {settings.qris_image_url ? (
                            <>
                              <img src={settings.qris_image_url} alt="QRIS" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 text-center p-8">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/60">Change QRIS Asset</p>
                                 <label className="px-8 py-3.5 bg-[#3E6B43] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md">
                                    Upload New File
                                    <input type="file" className="hidden" onChange={handleQRISUpload} accept="image/*" />
                                 </label>
                              </div>
                            </>
                          ) : (
                            <>
                               <div className="p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
                                  <QrCode className="w-10 h-10 text-[var(--color-pawtobooth-dark)]/40" />
                                </div>
                               <div className="space-y-4">
                                  <label className="px-8 py-3.5 bg-[#3E6B43] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm block">
                                     Select QRIS Image
                                     <input type="file" className="hidden" onChange={handleQRISUpload} accept="image/*" />
                                  </label>
                                  <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/60 font-medium uppercase tracking-[0.2em]">PNG or JPG • Max 2MB</p>
                               </div>
                            </>
                          )}
                          {savingSettings && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
                               <Zap className="w-10 h-10 animate-spin text-[#3E6B43]" />
                               <p className="text-[10px] font-black uppercase tracking-widest text-[#3E6B43]">Syncing to Cloud...</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Status Footer */}
                 <div className="p-10 bg-[#3E6B43] border border-black/5 rounded-[48px] flex flex-col md:flex-row md:items-center gap-8 justify-between shadow-md">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center text-white backdrop-blur-md shadow-inner">
                          <Activity className="w-8 h-8" />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none">Security Active</h4>
                          <p className="text-xs text-white/70 font-medium opacity-80 uppercase tracking-widest">Real-time database encryption & autosave enabled.</p>
                       </div>
                    </div>
                    <div className="px-8 py-4 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">System Verified</span>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
