import { useState, useEffect, useRef } from 'react';
import { Printer, Zap, Activity, CheckCircle2, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function PrintNode() {
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ printed: 0, pending: 0 });
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isListening) return;

    // Subscription for new print jobs
    const channel = supabase
      .channel('print_jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'print_queue' },
        (payload) => {
          handleIncomingJob(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isListening]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 50));
  };

  const handleIncomingJob = async (job: any) => {
    if (job.status !== 'queued') return;
    
    addLog(`Detected new job: ${job.id.substr(0, 8)}`, 'info');
    setStats(prev => ({ ...prev, pending: prev.pending + 1 }));

    // Prepare and Print
    try {
      await processPrint(job);
      
      // Update status in Supabase
      const { error } = await supabase
        .from('print_queue')
        .update({ status: 'completed' })
        .eq('id', job.id);

      if (error) throw error;

      addLog(`Job ${job.id.substr(0, 8)} printed and finalized`, 'success');
      setStats(prev => ({ printed: prev.printed + 1, pending: Math.max(0, prev.pending - 1) }));
    } catch (e) {
      addLog(`Failed to print ${job.id.substr(0, 8)}`, 'error');
      console.error(e);
    }
  };

  const processPrint = (job: any) => {
    return new Promise((resolve) => {
      if (!printFrameRef.current) return resolve(false);

      const frame = printFrameRef.current;
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return resolve(false);

      doc.body.innerHTML = `
        <style>
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: black; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
        <img src="${job.image_url}" />
      `;

      // Wait for image load
      const img = doc.querySelector('img');
      if (img) {
        img.onload = () => {
          frame.contentWindow?.print();
          // We assume print started. In some browsers we can't reliably detect "finished".
          setTimeout(() => resolve(true), 1000);
        };
        img.onerror = () => resolve(false);
      }
    });
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hidden Print Frame */}
      <iframe ref={printFrameRef} className="hidden" title="Print Engine" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Control Panel */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-neutral-900 border border-white/5 rounded-[40px] p-10 space-y-12">
              <div className="flex items-center justify-between">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Remote Print Node</h2>
                    <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest leading-none">Global Network Controller</p>
                 </div>
                 <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black hover:scale-105'}`}
                 >
                    {isListening ? (
                      <><Pause className="w-4 h-4" /> Stop Listener</>
                    ) : (
                      <><Play className="w-4 h-4" /> Start Listener</>
                    )}
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Jobs Completed</p>
                    <p className="text-5xl font-black">{stats.printed}</p>
                 </div>
                 <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-2">
                    <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">Active Queue</p>
                    <p className={`text-5xl font-black ${stats.pending > 0 ? 'text-yellow-500' : 'text-white'}`}>{stats.pending}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                       <Activity className="w-4 h-4" /> System Logs
                    </h3>
                    <button onClick={clearLogs} className="text-[10px] text-neutral-600 hover:text-white uppercase transition-colors">Clear</button>
                 </div>
                 <div className="h-64 bg-black/60 rounded-[32px] border border-white/5 p-6 font-mono text-[10px] overflow-y-auto space-y-2 scrollbar-none">
                    {logs.length === 0 && <p className="text-neutral-800 italic">Waiting for connection...</p>}
                    <AnimatePresence initial={false}>
                       {logs.map(log => (
                         <motion.div 
                           key={log.id} 
                           initial={{ opacity: 0, x: -10 }} 
                           animate={{ opacity: 1, x: 0 }}
                           className="flex gap-4 border-b border-white/5 pb-2"
                         >
                            <span className="text-neutral-600 shrink-0">[{log.time}]</span>
                            <span className={log.type === 'success' ? 'text-green-500' : log.type === 'error' ? 'text-red-500' : 'text-neutral-300'}>
                               {log.message}
                            </span>
                         </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>

        {/* Instructions/Status */}
        <div className="space-y-8 h-fit lg:sticky lg:top-24">
           <div className="p-8 bg-neutral-900 border border-white/5 rounded-[40px] space-y-8">
              <div className="flex items-center gap-4 text-yellow-500">
                 <AlertTriangle className="w-8 h-8" />
                 <h3 className="text-xl font-bold uppercase italic leading-none">Operator Checklist</h3>
              </div>
              <ul className="space-y-6 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1 shrink-0" />
                    <span>Run browser with <code>--kiosk-printing</code> flag for silent operation.</span>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1 shrink-0" />
                    <span>Ensure printer is set as "Default" in system settings.</span>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1 shrink-0" />
                    <span>Disable "Print Headers/Footers" in browser print dialog.</span>
                 </li>
                 <li className="flex items-start gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Avrina Realtime Link Active</span>
                 </li>
              </ul>
           </div>

           <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[40px] flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                 <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Node Strategy</p>
                 <p className="text-xs font-mono uppercase tracking-tighter text-blue-200/60 leading-tight">This node handles prints for ALL booths in your network simultaneously.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
