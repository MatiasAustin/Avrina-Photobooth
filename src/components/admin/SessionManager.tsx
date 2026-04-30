import { useState } from 'react';
import { 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  MoreVertical,
  Calendar,
  CreditCard,
  Edit3,
  MessageCircle,
  Share2,
  Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Session, EventConfig, PhotoTemplate } from '../../types';
import { cn } from '../../lib/utils';
import { generatePhotoStrip, PhotoTransform } from '../../lib/image-utils';
import { ReviewGallery } from '../booth/ReviewGallery';

interface SessionManagerProps {
  sessions: Session[];
  events: EventConfig[];
  templates: PhotoTemplate[];
  onUpdate: () => void;
}

export function SessionManager({ sessions, events, templates, onUpdate }: SessionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const getSessionPhotos = (session: Session) => {
    if (!session.photos) return [];
    if (typeof session.photos === 'string') {
      try { return JSON.parse(session.photos); } catch { return []; }
    }
    return session.photos;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEventId === 'all' || session.event_id === selectedEventId;
    return matchesSearch && matchesEvent;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) {
      alert(`Error deleting session: ${error.message}`);
    } else {
      onUpdate();
    }
  };

  const togglePaymentStatus = async (session: Session) => {
    const nextStatus = session.payment_status === 'paid' ? 'pending' : 'paid';
    const { error } = await supabase
      .from('sessions')
      .update({ payment_status: nextStatus })
      .eq('id', session.id);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      onUpdate();
    }
  };

  const handlePrint = async (session: Session) => {
    if (!session.final_photo_url) {
      alert('No final photo available for printing.');
      return;
    }

    const { error } = await supabase.from('print_queue').insert({
      session_id: session.id,
      image_url: session.final_photo_url,
      status: 'queued'
    });

    if (error) {
      alert(`Error adding to print queue: ${error.message}`);
    } else {
      alert('Added to print queue successfully!');
      onUpdate();
    }
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShare = (session: Session) => {
    const phone = session.customer_phone;
    if (!phone) {
      const manualPhone = prompt("Enter customer WhatsApp number (e.g. 628123456789):");
      if (manualPhone) {
        // Update DB then share
        supabase.from('sessions').update({ customer_phone: manualPhone }).eq('id', session.id).then(() => {
          onUpdate();
          const url = `${window.location.origin}/gallery/${session.id}`;
          const text = encodeURIComponent(`Hi! Here are your photos from the photobooth: ${url}\n\nThank you for joining us!`);
          window.open(`https://wa.me/${manualPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
        });
      }
      return;
    }
    const url = `${window.location.origin}/gallery/${session.id}`;
    const text = encodeURIComponent(`Hi! Here are your photos from the photobooth: ${url}\n\nThank you for joining us!`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const handleFinalizeEdit = async (arrangedPhotos: string[], transforms: PhotoTransform[]) => {
    if (!editingSession) return;
    setIsSavingLayout(true);
    try {
      const template = templates.find(t => t.id === editingSession.template_id) || null;
      const event = events.find(e => e.id === editingSession.event_id);
      
      const finalStripBase64 = await generatePhotoStrip(arrangedPhotos, transforms, template, event?.name);
      if (!finalStripBase64) throw new Error("Generated strip is empty");
      
      const blob = await fetch(finalStripBase64).then(r => r.blob());
      const fileName = `session-${Date.now()}-edited.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('result')
        .upload(fileName, blob);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('result')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ final_photo_url: publicUrl })
        .eq('id', editingSession.id);

      if (updateError) throw updateError;
      
      alert("Layout updated successfully!");
      setEditingSession(null);
      onUpdate();
    } catch (e: any) {
      console.error(e);
      alert(`Failed to save layout: ${e.message}`);
    } finally {
      setIsSavingLayout(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic text-[var(--color-pawtobooth-dark)] leading-none mb-2">
            Session <span className="text-[#3E6B43]">Manager</span>
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/40">
            {filteredSessions.length} Total Captured Sessions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-pawtobooth-dark)]/30" />
            <input 
              type="text"
              placeholder="Search Session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-black/5 rounded-2xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#3E6B43]/20 transition-all shadow-sm"
            />
          </div>

          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-6 py-3 bg-white border border-black/5 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3E6B43]/20 transition-all shadow-sm"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>

          <div className="flex bg-white p-1 border border-black/5 rounded-2xl shadow-sm">
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'table' ? "bg-[var(--color-pawtobooth-dark)] text-white" : "text-[var(--color-pawtobooth-dark)]/40 hover:bg-black/5"
              )}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'grid' ? "bg-[var(--color-pawtobooth-dark)] text-white" : "text-[var(--color-pawtobooth-dark)]/40 hover:bg-black/5"
              )}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-[40px] border border-black/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5 bg-[var(--color-pawtobooth-light)]/30">
                  <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Session Detail</th>
                  <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Event</th>
                  <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Status</th>
                  <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Date</th>
                  <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredSessions.map((session) => {
                  const event = events.find(e => e.id === session.event_id);
                  return (
                    <tr key={session.id} className="group hover:bg-[var(--color-pawtobooth-light)]/20 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-20 rounded-xl overflow-hidden border border-black/5 bg-[var(--color-pawtobooth-light)] relative group/thumb">
                            {session.final_photo_url ? (
                              <>
                                <img src={session.final_photo_url} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setSelectedSession(session)}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                >
                                  <Eye className="w-4 h-4 text-white" />
                                </button>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--color-pawtobooth-dark)]/20">
                                <Clock className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">{session.id}</p>
                            <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase">
                              {session.customer_phone ? (
                                <span className="text-[#25D366] font-bold">WA: {session.customer_phone}</span>
                              ) : (
                                session.payment_id || 'NO PAYMENT ID'
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#3E6B43]/60" />
                          <span className="text-xs font-bold text-[var(--color-pawtobooth-dark)]/80">{event?.name || 'Unknown Event'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => togglePaymentStatus(session)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                            session.payment_status === 'paid' 
                              ? "bg-green-500/10 border-green-500/20 text-green-600" 
                              : session.payment_status === 'cancelled'
                                ? "bg-red-500/10 border-red-500/20 text-red-600"
                                : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                          )}
                        >
                          {session.payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {session.payment_status}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-medium text-[var(--color-pawtobooth-dark)]/60">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase">
                          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleWhatsAppShare(session)}
                            className={cn(
                              "p-3 rounded-xl border transition-all",
                              session.customer_phone 
                                ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white" 
                                : "bg-[var(--color-pawtobooth-light)] border-black/5 text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43] hover:text-white"
                            )}
                            title="Share to WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingSession(session)}
                            disabled={getSessionPhotos(session).length === 0}
                            className="p-3 rounded-xl bg-[var(--color-pawtobooth-light)] border border-black/5 text-[var(--color-pawtobooth-dark)]/60 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit Layout"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => session.final_photo_url && handleDownload(session.final_photo_url, session.id)}
                            disabled={!session.final_photo_url}
                            className="p-3 rounded-xl bg-[var(--color-pawtobooth-light)] border border-black/5 text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePrint(session)}
                            disabled={!session.final_photo_url}
                            className="p-3 rounded-xl bg-[var(--color-pawtobooth-light)] border border-black/5 text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(session.id)}
                            className="p-3 rounded-xl bg-[var(--color-pawtobooth-light)] border border-black/5 text-[var(--color-pawtobooth-dark)]/60 hover:bg-red-500 hover:text-white transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white border border-black/5 rounded-[40px] overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="aspect-[4/5] bg-[var(--color-pawtobooth-light)]/50 relative overflow-hidden">
                {session.final_photo_url ? (
                  <img 
                    src={session.final_photo_url} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-pawtobooth-dark)]/20 gap-4">
                    <Clock className="w-12 h-12" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                  </div>
                )}
                
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <div className={cn(
                     "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md",
                     session.payment_status === 'paid' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                   )}>
                     {session.payment_status}
                   </div>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
                   <button 
                    onClick={() => setSelectedSession(session)}
                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[var(--color-pawtobooth-dark)] hover:scale-110 transition-all shadow-2xl"
                   >
                     <Eye className="w-6 h-6" />
                   </button>
                   <div className="flex items-center gap-4">
                       <button 
                         onClick={() => handleWhatsAppShare(session)}
                         className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                           session.customer_phone 
                             ? "bg-[#25D366] text-white" 
                             : "bg-white/20 text-white hover:bg-[#3E6B43]"
                         )}
                         title="Share to WhatsApp"
                       >
                         <MessageCircle className="w-4 h-4" />
                       </button>
                      <button 
                        onClick={() => setEditingSession(session)}
                        disabled={getSessionPhotos(session).length === 0}
                        className="w-10 h-10 bg-white/20 hover:bg-white rounded-full flex items-center justify-center text-white hover:text-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Edit Layout"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => session.final_photo_url && handleDownload(session.final_photo_url, session.id)}
                        className="w-10 h-10 bg-white/20 hover:bg-white rounded-full flex items-center justify-center text-white hover:text-[var(--color-pawtobooth-dark)] transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(session)}
                        className="w-10 h-10 bg-white/20 hover:bg-white rounded-full flex items-center justify-center text-white hover:text-[var(--color-pawtobooth-dark)] transition-all"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
              
              <div className="p-8 space-y-4">
                 <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40 mb-1">
                      {new Date(session.created_at).toLocaleDateString()} • {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h4 className="font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)] truncate">{session.id}</h4>
                 </div>
                 <button 
                  onClick={() => handleDelete(session.id)}
                  className="w-full py-3 rounded-2xl border border-black/5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white transition-all"
                 >
                   Delete Session
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white rounded-[60px] border border-black/5 shadow-sm text-center px-8">
           <div className="w-24 h-24 bg-[var(--color-pawtobooth-light)] rounded-[40px] flex items-center justify-center text-[var(--color-pawtobooth-dark)]/20">
              <Filter className="w-10 h-10" />
           </div>
           <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic mb-2">No Sessions Found</h3>
              <p className="text-xs font-medium text-[var(--color-pawtobooth-dark)]/40 max-w-xs mx-auto">
                Try adjusting your search filters or check back later after some photo booth sessions!
              </p>
           </div>
           <button 
            onClick={() => { setSearchTerm(''); setSelectedEventId('all'); }}
            className="px-8 py-3 bg-[var(--color-pawtobooth-dark)] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl"
           >
             Clear All Filters
           </button>
        </div>
      )}

      {/* Quick Preview Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
           <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setSelectedSession(null)} 
           />
           <div className="relative w-full max-w-2xl bg-white rounded-[60px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-black/5 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none">{selectedSession.id}</h3>
                    <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-[0.2em] mt-2">Final Output Preview</p>
                 </div>
                 <button 
                  onClick={() => setSelectedSession(null)}
                  className="w-12 h-12 bg-[var(--color-pawtobooth-light)] rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all"
                 >
                   <XCircle className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="p-10 bg-[var(--color-pawtobooth-light)]/30 flex items-center justify-center">
                 <div className="w-[400px] aspect-[4/6] bg-white rounded-[32px] shadow-2xl overflow-hidden border-8 border-white">
                    {selectedSession.final_photo_url ? (
                      <img src={selectedSession.final_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-pawtobooth-dark)]/20">
                         <Clock className="w-12 h-12" />
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-10 grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => selectedSession.final_photo_url && handleDownload(selectedSession.final_photo_url, selectedSession.id)}
                  className="flex items-center justify-center gap-3 py-5 bg-[var(--color-pawtobooth-dark)] text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-xl"
                 >
                   <Download className="w-5 h-5" /> Download HD
                 </button>
                 <button 
                  onClick={() => handlePrint(selectedSession)}
                  className="flex items-center justify-center gap-3 py-5 bg-[#3E6B43] text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-[#3E6B43]/20"
                 >
                   <Printer className="w-5 h-5" /> Print Copy
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Session Modal Override */}
      {editingSession && (
        <div className="fixed inset-0 z-[200] bg-[var(--color-pawtobooth-beige)] overflow-y-auto">
          <div className="sticky top-0 z-50 p-6 flex justify-between items-center bg-[var(--color-pawtobooth-beige)]/80 backdrop-blur-md border-b border-black/5">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight italic">Edit Session Layout</h3>
              <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest">{editingSession.id}</p>
            </div>
            <button 
              onClick={() => setEditingSession(null)}
              className="px-6 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Cancel Edit
            </button>
          </div>
          
          <div className="relative pointer-events-auto">
            {isSavingLayout && (
              <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#3E6B43]/30 border-t-[#3E6B43] rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-[#3E6B43]">Saving Layout...</p>
              </div>
            )}
            <ReviewGallery 
              photos={getSessionPhotos(editingSession)}
              slotCount={templates.find(t => t.id === editingSession.template_id)?.slot_count || 3}
              templateImageUrl={templates.find(t => t.id === editingSession.template_id)?.image_url}
              onRetake={() => {}}
              onSelectiveRetake={() => {}}
              onFinalize={handleFinalizeEdit}
              isAdminMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
