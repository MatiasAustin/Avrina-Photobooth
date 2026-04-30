import { Printer, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PrintQueueProps {
  jobs: any[];
  onUpdate: () => void;
}

export function PrintQueue({ jobs, onUpdate }: PrintQueueProps) {
  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('print_queue')
        .update({ status })
        .eq('id', id);
        
      if (error) throw error;
      onUpdate();
    } catch (e) {
      console.error("Update print status error", e);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('print_queue')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      onUpdate();
    } catch (e) {
      console.error("Delete print job error", e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/60">Active Print Queue</h3>
            <div className="space-y-4">
              {jobs.length > 0 ? jobs.map((job) => (
                <div key={job.id} className="p-4 bg-white border border-black/5 rounded-3xl flex items-center gap-4 hover:shadow-md transition-all group shadow-sm">
                   <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--color-pawtobooth-light)] shrink-0 border border-black/5 relative group-hover:scale-105 transition-transform">
                      <img src={job.image_url} className="w-full h-full object-cover" />
                      {job.status === 'printing' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-3">
                         <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/80">{job.status}</p>
                         <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'queued' ? 'bg-yellow-500' : 'bg-[#3E6B43]'}`} />
                      </div>
                      <p className="text-xs text-[var(--color-pawtobooth-dark)]/60 font-mono mt-1">UUID: {job.id.substr(0, 8)}...</p>
                   </div>
                   <div className="flex gap-2">
                     {job.status === 'queued' && (
                       <button 
                        onClick={() => updateStatus(job.id, 'printing')}
                        className="p-3 bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)] rounded-xl border border-black/5 hover:bg-[#3E6B43] hover:text-white transition-all shadow-sm"
                       >
                         <Printer className="w-4 h-4" />
                       </button>
                     )}
                     <button 
                      onClick={() => deleteJob(job.id)}
                      className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-black/5"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[40px] text-[var(--color-pawtobooth-dark)]/40 font-mono text-xs uppercase tracking-[0.3em]">
                   NO PENDING JOBS DETECTED
                </div>
              )}
            </div>
         </div>

          <div className="p-8 bg-white border border-black/5 shadow-sm rounded-[40px] space-y-6 h-fit sticky top-24">
             <div className="flex items-center gap-4 text-[var(--color-pawtobooth-dark)]">
                <div className="w-12 h-12 bg-[#3E6B43]/10 rounded-2xl flex items-center justify-center border border-[#3E6B43]/20">
                  <Printer className="w-6 h-6 text-[#3E6B43]" />
                </div>
                <div>
                   <h3 className="text-xl font-bold uppercase italic tracking-tight leading-none">Queue Manager</h3>
                   <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest mt-1">Live Monitoring</p>
                </div>
             </div>
             
             <div className="space-y-4 pt-4">
                <div className="p-6 bg-[var(--color-pawtobooth-light)] rounded-3xl border border-black/5 space-y-1">
                   <p className="text-[var(--color-pawtobooth-dark)]/60 text-[8px] font-black uppercase tracking-widest leading-none">Pending Jobs</p>
                   <p className="text-3xl font-black text-[var(--color-pawtobooth-dark)]">{jobs.filter(j => j.status === 'queued').length}</p>
                </div>
                <div className="p-6 bg-[var(--color-pawtobooth-light)] rounded-3xl border border-black/5 space-y-1">
                   <p className="text-[var(--color-pawtobooth-dark)]/60 text-[8px] font-black uppercase tracking-widest leading-none">In Process</p>
                   <p className="text-3xl font-black text-[#3E6B43]">{jobs.filter(j => j.status === 'printing').length}</p>
                </div>
             </div>

             <div className="p-4 bg-[#3E6B43]/5 border border-[#3E6B43]/10 rounded-2xl">
                <p className="text-[9px] text-[#3E6B43] font-medium leading-relaxed italic">
                   "Jobs are automatically processed when the Remote Print Node Listener is active."
                </p>
             </div>
          </div>
       </div>
    </div>
  );
}
