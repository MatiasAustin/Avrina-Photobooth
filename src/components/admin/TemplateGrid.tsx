import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Image as ImageIcon, X, Save, Palette, Upload, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TemplateEditor } from './TemplateEditor';
import { cn } from '../../lib/utils';

export function TemplateGrid() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', image_url: '', event_id: '', category: 'General', slot_count: 3 });
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(['General', 'Wedding', 'Doodle', 'Pink', 'Birthday', 'Corporate']);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/ /g, '_')}`;
      const { data, error } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      setNewTemplate(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.image_url) {
      alert("Please upload a template overlay.");
      return;
    }

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
      setNewTemplate({ name: '', image_url: '', event_id: '', category: 'General', slot_count: 3 });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from('templates').delete().eq('id', id);
    fetchData();
  };

  const handleRenameCategory = async (oldName: string) => {
    const newName = prompt(`Rename category "${oldName}" to:`, oldName);
    if (!newName || newName === oldName) return;

    const { error } = await supabase
      .from('templates')
      .update({ category: newName })
      .eq('category', oldName)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) alert(error.message);
    else {
      setCustomCategories(prev => prev.map(c => c === oldName ? newName : c));
      fetchData();
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Delete category "${catName}"? All templates in this category will be moved to "General".`)) return;

    const { error } = await supabase
      .from('templates')
      .update({ category: 'General' })
      .eq('category', catName)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) alert(error.message);
    else {
      setCustomCategories(prev => prev.filter(c => c !== catName));
      fetchData();
    }
  };

  // Sync custom categories with what's in templates
  useEffect(() => {
    if (templates.length > 0) {
      const existing = Array.from(new Set(templates.map(t => t.category || 'General')));
      setCustomCategories(prev => {
        const combined = Array.from(new Set([...prev, ...existing]));
        return combined.filter(c => c !== 'All'); // Remove 'All' if it slipped in
      });
    }
  }, [templates]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">Template Library</h3>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/40">Manage global and event-specific layouts</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setEditingTemplate(null); setShowDesignStudio(true); }}
              className="bg-white border border-black/5 text-[var(--color-pawtobooth-dark)]/60 px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#3E6B43] hover:text-white hover:border-[#3E6B43] transition-all shadow-sm"
            >
              <Palette className="w-4 h-4" /> Design Studio
            </button>
            <button 
              onClick={() => setShowCategoryManager(true)}
              className="bg-white border border-black/5 text-[var(--color-pawtobooth-dark)]/60 px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black/5 transition-all shadow-sm"
            >
              Manage Categories
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
          {['All', ...customCategories].map(cat => (
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
           initialTemplate={editingTemplate}
           onClose={() => { setShowDesignStudio(false); setEditingTemplate(null); }}
           onSave={() => {
              setShowDesignStudio(false);
              setEditingTemplate(null);
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
                        <div className="flex gap-2">
                           <button 
                             onClick={() => { setEditingTemplate(t); setShowDesignStudio(true); }}
                             className="flex-1 py-2 bg-white/20 hover:bg-white/40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                           >
                              <Edit2 className="w-3 h-3" /> Edit
                           </button>
                           <button 
                             onClick={() => handleDelete(t.id)}
                             className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                           >
                              <Trash2 className="w-3 h-3" /> Delete
                           </button>
                        </div>
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
                            {customCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
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

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Photo Slots</label>
                         <select 
                           value={newTemplate.slot_count}
                           onChange={e => setNewTemplate({...newTemplate, slot_count: parseInt(e.target.value)})}
                           className="w-full bg-[var(--color-pawtobooth-light)] border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-sm text-[var(--color-pawtobooth-dark)] font-bold"
                         >
                            <option value={3}>3 Slots</option>
                            <option value={4}>4 Slots</option>
                            <option value={6}>6 Slots</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">PNG Overlay File</label>
                         <label className={cn(
                           "flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                           newTemplate.image_url 
                            ? "bg-[#3E6B43]/5 border-[#3E6B43] text-[#3E6B43]" 
                            : "bg-[var(--color-pawtobooth-light)] border-black/5 text-[var(--color-pawtobooth-dark)]/40 hover:border-black/20"
                         )}>
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                              {newTemplate.image_url ? 'Change File' : 'Choose PNG'}
                            </span>
                            <input type="file" className="hidden" accept="image/png" onChange={handleFileUpload} disabled={isUploading} />
                         </label>
                      </div>
                   </div>
                   {newTemplate.image_url && (
                     <div className="mt-2 text-center">
                        <p className="text-[8px] font-mono text-green-600 uppercase tracking-widest">✓ File Uploaded Successfully</p>
                     </div>
                   )}

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

        {showCategoryManager && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
             <div className="w-full max-w-md bg-white border border-black/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--color-pawtobooth-dark)]">Manage Categories</h3>
                   <button onClick={() => setShowCategoryManager(false)} className="p-2 hover:bg-black/5 rounded-full text-[var(--color-pawtobooth-dark)]/60">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-3">
                   {customCategories.map(cat => (
                     <div key={cat} className="flex items-center justify-between p-4 bg-[var(--color-pawtobooth-light)] rounded-2xl group border border-transparent hover:border-[#3E6B43]/20 transition-all">
                        <span className="font-bold text-sm text-[var(--color-pawtobooth-dark)]">{cat}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleRenameCategory(cat)}
                             className="p-2 bg-white text-[var(--color-pawtobooth-dark)] rounded-lg shadow-sm hover:text-[#3E6B43]"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           {cat !== 'General' && (
                             <button 
                               onClick={() => handleDeleteCategory(cat)}
                               className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                     </div>
                   ))}
                   <button 
                     onClick={() => {
                        const name = prompt("New Category Name:");
                        if (name) setCustomCategories(prev => [...new Set([...prev, name])]);
                     }}
                     className="w-full py-4 border-2 border-dashed border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/20 hover:border-[#3E6B43]/40 hover:text-[#3E6B43] transition-all"
                   >
                      + Add New Category
                   </button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
}
