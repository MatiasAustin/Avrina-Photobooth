import { Trash2 } from 'lucide-react';

export function TemplateGrid() {
  return (
     <div className="space-y-12">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-bold tracking-tight uppercase">Photo Templates</h3>
           <button className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest">
             Add Template
           </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
           {[1,2,3,4].map(id => (
             <div key={id} className="space-y-4">
                <div className="aspect-[3/4] bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden relative group">
                   <div className="absolute inset-0 border-8 border-white/20 m-4 flex items-center justify-center text-white/5 uppercase text-[8px] font-black tracking-[0.5em] rotate-12">
                      Luxury Frame
                   </div>
                   <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black flex justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Classic v{id}</span>
                      <Trash2 className="w-3 h-3 text-red-500/50 hover:text-red-500 cursor-pointer" />
                   </div>
                </div>
             </div>
           ))}
        </div>
     </div>
  );
}
