import { useState, useEffect, useRef } from 'react';
import { Printer, Zap, Activity, CheckCircle2, AlertTriangle, Play, Pause, RefreshCw, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

export function PrintNode() {
  const { settings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ printed: 0, pending: 0 });
  const [printers, setPrinters] = useState([
    { id: '1', name: 'System Default Printer', type: 'usb', status: 'connected', health: 100 },
    { id: '2', name: 'DNP DS620 (Office)', type: 'wifi', ip: '192.168.1.102', status: 'warning', health: 45 },
    { id: '3', name: 'Canon SELPHY (Warehouse)', type: 'wifi', ip: '192.168.1.105', status: 'offline', health: 0 }
  ]);
  const [activePrinterId, setActivePrinterId] = useState('1');
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
           <div className="bg-white border border-black/5 rounded-[40px] p-10 space-y-12 shadow-sm">
              <div className="flex items-center justify-between">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-bold uppercase italic tracking-tighter text-[var(--color-pawtobooth-dark)]">Remote Print Node</h2>
                    <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] uppercase tracking-widest leading-none">Global Network Controller</p>
                 </div>
                 <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-md ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--color-pawtobooth-dark)] text-[var(--color-pawtobooth-beige)] hover:bg-[#3E6B43] hover:-translate-y-0.5'}`}
                 >
                    {isListening ? (
                      <><Pause className="w-4 h-4" /> Stop Listener</>
                    ) : (
                      <><Play className="w-4 h-4" /> Start Listener</>
                    )}
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="p-8 bg-[var(--color-pawtobooth-light)] rounded-3xl border border-black/5 space-y-2 shadow-sm">
                    <p className="text-[var(--color-pawtobooth-dark)]/60 text-[10px] font-mono uppercase tracking-widest">Jobs Completed</p>
                    <p className="text-5xl font-black text-[var(--color-pawtobooth-dark)]">{stats.printed}</p>
                 </div>
                 <div className="p-8 bg-[var(--color-pawtobooth-light)] rounded-3xl border border-black/5 space-y-2 shadow-sm">
                    <p className="text-[var(--color-pawtobooth-dark)]/60 text-[10px] font-mono uppercase tracking-widest">Active Queue</p>
                    <p className={`text-5xl font-black ${stats.pending > 0 ? 'text-yellow-500' : 'text-[var(--color-pawtobooth-dark)]'}`}>{stats.pending}</p>
                 </div>
              </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/80 flex items-center gap-2">
                        <Printer className="w-4 h-4 text-[#3E6B43]" /> Active Printers
                     </h3>
                     <button className="text-[10px] text-[#3E6B43] font-bold uppercase hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Refresh Network
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {printers.map(p => (
                       <button 
                         key={p.id}
                         onClick={() => setActivePrinterId(p.id)}
                         className={cn(
                           "p-4 rounded-3xl border text-left transition-all relative overflow-hidden",
                           activePrinterId === p.id ? "bg-[#3E6B43] border-[#3E6B43] text-white shadow-lg" : "bg-white border-black/5 text-[var(--color-pawtobooth-dark)] hover:bg-black/5"
                         )}
                       >
                          <div className="flex items-center justify-between mb-2">
                             <div className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-green-400' : p.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                             <span className="text-[8px] font-mono uppercase opacity-40">{p.type}</span>
                          </div>
                          <p className="text-[10px] font-black uppercase truncate">{p.name}</p>
                          <p className="text-[8px] font-mono opacity-60 truncate">{p.ip || 'Local USB'}</p>
                          
                          {activePrinterId === p.id && (
                            <div className="absolute bottom-0 left-0 h-1 bg-white/30" style={{ width: `${p.health}%` }} />
                          )}
                       </button>
                     ))}
                  </div>
               </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/80 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-[#3E6B43]" /> System Logs
                    </h3>
                    <button onClick={clearLogs} className="text-[10px] text-[var(--color-pawtobooth-dark)]/40 hover:text-[var(--color-pawtobooth-dark)] uppercase transition-colors font-bold">Clear</button>
                 </div>
                 <div className="h-64 bg-[var(--color-pawtobooth-light)]/50 rounded-[32px] border border-black/5 p-6 font-mono text-[10px] overflow-y-auto space-y-2 scrollbar-none shadow-inner">
                    {logs.length === 0 && <p className="text-[var(--color-pawtobooth-dark)]/40 italic">Waiting for connection...</p>}
                    <AnimatePresence initial={false}>
                       {logs.map(log => (
                         <motion.div 
                           key={log.id} 
                           initial={{ opacity: 0, x: -10 }} 
                           animate={{ opacity: 1, x: 0 }}
                           className="flex gap-4 border-b border-black/5 pb-2"
                         >
                            <span className="text-[var(--color-pawtobooth-dark)]/40 shrink-0">[{log.time}]</span>
                            <span className={log.type === 'success' ? 'text-[#3E6B43] font-bold' : log.type === 'error' ? 'text-red-500 font-bold' : 'text-[var(--color-pawtobooth-dark)]/80'}>
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
            <div className="p-8 bg-white border border-black/5 shadow-sm rounded-[40px] space-y-6">
               <div className="flex items-center gap-4 text-[#3E6B43]">
                  <Settings className="w-8 h-8" />
                  <h3 className="text-xl font-bold uppercase italic leading-none text-[var(--color-pawtobooth-dark)]">Printer Properties</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-1">
                     <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Driver Profile</p>
                     <select className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase">
                        <option>DNP DS-Series (High Quality)</option>
                        <option>HiTi P525L (Fast Print)</option>
                        <option>Canon SELPHY CP1300/1500</option>
                        <option>Citizen CZ-01</option>
                        <option>Mitsubishi CP-D80DW</option>
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Paper Size</p>
                        <select className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase">
                           <option>4x6 Inch (10x15cm)</option>
                           <option>2x6 Strip (5x15cm)</option>
                           <option>5x7 Inch</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Orientation</p>
                        <select className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase">
                           <option>Portrait</option>
                           <option>Landscape</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 space-y-3">
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="opacity-40 uppercase">Auto-Cut</span>
                        <div className="w-10 h-5 bg-[#3E6B43] rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="opacity-40 uppercase">High Glossy</span>
                        <div className="w-10 h-5 bg-[#3E6B43] rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                     </div>
                  </div>
               </div>
            </div>

           <div className="p-8 bg-white border border-black/5 shadow-sm rounded-[40px] space-y-8">
              <div className="flex items-center gap-4 text-yellow-500">
                 <AlertTriangle className="w-8 h-8" />
                 <h3 className="text-xl font-bold uppercase italic leading-none text-[var(--color-pawtobooth-dark)]">Operator Checklist</h3>
              </div>
              <ul className="space-y-6 text-[10px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/80">
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
                 <li className="flex items-start gap-3 text-[#3E6B43]">
                    <CheckCircle2 className="w-4 h-4 text-[#3E6B43] shrink-0" />
                    <span className="font-bold">{settings.appName} Realtime Link Active</span>
                 </li>
              </ul>
           </div>

           <div className="p-8 bg-[#3E6B43]/10 border border-[#3E6B43]/20 rounded-[40px] flex items-center gap-6">
              <div className="w-12 h-12 bg-[#3E6B43] text-white rounded-2xl flex items-center justify-center border border-white/50 shrink-0 shadow-md">
                 <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#3E6B43]">Node Strategy</p>
                 <p className="text-xs font-mono uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]/60 leading-tight">This node handles prints for ALL booths in your network simultaneously.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
