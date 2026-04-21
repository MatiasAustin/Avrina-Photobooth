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
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Active Print Queue</h3>
            <div className="space-y-4">
              {jobs.length > 0 ? jobs.map((job) => (
                <div key={job.id} className="p-4 bg-neutral-900/50 border border-white/5 rounded-3xl flex items-center gap-4 hover:border-white/20 transition-all group">
                   <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-800 shrink-0 border border-white/5 relative group-hover:scale-105 transition-transform">
                      <img src={job.image_url} className="w-full h-full object-cover" />
                      {job.status === 'printing' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                           <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-3">
                         <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{job.status}</p>
                         <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'queued' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-1">UUID: {job.id.substr(0, 8)}...</p>
                   </div>
                   <div className="flex gap-2">
                     {job.status === 'queued' && (
                       <button 
                        onClick={() => updateStatus(job.id, 'printing')}
                        className="p-3 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-green-500 hover:text-white transition-all shadow-xl"
                       >
                         <Printer className="w-4 h-4" />
                       </button>
                     )}
                     <button 
                      onClick={() => deleteJob(job.id)}
                      className="p-3 bg-neutral-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] text-neutral-700 font-mono text-xs uppercase tracking-[0.3em]">
                   NO PENDING JOBS DETECTED
                </div>
              )}
            </div>
         </div>

         <div className="p-8 bg-neutral-900 border border-white/5 rounded-[40px] space-y-8 h-fit sticky top-24">
            <div className="flex items-center gap-4 text-white">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                 <Printer className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-bold uppercase italic tracking-tight leading-none">LuxPrint Node</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">Satellite Status</p>
               </div>
            </div>
            
            <div className="space-y-6 pt-4">
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                     <span className="text-neutral-500">Node Status</span>
                     <span className="text-green-500 font-bold">Encrypted / Online</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                     <span className="text-neutral-500">Paper Supply</span>
                     <span className="font-bold">42 Sheets</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="w-[42%] h-full bg-white shadow-[0_0_10px_white]" />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                     <span className="text-neutral-500">Dye-Sub Ribbon</span>
                     <span className="font-bold">88%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="w-[88%] h-full bg-green-500" />
                  </div>
               </div>
            </div>

            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
               Run diagnostics
            </button>
         </div>
      </div>
    </div>
  );
}
