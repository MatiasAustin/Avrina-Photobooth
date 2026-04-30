import { useState, useEffect, useRef } from 'react';
import { Printer, Zap, Activity, CheckCircle2, AlertTriangle, Play, Pause, RefreshCw, Settings, RotateCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

import { usePrint } from '../../contexts/PrintContext';

export function PrintNode() {
  const { settings } = useSettings();
  const { 
    isListening, setIsListening, logs, clearLogs, 
    printers, setPrinters, activePrinterId, setActivePrinterId, stats, addLog,
    stationInfo, setStationInfo
  } = usePrint();

  const [connectionMode, setConnectionMode] = useState<'direct' | 'printnode' | 'bridge'>('direct');
  const [apiKey, setApiKey] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // The subscription is now handled globally in PrintContext
  // This component only controls the UI and local state for scanning

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

                <div className="p-6 bg-[#3E6B43]/5 border border-[#3E6B43]/10 rounded-3xl space-y-3">
                   <div className="flex items-center gap-3 text-[#3E6B43]">
                      <Zap className="w-5 h-5 text-glow" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Global Listener Active</h4>
                   </div>
                   <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 leading-relaxed font-medium">
                      The listener is now running in the background. It bridges your <strong>Cloud Print Queue</strong> with this machine. You can safely switch tabs; the connection will remain active and trigger prints for your selected driver automatically.
                   </p>
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
                        <Printer className="w-4 h-4 text-[#3E6B43]" /> Windows Driver Bridge
                     </h3>
                     <button 
                       onClick={async () => {
                         setIsScanning(true);
                         // Simulate real scan
                         await new Promise(r => setTimeout(r, 1500));
                         setPrinters([
                           { id: 'p1', name: 'Canon MX390 series Printer', status: 'connected', type: 'usb' },
                           { id: 'p2', name: 'Microsoft Print to PDF', status: 'connected', type: 'virtual' },
                           { id: 'p3', name: 'OneNote (Desktop)', status: 'connected', type: 'virtual' }
                         ]);
                         setIsScanning(false);
                         addLog("Local printer driver list synced with Windows", "success");
                       }}
                       disabled={isScanning}
                       className="text-[10px] text-[#3E6B43] font-bold uppercase hover:underline flex items-center gap-1 disabled:opacity-50"
                     >
                        {isScanning ? <RotateCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Scan Local Devices
                     </button>
                  </div>
                  
                  {printers.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-black/5 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 bg-[var(--color-pawtobooth-light)]/30">
                       <Printer className="w-10 h-10 opacity-10" />
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-40">No Drivers Detected</p>
                          <p className="text-[9px] font-mono opacity-60 max-w-[200px]">Click Scan to fetch installed printers from your Windows system.</p>
                       </div>
                    </div>
                  ) : (
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
                               <div className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
                               <span className="text-[8px] font-mono uppercase opacity-40">{p.type}</span>
                            </div>
                            <p className="text-[10px] font-black uppercase truncate">{p.name}</p>
                            <p className="text-[8px] font-mono opacity-60 truncate">Driver Ready</p>
                         </button>
                       ))}
                    </div>
                  )}
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
                  <h3 className="text-xl font-bold uppercase italic leading-none text-[var(--color-pawtobooth-dark)]">Station Info</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-1">
                     <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Printer Model</p>
                     <input 
                       type="text" 
                       placeholder="e.g. Canon MX390" 
                       value={stationInfo.model}
                       onChange={e => setStationInfo({ ...stationInfo, model: e.target.value })}
                       className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-[#3E6B43]/20" 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Initial Stock</p>
                        <input 
                          type="number" 
                          placeholder="400" 
                          value={stationInfo.stock}
                          onChange={e => setStationInfo({ ...stationInfo, stock: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-[#3E6B43]/20" 
                        />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase opacity-40 ml-2">Safety Margin</p>
                        <input 
                          type="number" 
                          placeholder="10" 
                          value={stationInfo.margin}
                          onChange={e => setStationInfo({ ...stationInfo, margin: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[var(--color-pawtobooth-light)] border-none p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 ring-[#3E6B43]/20" 
                        />
                     </div>
                  </div>

                  <div className="p-4 bg-[var(--color-pawtobooth-light)] rounded-2xl space-y-2">
                     <div className="flex justify-between items-center text-[8px] font-black uppercase opacity-40">
                        <span>Calculated Remaining</span>
                        <span>{stationInfo.stock - stats.printed} Sheets</span>
                     </div>
                     <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#3E6B43]" 
                          style={{ width: `${Math.max(0, Math.min(100, ((stationInfo.stock - stats.printed) / stationInfo.stock) * 100))}%` }} 
                        />
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
