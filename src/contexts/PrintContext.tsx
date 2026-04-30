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
  const [stats, setStats] = useState({ printed: 0, pending: 0 });
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

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

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 50));
  };

  const clearLogs = () => setLogs([]);

  const handleIncomingJob = async (job: any) => {
    if (job.status !== 'queued') return;
    
    addLog(`New job incoming: ${job.id.substr(0, 8)}`, 'info');
    setStats(prev => ({ ...prev, pending: prev.pending + 1 }));

    try {
      await processPrint(job);
      
      const { error } = await supabase
        .from('print_queue')
        .update({ status: 'completed' })
        .eq('id', job.id);

      if (error) throw error;

      addLog(`Job ${job.id.substr(0, 8)} printed successfully`, 'success');
      setStats(prev => ({ printed: prev.printed + 1, pending: Math.max(0, prev.pending - 1) }));
    } catch (e) {
      addLog(`Printing failed for job ${job.id.substr(0, 8)}`, 'error');
      console.error(e);
    }
  };

  const processPrint = (job: any) => {
    return new Promise((resolve) => {
      // We create a temporary hidden iframe if it doesn't exist
      let frame = document.getElementById('global-print-frame') as HTMLIFrameElement;
      if (!frame) {
        frame = document.createElement('iframe');
        frame.id = 'global-print-frame';
        frame.style.display = 'none';
        document.body.appendChild(frame);
      }

      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return resolve(false);

      doc.body.innerHTML = `
        <style>@page { size: auto; margin: 0; } body { margin: 0; padding: 0; }</style>
        <img src="${job.image_url}" style="width: 100%; height: auto;" />
      `;

      const img = doc.querySelector('img');
      if (img) {
        img.onload = () => {
          frame.contentWindow?.print();
          setTimeout(() => resolve(true), 2000);
        };
        img.onerror = () => resolve(false);
      }
    });
  };

  useEffect(() => {
    if (!isListening) return;

    addLog("Cloud Link Active - Monitoring Queue...", "info");
    const channel = supabase
      .channel('global_print_jobs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_queue' }, (payload) => {
        handleIncomingJob(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isListening]);

  return (
    <PrintContext.Provider value={{ 
      isListening, setIsListening, logs, addLog, clearLogs, 
      printers, setPrinters, activePrinterId, setActivePrinterId, stats 
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
