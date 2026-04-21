import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shield, Crown, Search, ArrowLeft, MoreHorizontal, UserCheck, UserMinus, Activity, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export function DevDashboard({ session }: { session: any }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, [session]);

  useEffect(() => {
    if (isAdmin) fetchProfiles();
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
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
             <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Access Forbidden</h1>
          <p className="text-neutral-500 max-w-sm mx-auto">Hanya system admin yang diizinkan mengakses panel ini.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-full">Return Home</button>
        </div>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search)
  );

  const stats = {
    total: profiles.length,
    premium: profiles.filter(p => p.subscription_tier === 'pro').length,
    revenue: profiles.filter(p => p.subscription_tier === 'pro').length * 150000
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Sidebar / Navigation */}
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <button onClick={() => navigate('/')} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-neutral-400">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Dev <span className="text-blue-600">Console</span></h1>
                <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest mt-1">Subscriber Management v1.0</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest">
               <Shield className="w-3 h-3 fill-current" /> System Root Access
             </div>
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
                <AnimatePresence mode="popLayout">
                  {filteredProfiles.map((p) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black text-xs text-neutral-400">
                             {p.full_name?.[0] || '?'}
                           </div>
                           <div>
                              <p className="font-black text-white">{p.full_name || 'Unnamed Operator'}</p>
                              <p className="text-[10px] text-neutral-400 font-mono lower-case">{p.email || 'no-email@registered'}</p>
                              <p className="text-[10px] text-neutral-600 font-mono mt-0.5">{p.id.slice(0, 8)}...</p>
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
                      </td>
                      <td className="px-8 py-6 text-neutral-500 font-mono text-xs uppercase">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            {p.subscription_tier === 'free' ? (
                              <button 
                                onClick={() => updateUserTier(p.id, 'pro')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                              >
                                <UserCheck className="w-3 h-3" /> Set Pro
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateUserTier(p.id, 'free')}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                              >
                                <UserMinus className="w-3 h-3" /> Downgrade
                              </button>
                            )}
                            <button className="p-2 text-neutral-600 hover:text-white">
                               <MoreHorizontal className="w-5 h-5" />
                            </button>
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
