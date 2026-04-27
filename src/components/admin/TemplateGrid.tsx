import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, X, Save, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TemplateEditor } from './TemplateEditor';
import { cn } from '../../lib/utils';

export function TemplateGrid() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', image_url: '', event_id: '', category: 'General' });
  const [activeCategory, setActiveCategory] = useState<string>('All');

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

    const { data: templatesData } = await supabase
      .from('templates')
      .select('*, events(name)')
      .eq('user_id', user.id);
    
    setTemplates(templatesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const templateToInsert = {
      ...newTemplate,
      user_id: user.id,
      event_id: newTemplate.event_id || null
    };

    const { error } = await supabase.from('templates').insert(templateToInsert);
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setNewTemplate({ name: '', image_url: '', event_id: '', category: 'General' });
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
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">Template Library</h3>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Manage global and event-specific layouts</p>
          </div>
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

       {/* Category Tabs */}
       <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'General', 'Wedding', 'Doodle', 'Pink', 'Birthday', 'Corporate'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                activeCategory === cat 
                  ? "bg-[var(--color-pawtobooth-dark)] text-white border-[var(--color-pawtobooth-dark)] shadow-md" 
                  : "bg-white text-[var(--color-pawtobooth-dark)]/40 border-black/5 hover:border-black/20"
              )}
            >
              {cat}
            </button>
          ))}
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
             {templates
               .filter(t => activeCategory === 'All' || t.category === activeCategory)
               .map(t => (
               <div key={t.id} className="space-y-4 group">
                  <div className="aspect-[4/5] bg-white border border-black/5 rounded-[32px] overflow-hidden relative shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                     <img src={t.image_url} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end gap-4">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             <span className="px-2 py-0.5 rounded-md bg-white/20 text-[8px] font-black uppercase tracking-tighter text-white border border-white/20">{t.category || 'General'}</span>
                             <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{t.events?.name || 'Global Template'}</p>
                           </div>
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
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Assign to Booth (Optional)</label>
                         <select 
                           value={newTemplate.event_id}
                           onChange={e => setNewTemplate({...newTemplate, event_id: e.target.value})}
                           className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-sm text-[var(--color-pawtobooth-dark)]"
                         >
                            <option value="">Global Template</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Category</label>
                         <select 
                           value={newTemplate.category}
                           onChange={e => setNewTemplate({...newTemplate, category: e.target.value})}
                           className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-sm text-[var(--color-pawtobooth-dark)]"
                           required
                         >
                            <option value="General">General</option>
                            <option value="Wedding">Wedding</option>
                            <option value="Doodle">Doodle</option>
                            <option value="Pink">Pink</option>
                            <option value="Birthday">Birthday</option>
                            <option value="Corporate">Corporate</option>
                         </select>
                      </div>
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
