import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, X, Save, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TemplateEditor } from './TemplateEditor';

export function TemplateGrid() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', image_url: '', event_id: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch owned events
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, name')
      .eq('user_id', user.id);
    
    setEvents(eventsData || []);

    if (eventsData && eventsData.length > 0) {
      const { data: templatesData } = await supabase
        .from('templates')
        .select('*, events(name)')
        .in('event_id', eventsData.map(e => e.id));
      
      setTemplates(templatesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.event_id || !newTemplate.image_url) {
       alert("Please select an event and provide an image URL.");
       return;
    }

    const { error } = await supabase.from('templates').insert(newTemplate);
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewTemplate({ name: '', image_url: '', event_id: '' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from('templates').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/60">Global Template Library</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDesignStudio(true)}
              className="bg-white border border-black/5 text-[var(--color-pawtobooth-dark)]/60 px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#3E6B43] hover:text-white hover:border-[#3E6B43] transition-all shadow-sm"
            >
              <Palette className="w-4 h-4" /> Design Studio
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#3E6B43] text-white px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm hover:bg-[var(--color-pawtobooth-dark)] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Template
            </button>
          </div>
       </div>

       {showDesignStudio && (
         <TemplateEditor 
           events={events}
           onClose={() => setShowDesignStudio(false)}
           onSave={() => {
              setShowDesignStudio(false);
              fetchData();
           }}
         />
       )}

       {loading ? (
         <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-[#3E6B43]/20 border-t-[#3E6B43] rounded-full mx-auto" /></div>
       ) : templates.length === 0 ? (
         <div className="py-20 text-center border-2 border-dashed border-black/5 rounded-[40px] bg-[var(--color-pawtobooth-light)]/50">
            <ImageIcon className="w-12 h-12 text-[var(--color-pawtobooth-dark)]/20 mx-auto mb-4" />
            <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-widest">No templates created yet</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {templates.map(t => (
              <div key={t.id} className="space-y-4 group">
                 <div className="aspect-[4/5] bg-white border border-black/5 rounded-[32px] overflow-hidden relative shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <img src={t.image_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end gap-4">
                       <div className="space-y-1">
                          <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{t.events?.name}</p>
                          <p className="font-bold uppercase tracking-tight text-white">{t.name}</p>
                       </div>
                       <button 
                         onClick={() => handleDelete(t.id)}
                         className="w-full py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                       >
                          <Trash2 className="w-3 h-3" /> Delete
                       </button>
                    </div>
                 </div>
              </div>
            ))}
         </div>
       )}

       {showAddModal && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <div className="w-full max-w-lg bg-white border border-black/10 rounded-[40px] p-10 space-y-8 shadow-2xl">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">New Template</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-black/5 rounded-full text-[var(--color-pawtobooth-dark)]/60">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleAdd} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Assign to Booth</label>
                     <select 
                       value={newTemplate.event_id}
                       onChange={e => setNewTemplate({...newTemplate, event_id: e.target.value})}
                       className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-sm text-[var(--color-pawtobooth-dark)]"
                       required
                     >
                        <option value="">Select an event...</option>
                        {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Template Name</label>
                     <input 
                       value={newTemplate.name}
                       onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                       className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-[var(--color-pawtobooth-dark)]"
                       placeholder="e.g. Wedding Minimalist"
                       required
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">PNG Overlay URL</label>
                     <input 
                       value={newTemplate.image_url}
                       onChange={e => setNewTemplate({...newTemplate, image_url: e.target.value})}
                       className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none font-mono text-xs text-[var(--color-pawtobooth-dark)]"
                       placeholder="https://..."
                       required
                     />
                     <p className="text-[9px] text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-tighter pl-2">Use a transparent PNG for the photobooth frame.</p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-[var(--color-pawtobooth-dark)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-[#3E6B43] transition-colors"
                  >
                     <Save className="w-4 h-4" /> Create Template
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
}
