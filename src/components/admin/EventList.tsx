import { Plus, Calendar, Clock, Camera, DollarSign, Settings, Trash2, X, Save } from 'lucide-react';
import { EventConfig } from '../../types';
import React, { useState } from 'react';

interface EventListProps {
  events: EventConfig[];
}

export function EventList({ events }: EventListProps) {
  const [editingEvent, setEditingEvent] = useState<EventConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    setIsSaving(true);
    try {
      await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEvent)
      });
      setEditingEvent(null);
    } catch (e) {
      console.error("Update event error", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight uppercase">Manage Events</h3>
          <button className="bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </button>
       </div>

       <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="p-6 bg-neutral-900 border border-white/5 rounded-3xl flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-white/30">
                     <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-xl font-bold">{event.name}</h4>
                     <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {event.timer}s Timer</span>
                        <span className="flex items-center gap-1"><Camera className="w-3 h-3"/> {event.shotCount} Shots</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> Rp {event.pricing.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingEvent(event)}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-neutral-800 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
       </div>

       {/* Editor Modal */}
       {editingEvent && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[40px] p-8 space-y-8 animate-in fade-in zoom-in duration-300">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold uppercase tracking-tight">Edit Event Settings</h3>
                  <button onClick={() => setEditingEvent(null)} className="p-2 hover:bg-white/10 rounded-full">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Event Name</label>
                     <input 
                       value={editingEvent.name}
                       onChange={e => setEditingEvent({...editingEvent, name: e.target.value})}
                       className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl focus:border-white/20 transition-colors"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Capture Timer (s)</label>
                        <input 
                          type="number"
                          value={editingEvent.timer}
                          onChange={e => setEditingEvent({...editingEvent, timer: parseInt(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl focus:border-white/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Photo Slots</label>
                        <input 
                          type="number"
                          value={editingEvent.shotCount}
                          onChange={e => setEditingEvent({...editingEvent, shotCount: parseInt(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl focus:border-white/20"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Price (Rp)</label>
                     <input 
                       type="number"
                       value={editingEvent.pricing}
                       onChange={e => setEditingEvent({...editingEvent, pricing: parseInt(e.target.value)})}
                       className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl focus:border-white/20 font-mono"
                     />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-3xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  >
                     {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" /> : <Save className="w-4 h-4" />}
                     Save Configuration
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
}
