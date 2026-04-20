import { Printer, Check, X } from 'lucide-react';
import { PrintJob } from '../../types';

interface PrintQueueProps {
  jobs: PrintJob[];
}

export function PrintQueue({ jobs }: PrintQueueProps) {
  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/print-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error("Update print status error", e);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await fetch(`/api/print-queue/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.error("Delete print job error", e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight uppercase">Print Queue</h3>
            <div className="space-y-4">
              {jobs.length > 0 ? jobs.map((job) => (
                <div key={job.id} className="p-4 bg-neutral-900/50 border border-white/10 rounded-2xl flex items-center gap-4">
                   <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                      <img src={job.imageUrl} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest">{job.status}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">Job ID: {job.id}</p>
                   </div>
                   <div className="flex gap-2">
                     {job.status === 'queued' && (
                       <button 
                        onClick={() => updateStatus(job.id, 'printing')}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                     )}
                     <button 
                      onClick={() => deleteJob(job.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              )) : (
                <div className="py-12 text-center text-neutral-600 font-mono italic">
                   Queue is empty. Ready for new prints.
                </div>
              )}
            </div>
         </div>

         <div className="p-8 bg-neutral-900 border border-white/5 rounded-[40px] space-y-8 h-fit">
            <div className="flex items-center gap-4 text-purple-400">
               <Printer className="w-8 h-8" />
               <h3 className="text-2xl font-bold uppercase italic">Printer Pro</h3>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 font-mono uppercase tracking-widest">Status</span>
                  <span className="text-green-500 font-bold uppercase">Ready</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 font-mono uppercase tracking-widest">Paper Remaining</span>
                  <span className="font-bold">42 Sheets</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-purple-500" />
               </div>
               <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 font-mono uppercase tracking-widest">Ink Level</span>
                  <span className="font-bold">88%</span>
               </div>
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-green-500" />
               </div>
            </div>

            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all">
               Maintenance Mode
            </button>
         </div>
      </div>
   </div>
  );
}
