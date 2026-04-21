import { Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SessionGridProps {
  sessions: any[];
  onDelete?: () => void;
}

export function SessionGrid({ sessions, onDelete }: SessionGridProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this session?")) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) alert(error.message);
    else onDelete?.();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {sessions.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
              <Search className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
              <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">No captured sessions yet</p>
           </div>
         )}
         {sessions.slice(0, 12).map((session) => (
           <div key={session.id} className="p-4 bg-neutral-900/40 border border-white/5 rounded-[32px] space-y-4 group hover:bg-neutral-900/80 transition-all">
              <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-neutral-800 border border-white/5 relative">
                 <img 
                   src={Array.isArray(session.photos) ? session.photos[0] : JSON.parse(session.photos)[0]} 
                   className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110" 
                 />
                 <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${session.payment_status === 'paid' ? 'bg-green-500 text-black' : 'bg-white/10 text-white'}`}>
                      {session.payment_status}
                    </span>
                 </div>
              </div>
              <div className="flex items-center justify-between px-2">
                 <div className="space-y-0.5">
                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
                 <button 
                  onClick={() => handleDelete(session.id)}
                  className="p-2 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white text-neutral-500 transition-all"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
           </div>
          ))}
      </div>
    </div>
  );
}
