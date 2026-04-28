import { useState } from 'react';
import { 
  Trash2, 
  Search, 
  LayoutGrid, 
  List, 
  Download, 
  Printer, 
  Clock, 
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Session, EventConfig } from '../../types';

interface SessionGridProps {
  sessions: Session[];
  events: EventConfig[];
  onDelete?: () => void;
}

export function SessionGrid({ sessions, events, onDelete }: SessionGridProps) {
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this session?")) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) alert(error.message);
    else onDelete?.();
  };

  const handlePrint = async (session: Session) => {
    if (!session.final_photo_url) return;
    const { error } = await supabase.from('print_queue').insert({
      session_id: session.id,
      image_url: session.final_photo_url,
      status: 'queued'
    });
    if (error) alert(error.message);
    else alert("Added to print queue!");
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sessions.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[40px] bg-[var(--color-pawtobooth-light)]/50">
        <Search className="w-12 h-12 text-[var(--color-pawtobooth-dark)]/20 mx-auto mb-4" />
        <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-widest">No captured sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex bg-white p-1 border border-black/5 rounded-2xl shadow-sm">
          <button 
            onClick={() => setViewMode('gallery')}
            className={cn(
              "p-2 rounded-xl transition-all",
              viewMode === 'gallery' ? "bg-[var(--color-pawtobooth-dark)] text-white shadow-sm" : "text-[var(--color-pawtobooth-dark)]/40 hover:bg-black/5"
            )}
            title="Gallery View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-xl transition-all",
              viewMode === 'list' ? "bg-[var(--color-pawtobooth-dark)] text-white shadow-sm" : "text-[var(--color-pawtobooth-dark)]/40 hover:bg-black/5"
            )}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.slice(0, 12).map((session) => {
            const event = events.find(e => e.id === session.event_id);
            return (
              <div key={session.id} className="p-4 bg-white border border-black/5 rounded-[32px] space-y-4 group hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-[var(--color-pawtobooth-light)] border border-black/5 relative">
                  <img 
                    src={session.final_photo_url || (Array.isArray(session.photos) ? session.photos[0] : JSON.parse(session.photos as string)[0]) || 'https://images.unsplash.com/photo-1516035069341-3491d889c6f2?w=800&q=80'} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm",
                      session.payment_status === 'paid' ? "bg-[#3E6B43] text-white" : "bg-orange-500 text-white"
                    )}>
                      {session.payment_status}
                    </span>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    {session.final_photo_url && (
                      <>
                        <button 
                          onClick={() => handleDownload(session.final_photo_url!, session.id)}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[var(--color-pawtobooth-dark)] hover:scale-110 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handlePrint(session)}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[var(--color-pawtobooth-dark)] hover:scale-110 transition-all"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 font-mono uppercase tracking-widest">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] font-black text-[#3E6B43] uppercase tracking-tighter">
                      {event?.name || 'Unknown Event'} • ID: {session.id.split('-')[1] || session.id}
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
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-black/5 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 bg-[var(--color-pawtobooth-light)]/30">
                <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40">Session</th>
                <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40">Time</th>
                <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40">Revenue</th>
                <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {sessions.slice(0, 15).map((session) => {
                const event = events.find(e => e.id === session.event_id);
                return (
                  <tr key={session.id} className="group hover:bg-[var(--color-pawtobooth-light)]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden border border-black/5 bg-[var(--color-pawtobooth-light)]">
                          <img 
                            src={session.final_photo_url || (Array.isArray(session.photos) ? session.photos[0] : JSON.parse(session.photos as string)[0])} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">{session.id}</p>
                          <p className="text-[9px] font-bold text-[#3E6B43] uppercase tracking-tighter">{event?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[var(--color-pawtobooth-dark)]/60">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#3E6B43]/60" />
                        <span className="text-xs font-black text-[var(--color-pawtobooth-dark)]">
                          {session.payment_status === 'paid' ? `Rp ${event?.price?.toLocaleString() || 0}` : 'FREE'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {session.final_photo_url && (
                          <>
                            <button 
                              onClick={() => handleDownload(session.final_photo_url!, session.id)}
                              className="p-2 rounded-lg bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43] hover:text-white transition-all"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handlePrint(session)}
                              className="p-2 rounded-lg bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43] hover:text-white transition-all"
                              title="Print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(session.id)}
                          className="p-2 rounded-lg bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)]/60 hover:bg-red-500 hover:text-white transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
