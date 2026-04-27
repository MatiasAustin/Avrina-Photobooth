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
           <div className="col-span-full py-20 text-center border-2 border-dashed border-black/5 rounded-[40px] bg-[var(--color-pawtobooth-light)]/50">
              <Search className="w-12 h-12 text-[var(--color-pawtobooth-dark)]/20 mx-auto mb-4" />
              <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-widest">No captured sessions yet</p>
           </div>
         )}
         {sessions.slice(0, 12).map((session) => (
           <div key={session.id} className="p-4 bg-white border border-black/5 rounded-[32px] space-y-4 group hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-[var(--color-pawtobooth-light)] border border-black/5 relative">
                 <img 
                   src={(() => {
                     try {
                       if (!session.photos) return 'https://images.unsplash.com/photo-1516035069341-3491d889c6f2?w=800&q=80';
                       const photos = Array.isArray(session.photos) ? session.photos : JSON.parse(session.photos);
                       return photos[0] || 'https://images.unsplash.com/photo-1516035069341-3491d889c6f2?w=800&q=80';
                     } catch(e) {
                       return 'https://images.unsplash.com/photo-1516035069341-3491d889c6f2?w=800&q=80';
                     }
                   })()} 
                   className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110" 
                 />
                 <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${session.payment_status === 'paid' ? 'bg-[#3E6B43] text-white shadow-sm' : 'bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)] border border-black/5'}`}>
                      {session.payment_status}
                    </span>
                 </div>
              </div>
              <div className="flex items-center justify-between px-2">
                 <div className="space-y-0.5">
                    <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 font-mono uppercase tracking-widest">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
                 <button 
                  onClick={() => handleDelete(session.id)}
                  className="p-2 bg-[var(--color-pawtobooth-light)] rounded-xl hover:bg-red-500 hover:text-white text-[var(--color-pawtobooth-dark)]/40 transition-all"
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
