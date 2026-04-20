import { Trash2 } from 'lucide-react';
import { Session } from '../../types';

interface SessionGridProps {
  sessions: Session[];
  onDelete?: (id: string) => void;
}

export function SessionGrid({ sessions, onDelete }: SessionGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold tracking-tight uppercase">Recent Sessions</h3>
        <button className="text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">View All</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {sessions.slice(0, 6).map((session) => (
           <div key={session.id} className="p-4 bg-neutral-900 border border-white/10 rounded-[24px] space-y-4 group">
              <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800">
                 <img src={session.photos[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">{session.paymentStatus}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {new Date(session.createdAt?.seconds * 1000).toLocaleString()}
                    </p>
                 </div>
                 <button 
                  onClick={() => onDelete?.(session.id)}
                  className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-all"
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
