import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface PrintContextType {
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  logs: any[];
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearLogs: () => void;
  printers: any[];
  setPrinters: (val: any[]) => void;
  activePrinterId: string | null;
  setActivePrinterId: (id: string | null) => void;
  stats: { printed: number, pending: number };
  stationInfo: { model: string, stock: number, margin: number };
  setStationInfo: (info: { model: string, stock: number, margin: number }) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(() => localStorage.getItem('pawtobooth_listener_active') === 'true');
  const [logs, setLogs] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>(() => {
    const saved = localStorage.getItem('pawtobooth_system_printers');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePrinterId, setActivePrinterId] = useState<string | null>(() => localStorage.getItem('pawtobooth_active_printer'));
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('pawtobooth_print_stats');
    return saved ? JSON.parse(saved) : { printed: 0, pending: 0 };
  });
  const [stationInfo, setStationInfo] = useState(() => {
    const saved = localStorage.getItem('pawtobooth_station_info');
    return saved ? JSON.parse(saved) : { model: 'Canon MX390', stock: 400, margin: 10 };
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('pawtobooth_listener_active', isListening.toString());
  }, [isListening]);

  useEffect(() => {
    localStorage.setItem('pawtobooth_system_printers', JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    if (activePrinterId) localStorage.setItem('pawtobooth_active_printer', activePrinterId);
  }, [activePrinterId]);

  useEffect(() => {
    localStorage.setItem('pawtobooth_print_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('pawtobooth_station_info', JSON.stringify(stationInfo));
  }, [stationInfo]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 50));
  };

  const clearLogs = () => setLogs([]);

  const handleIncomingJob = async (job: any) => {
    // Only process if listener is active
    if (!isListening) return;
    if (job.status !== 'queued') return;
    
    addLog(`Queue Alert: New session ${job.id.substr(0, 8)} detected`, 'info');
    setStats(prev => ({ ...prev, pending: prev.pending + 1 }));

    try {
      // Small delay to ensure DB is consistent
      await new Promise(r => setTimeout(r, 1000));
      
      const success = await processPrint(job);
      
      if (success) {
        const { error } = await supabase
          .from('print_queue')
          .update({ status: 'completed' })
          .eq('id', job.id);

        if (error) throw error;

        addLog(`SUCCESS: ${job.id.substr(0, 8)} sent to ${stationInfo.model}`, 'success');
        setStats(prev => ({ printed: prev.printed + 1, pending: Math.max(0, prev.pending - 1) }));
      } else {
        throw new Error("Print function returned false");
      }
    } catch (e) {
      addLog(`ERROR: Failed to process job ${job.id.substr(0, 8)}`, 'error');
      console.error(e);
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
    }
  };

  const processPrint = (job: any) => {
    return new Promise((resolve) => {
      // Remove any existing frame
      const oldFrame = document.getElementById('global-print-frame');
      if (oldFrame) oldFrame.remove();

      const frame = document.createElement('iframe');
      frame.id = 'global-print-frame';
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      document.body.appendChild(frame);

      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return resolve(false);

      doc.body.innerHTML = `
        <style>
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: white; }
          img { width: 100%; height: auto; display: block; }
          .meta { font-size: 10px; position: absolute; bottom: 5px; right: 5px; }
        </style>
        <img src="${job.image_url}" />
        <div class="meta">Printer: ${stationInfo.model}</div>
      `;

      const img = doc.querySelector('img');
      if (img) {
        img.onload = () => {
          setTimeout(() => {
            try {
              frame.contentWindow?.focus();
              frame.contentWindow?.print();
              // In kiosk mode, this returns immediately. We wait a bit to be safe.
              setTimeout(() => {
                resolve(true);
              }, 2000);
            } catch (e) {
              console.error("Print error", e);
              resolve(false);
            }
          }, 1000);
        };
        img.onerror = () => resolve(false);
      } else {
        resolve(false);
      }
    });
  };

  useEffect(() => {
    if (!isListening) return;

    addLog("System Online - Monitoring Cloud Queue...", "info");
    
    // Subscribe to new entries
    const channel = supabase
      .channel('global_print_jobs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'print_queue' 
      }, (payload) => {
        handleIncomingJob(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isListening, activePrinterId]);

  return (
    <PrintContext.Provider value={{ 
      isListening, setIsListening, logs, addLog, clearLogs, 
      printers, setPrinters, activePrinterId, setActivePrinterId, stats,
      stationInfo, setStationInfo
    }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
