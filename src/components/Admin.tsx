import { useState, useEffect } from 'react';
import { Settings, LogOut, Layout, BarChart, Printer, Calendar, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminStats } from './admin/AdminStats';
import { SessionGrid } from './admin/SessionGrid';
import { EventList } from './admin/EventList';
import { PrintQueue } from './admin/PrintQueue';
import { TemplateGrid } from './admin/TemplateGrid';
import { PrintNode } from './admin/PrintNode';
import { PremiumModal } from './admin/PremiumModal';
import { SubscriptionManager } from './admin/SubscriptionManager';
import { PaymentManager } from './admin/PaymentManager';
import { UserProfile } from './admin/UserProfile';

interface AdminProps {
  session: any;
}

export function Admin({ session }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'templates' | 'prints' | 'print_node' | 'payments' | 'subscription' | 'profile' | 'premium_locked'>('dashboard');
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = async () => {
    if (session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      
      // If user is free, they can't have many events/sessions anyway, 
      // but we fetch what's available.
      if (profileData?.subscription_tier === 'free') {
        // Optional: limit data fetch for free users
      }
    }

    try {
      // 1. Fetch Events owned by user
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);

        // 2. Fetch Sessions for these events
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);

        // 3. Fetch Print Queue for these sessions
        if (sessionsData && sessionsData.length > 0) {
             const sessionIds = sessionsData.map(s => s.id);
             const { data: printData, error: printError } = await supabase
               .from('print_queue')
               .select('*')
               .in('session_id', sessionIds)
               .order('created_at', { ascending: false });
             
             if (printError) throw printError;
             setPrintJobs(printData || []);
        }
      }
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for print queue and sessions
    const sub = supabase.channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'print_queue' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (activeTab === 'premium_locked') {
      setShowPremiumModal(true);
      setActiveTab('dashboard'); // Redirect back to dashboard after showing modal
    }
  }, [activeTab]);

  const totalRevenue = sessions
    .filter(s => s.payment_status === 'paid')
    .reduce((acc, s) => {
      const event = events.find(e => e.id === s.event_id);
      return acc + (event?.price || 0);
    }, 0);

  const handleLogout = () => supabase.auth.signOut();

  const isPremium = profile?.subscription_tier === 'pro';

  return (
    <div className="flex h-screen bg-black overflow-hidden text-white font-sans">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isPremium={isPremium}
      />

      <main className="flex-1 overflow-y-auto bg-neutral-950 pb-20">
        <header className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-20">
          <div>
             <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 mb-1">
               Managed Services / {activeTab}
             </h2>
             <p className="text-xl font-black uppercase tracking-tight italic">
               {(profile?.full_name || 'Admin')} • Avrina v1.0
             </p>
          </div>
          <div className="flex items-center gap-4">
             {isPremium && (
               <div className="px-4 py-2 bg-blue-600/10 border border-blue-600/30 rounded-full flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                 <Crown className="w-3 h-3 fill-current" /> Professional
               </div>
             )}
             <div className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-full flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                Network Online
             </div>
             <button 
               onClick={handleLogout}
               className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500 hover:text-white transition-all text-neutral-400"
               title="Sign Out"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {activeTab === 'profile' ? (
            <UserProfile 
              profile={profile}
              onUpdate={fetchData}
            />
          ) : activeTab === 'subscription' ? (
            <SubscriptionManager 
              currentTier={profile?.subscription_tier || 'free'} 
              userId={session?.user?.id}
              onUpdate={fetchData}
            />
          ) : loading ? (
             <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
             </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <AdminStats 
                    sessionCount={sessions.length}
                    revenue={totalRevenue}
                    queueCount={printJobs.filter(j => j.status === 'queued').length}
                    eventCount={events.length}
                  />
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Recent Sessions</h3>
                     </div>
                     <SessionGrid sessions={sessions} />
                  </div>
                </div>
              )}

              {activeTab === 'events' && <EventList userId={session?.user?.id || 'demo-user'} events={events} onUpdate={fetchData} />}

              {activeTab === 'prints' && <PrintQueue jobs={printJobs} onUpdate={fetchData} />}

              {activeTab === 'payments' && <PaymentManager />}

              {activeTab === 'templates' && <TemplateGrid />}

              {activeTab === 'print_node' && <PrintNode />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
