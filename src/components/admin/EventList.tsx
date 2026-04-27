import { Plus, Calendar, Clock, Camera, DollarSign, Settings, Trash2, X, Save, Globe, Copy, Check, Upload, ImageIcon, Sliders } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface EventListProps {
  userId: string;
  events: any[];
  onUpdate: () => void;
}

const parseFilters = (filterStr: string | undefined) => {
  const filters = { brightness: 100, contrast: 100, saturate: 100, sepia: 0 };
  if (!filterStr) return filters;
  
  const bMatch = filterStr.match(/brightness\((\d+)%\)/);
  if (bMatch) filters.brightness = parseInt(bMatch[1]);
  
  const cMatch = filterStr.match(/contrast\((\d+)%\)/);
  if (cMatch) filters.contrast = parseInt(cMatch[1]);
  
  const sMatch = filterStr.match(/saturate\((\d+)%\)/);
  if (sMatch) filters.saturate = parseInt(sMatch[1]);
  
  const sepMatch = filterStr.match(/sepia\((\d+)%\)/);
  if (sepMatch) filters.sepia = parseInt(sepMatch[1]);
  
  return filters;
};

const serializeFilters = (f: {brightness: number, contrast: number, saturate: number, sepia: number}) => {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%)`;
};

export function EventList({ userId, events, onUpdate }: EventListProps) {
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [cameraFilters, setCameraFilters] = useState({ brightness: 100, contrast: 100, saturate: 100, sepia: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEvent) return;
    setIsUploadingQris(true);
    try {
      // Local preview
      const reader = new FileReader();
      reader.onload = (ev) => setQrisPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `qris_${editingEvent.id || Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('qris')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('qris').getPublicUrl(fileName);
      setEditingEvent({ ...editingEvent, qris_image_url: publicUrl });
    } catch (err: any) {
      alert(`Failed to upload QRIS: ${err.message}`);
    } finally {
      setIsUploadingQris(false);
    }
  };

  const handleQrisDelete = async () => {
    if (!editingEvent?.qris_image_url) return;
    try {
      // Extract filename from the public URL
      const url = editingEvent.qris_image_url as string;
      const fileName = url.split('/qris/').pop();
      if (fileName) {
        const { error } = await supabase.storage.from('qris').remove([fileName]);
        if (error) console.warn('Storage delete warning:', error.message);
      }
    } catch (err) {
      console.warn('Could not delete from storage:', err);
    } finally {
      // Always clear state regardless of storage error
      setQrisPreview(null);
      setEditingEvent({ ...editingEvent, qris_image_url: '' });
    }
  };

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
      session_timeout: 10,
      qris_image_url: '',
      camera_filter: '',
      is_mirrored: true
    });
    setCameraFilters({ brightness: 100, contrast: 100, saturate: 100, sepia: 0 });
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
                    onClick={() => {
                      setEditingEvent(event);
                      setCameraFilters(parseFilters(event.camera_filter));
                    }}
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

                  <div className="space-y-3">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">QRIS Image</label>
                      
                      {/* Preview with action buttons */}
                      {(qrisPreview || editingEvent.qris_image_url) && (
                        <div className="space-y-3">
                          <div className="bg-white rounded-2xl p-3 aspect-square max-h-[200px] flex items-center justify-center overflow-hidden">
                            <img 
                              src={qrisPreview || editingEvent.qris_image_url} 
                              alt="QRIS Preview" 
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <label className={`flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition-all ${isUploadingQris ? 'opacity-50 pointer-events-none' : ''}`}>
                              {isUploadingQris ? (
                                <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {isUploadingQris ? 'Uploading...' : 'Replace'}
                              <input type="file" className="hidden" accept="image/*" onChange={handleQrisUpload} />
                            </label>
                            <button
                              type="button"
                              onClick={handleQrisDelete}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Upload Button — only when no image */}
                      {!qrisPreview && !editingEvent.qris_image_url && (
                        <label className={`flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all ${isUploadingQris ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingQris ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-neutral-600" />
                              <div className="text-center">
                                <p className="text-xs font-black uppercase text-neutral-400 tracking-widest">Upload QRIS</p>
                                <p className="text-[9px] font-mono text-neutral-600 mt-1">PNG, JPG up to 5MB</p>
                              </div>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleQrisUpload} />
                        </label>
                      )}

                      {isUploadingQris && (
                        <p className="text-[9px] font-mono text-neutral-500 text-center animate-pulse">Uploading...</p>
                      )}
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

                  <div className="pt-6 border-t border-white/10 space-y-6">
                     <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-blue-400" />
                        <h4 className="font-bold uppercase tracking-widest text-sm">Camera Configuration</h4>
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest pl-2">Mirror Camera</label>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Flip Horizontally</span>
                          <button 
                            type="button"
                            onClick={() => setEditingEvent({...editingEvent, is_mirrored: editingEvent.is_mirrored === false ? true : false})}
                            className={`w-10 h-5 rounded-full relative transition-colors ${editingEvent.is_mirrored !== false ? 'bg-blue-500' : 'bg-neutral-700'}`}
                          >
                             <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editingEvent.is_mirrored !== false ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                     </div>

                     <div className="space-y-4 p-6 bg-black/40 border border-white/5 rounded-2xl">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Live Filter Adjustments</label>
                        
                        {/* Brightness */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                             <span>Brightness</span>
                             <span>{cameraFilters.brightness}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="200" 
                            value={cameraFilters.brightness}
                            onChange={(e) => {
                              const newFilters = {...cameraFilters, brightness: parseInt(e.target.value)};
                              setCameraFilters(newFilters);
                              setEditingEvent({...editingEvent, camera_filter: serializeFilters(newFilters)});
                            }}
                            className="w-full accent-blue-500"
                          />
                        </div>

                        {/* Contrast */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                             <span>Contrast</span>
                             <span>{cameraFilters.contrast}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="200" 
                            value={cameraFilters.contrast}
                            onChange={(e) => {
                              const newFilters = {...cameraFilters, contrast: parseInt(e.target.value)};
                              setCameraFilters(newFilters);
                              setEditingEvent({...editingEvent, camera_filter: serializeFilters(newFilters)});
                            }}
                            className="w-full accent-blue-500"
                          />
                        </div>

                        {/* Saturation */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                             <span>Saturation</span>
                             <span>{cameraFilters.saturate}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="200" 
                            value={cameraFilters.saturate}
                            onChange={(e) => {
                              const newFilters = {...cameraFilters, saturate: parseInt(e.target.value)};
                              setCameraFilters(newFilters);
                              setEditingEvent({...editingEvent, camera_filter: serializeFilters(newFilters)});
                            }}
                            className="w-full accent-blue-500"
                          />
                        </div>

                        {/* Sepia */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase text-neutral-400">
                             <span>Vintage (Sepia)</span>
                             <span>{cameraFilters.sepia}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="100" 
                            value={cameraFilters.sepia}
                            onChange={(e) => {
                              const newFilters = {...cameraFilters, sepia: parseInt(e.target.value)};
                              setCameraFilters(newFilters);
                              setEditingEvent({...editingEvent, camera_filter: serializeFilters(newFilters)});
                            }}
                            className="w-full accent-blue-500"
                          />
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
