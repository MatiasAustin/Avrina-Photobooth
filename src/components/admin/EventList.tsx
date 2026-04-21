import { Plus, Calendar, Clock, Camera, DollarSign, Settings, Trash2, X, Save, Globe, Copy, Check } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface EventListProps {
  userId: string;
  events: any[];
  onUpdate: () => void;
}

export function EventList({ userId, events, onUpdate }: EventListProps) {
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/booth/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .upsert({
          ...editingEvent,
          user_id: userId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setEditingEvent(null);
      onUpdate();
    } catch (err: any) {
      console.error("Save event error", err);
      alert(`Error saving event: ${err.message || 'Check for unique slug.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all sessions and templates for this booth.")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) alert(error.message);
    else onUpdate();
  };

  const createNew = () => {
    setEditingEvent({
      name: 'New Booth',
      slug: `booth-${Math.random().toString(36).substr(2, 5)}`,
      timer: 5,
      shot_count: 3,
      price: 0,
      qris_enabled: false,
      is_active: true,
      session_timeout: 10
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-neutral-500">Global Booth Network</h3>
          <button 
            onClick={createNew}
            className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Deploy New Booth
          </button>
       </div>

       <div className="grid gap-4">
          {events.length === 0 && (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
               <Calendar className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
               <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">No active booths deployed</p>
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} className="p-6 bg-neutral-900/40 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-neutral-900/60 transition-all group">
               <div className="flex items-center gap-6 flex-1 w-full">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-white/30 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                     <Globe className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold uppercase tracking-tight">{event.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${event.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {event.is_active ? 'Live' : 'Offline'}
                        </span>
                     </div>
                     <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">
                        <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" onClick={() => window.open(`/booth/${event.slug}`, '_blank')}>
                           <Globe className="w-3 h-3"/> /{event.slug}
                        </span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {event.timer}s Delay</span>
                        <span className="flex items-center gap-1"><Camera className="w-3 h-3"/> {event.shot_count} Slots</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> Rp {event.price.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => copyLink(event.slug, event.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-center gap-2",
                      copiedId === event.id 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white hover:text-black"
                    )}
                    title="Copy Booth Link"
                  >
                    {copiedId === event.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">
                      {copiedId === event.id ? 'Copied' : 'Copy Link'}
                    </span>
                  </button>
                  <button 
                    onClick={() => window.open(`/booth/${event.slug}`, '_blank')}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all text-neutral-400"
                    title="Launch Booth"
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setEditingEvent(event)}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all text-neutral-400"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(event.id)}
                    className="p-3 bg-neutral-800 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
       </div>

       {/* Editor Modal */}
       {editingEvent && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[40px] p-8 space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold uppercase tracking-tight">Configure Booth</h3>
                  <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-white/10 rounded-full">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Booth Name</label>
                      <input 
                        value={editingEvent.name}
                        onChange={e => setEditingEvent({...editingEvent, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">URL Slug</label>
                       <input 
                         value={editingEvent.slug}
                         onChange={e => setEditingEvent({...editingEvent, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                         className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 font-mono"
                       />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Timer (s)</label>
                        <input 
                          type="number"
                          value={editingEvent.timer}
                          onChange={e => setEditingEvent({...editingEvent, timer: parseInt(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Photos</label>
                        <input 
                          type="number"
                          value={editingEvent.shot_count}
                          onChange={e => setEditingEvent({...editingEvent, shot_count: parseInt(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Price (Rp)</label>
                     <input 
                       type="number"
                       value={editingEvent.price}
                       onChange={e => setEditingEvent({...editingEvent, price: parseInt(e.target.value)})}
                       className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 font-mono"
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Session Timeout (min)</label>
                        <input 
                          type="number"
                          value={editingEvent.session_timeout}
                          onChange={e => setEditingEvent({...editingEvent, session_timeout: parseInt(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 font-mono text-glow"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Active Status</label>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 h-[58px]">
                          <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Live</span>
                          <button 
                            type="button"
                            onClick={() => setEditingEvent({...editingEvent, is_active: !editingEvent.is_active})}
                            className={`w-10 h-5 rounded-full relative transition-colors ${editingEvent.is_active ? 'bg-green-500' : 'bg-neutral-700'}`}
                          >
                             <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editingEvent.is_active ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                     </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                     {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" /> : <Save className="w-4 h-4" />}
                     Commit Deployment
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
}
