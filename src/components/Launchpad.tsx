import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Globe, Power, Search, Clock, ArrowLeft, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

interface LaunchpadProps {
  session: any;
}

export function Launchpad({ session }: LaunchpadProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchActiveEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error) setEvents(data || []);
      setLoading(false);
    };

    fetchActiveEvents();
  }, [session.user.id]);

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3E6B43]/30 border-t-[#3E6B43] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] text-[var(--color-pawtobooth-dark)] font-sans selection:bg-[#3E6B43] selection:text-[var(--color-pawtobooth-beige)]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3E6B43]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3E6B43]/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 p-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-[var(--color-pawtobooth-light)] rounded-2xl border border-black/10 hover:bg-[#3E6B43] hover:text-white transition-all"
            >
               <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
               {settings.appLogoUrl && (
                 <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
               )}
               <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight italic">Station <span className="text-[#3E6B43]">Launchpad</span></h1>
                  <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest mt-1">{settings.appName} Network Control v1.0</p>
               </div>
            </div>
         </div>
         <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-pawtobooth-dark)]/40 group-focus-within:text-[var(--color-pawtobooth-dark)] transition-colors" />
            <input 
              type="text"
              placeholder="Search active booths..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[var(--color-pawtobooth-light)] border border-black/10 rounded-2xl py-3 pl-12 pr-6 w-64 focus:w-80 focus:border-[#3E6B43] transition-all outline-none text-sm font-mono text-[var(--color-pawtobooth-dark)] placeholder:text-[var(--color-pawtobooth-dark)]/40"
            />
         </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-8 pt-12">
         {filteredEvents.length === 0 ? (
           <div className="py-32 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-neutral-800">
                 <Power className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-3xl font-bold uppercase tracking-tight italic">No Active Booths</h2>
                 <p className="text-neutral-500 max-w-xs mx-auto text-sm">Please activate your booths in the main dashboard to see them here.</p>
              </div>
              <Link to="/dashboard" className="inline-block px-12 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:scale-105 transition-transform">
                Go to Dashboard
              </Link>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <AnimatePresence mode="popLayout">
                 {filteredEvents.map((event) => (
                   <motion.button
                     layout
                     key={event.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     onClick={() => window.open(`/booth/${event.slug}`, '_blank')}
                     className="group relative p-8 bg-white border border-black/5 rounded-[3rem] text-left hover:border-[#3E6B43] transition-all duration-500 hover:scale-[1.02] shadow-sm hover:shadow-xl"
                   >
                      <div className="space-y-8">
                         <div className="flex items-center justify-between">
                            <div className="p-4 bg-[var(--color-pawtobooth-light)] group-hover:bg-[#3E6B43]/10 rounded-2xl border border-black/5 group-hover:border-[#3E6B43]/20 transition-colors">
                               <Camera className="w-8 h-8 text-[#3E6B43]" />
                            </div>
                            <div className="px-3 py-1 bg-green-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                               Live
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none group-hover:tracking-normal transition-all">{event.name}</h3>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100">/{event.slug}</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4 pb-4">
                            <div className="space-y-1">
                               <p className="text-[8px] font-mono uppercase tracking-widest opacity-40">Capture Rate</p>
                               <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs font-bold">{event.timer}s Delay</span>
                               </div>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-mono uppercase tracking-widest opacity-40">Shot Count</p>
                               <div className="flex items-center gap-2">
                                  <Layout className="w-3 h-3" />
                                  <span className="text-xs font-bold">{event.shot_count} Photos</span>
                               </div>
                            </div>
                         </div>

                         <div className="w-full py-5 bg-[var(--color-pawtobooth-light)] group-hover:bg-[#3E6B43] group-hover:text-white border border-black/5 group-hover:border-transparent rounded-2xl flex items-center justify-center gap-3 transition-all">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Launch Projector</span>
                            <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                         </div>
                      </div>
                   </motion.button>
                 ))}
              </AnimatePresence>
           </div>
         )}
      </main>

      <footer className="fixed bottom-8 right-8 z-20">
         <div className="px-6 py-3 bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/60">{settings.appName} Network Link Active</p>
         </div>
      </footer>
    </div>
  );
}
