import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { EventConfig, Session, PrintJob } from '../types';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminStats } from './admin/AdminStats';
import { SessionGrid } from './admin/SessionGrid';
import { EventList } from './admin/EventList';
import { PrintQueue } from './admin/PrintQueue';
import { TemplateGrid } from './admin/TemplateGrid';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'templates' | 'prints'>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<EventConfig[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isBootstrapping, _setIsBootstrapping] = useState(false);

  // Data sync via polling (since we are not using Firebase onSnapshot anymore)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, eventRes, printRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/events"),
          fetch("/api/print-queue")
        ]);
        
        if (sessRes.ok) setSessions(await sessRes.json());
        if (eventRes.ok) setEvents(await eventRes.json());
        if (printRes.ok) setPrintJobs(await printRes.json());
      } catch (e) {
        console.error("Fetch data error", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = sessions
    .filter(s => s.paymentStatus === 'paid')
    .length * (events[0]?.pricing || 0);

  return (
    <div className="flex h-screen bg-black overflow-hidden text-white">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-950">
        <header className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-20">
          <div>
             <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Overview / {activeTab}</h2>
             <p className="text-lg font-bold">Manage your installation</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-full flex items-center gap-2 text-xs font-mono">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                SQLite Backend Active
             </div>
             <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <AdminStats 
                sessionCount={sessions.length}
                revenue={totalRevenue}
                queueCount={printJobs.filter(j => j.status === 'queued').length}
                eventCount={events.length}
              />
              <SessionGrid sessions={sessions} />
            </div>
          )}

          {activeTab === 'events' && <EventList events={events} />}

          {activeTab === 'prints' && <PrintQueue jobs={printJobs} />}

          {activeTab === 'templates' && <TemplateGrid />}
        </div>
      </main>
    </div>
  );
}
