import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, Clock, Wallet, Search, RefreshCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PaymentManager() {
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, events(name, price)')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSessions(data || []);
    } catch (e) {
      console.error("Error fetching pending payments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();

    // Set up real-time listener for new pending sessions
    const sub = supabase.channel('pending-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchPending)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const handleConfirm = async (sessionId: string) => {
    try {
      setConfirmingId(sessionId);
      const { error } = await supabase
        .from('sessions')
        .update({ payment_status: 'paid' })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (e) {
      console.error("Confirmation error", e);
      alert("Failed to confirm payment");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDismiss = async (sessionId: string) => {
    if (!confirm("Batalkan sesi ini? Session akan ditandai sebagai dibatalkan.")) return;
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ payment_status: 'cancelled' })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (e) {
      console.error("Dismiss error", e);
      alert("Failed to dismiss session");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic">Pending <span className="text-white/20">Payments</span></h2>
          <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mt-1">Confirm cash or QRIS payments to unlock booths</p>
        </div>
        
        <button 
          onClick={() => { setLoading(true); fetchPending(); }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-neutral-400 group"
        >
          <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {pendingSessions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/5 rounded-[40px] border border-dashed border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
             <Check className="w-8 h-8 text-neutral-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white/40 font-black uppercase tracking-widest text-sm">All Clear</h3>
            <p className="text-neutral-600 font-mono text-[10px] uppercase">No pending payments at the moment</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingSessions.map((session) => (
            <div 
              key={session.id}
              className="bg-neutral-900 border border-white/5 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                   <Wallet className="w-6 h-6 text-neutral-500" />
                </div>
                <div>
                   <h4 className="text-lg font-black uppercase tracking-tight italic">{session.events?.name || 'Unknown Booth'}</h4>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Amount:</span>
                      <span className="text-[10px] font-mono text-white uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">Rp {session.events?.price?.toLocaleString() || 0}</span>
                      <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(session.created_at).toLocaleTimeString()}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="text-right hidden md:block mr-4">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Session ID</p>
                    <p className="text-[10px] font-mono text-white/40 uppercase">{session.id.slice(0, 8)}...</p>
                 </div>
                 <button 
                   type="button"
                   onClick={() => handleDismiss(session.id)}
                   className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 text-neutral-500 transition-all"
                   title="Batalkan session ini"
                 >
                   <X className="w-4 h-4" />
                 </button>
                 <button 
                   disabled={confirmingId === session.id}
                   onClick={() => handleConfirm(session.id)}
                   className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50"
                 >
                   {confirmingId === session.id ? (
                     <RefreshCcw className="w-4 h-4 animate-spin" />
                   ) : (
                     <Check className="w-4 h-4 border-2 border-black rounded-full" />
                   )}
                   Confirm Paid
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
