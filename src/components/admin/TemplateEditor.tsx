import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Type, Palette, Upload, Trash2, Plus, Minus, RotateCw, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { MaskShape, drawMaskPath } from '../../lib/canvas-shapes';

interface TemplateEditorProps {
  onClose: () => void;
  onSave: () => void;
  events: any[];
  initialTemplate?: any;
}

interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'timestamp';
  content: string; // text content or image URL
  x: number;
  y: number;
  scale: number;
  rotation: number;
  font?: string;
  color?: string;
}

export function TemplateEditor({ onClose, onSave, events, initialTemplate }: TemplateEditorProps) {
  // Project Config
  const [name, setName] = useState('New Frame Template');
  const [eventId, setEventId] = useState('');
  const [category, setCategory] = useState('General');
  const [slotCount, setSlotCount] = useState(3);
  
  // Background & Grid Settings
  const [bgColor, setBgColor] = useState('#ffccd5');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [gridMask, setGridMask] = useState<MaskShape>('square');
  const [frameColor, setFrameColor] = useState<string>('transparent');
  const [frameWidth, setFrameWidth] = useState<number>(0);

  // Elements
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.4);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string, startX: number, startY: number, elStartX: number, elStartY: number } | null>(null);

  // Initial Auto-scaling for Preview
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        // 1800 is the native height. We leave 100px padding.
        setPreviewScale(Math.min((height - 100) / 1800, 0.5));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Fetch initial template config if editing
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || 'Edited Template');
      setEventId(initialTemplate.event_id || '');
      setCategory(initialTemplate.category || 'General');
      setSlotCount(initialTemplate.slot_count || 3);
      
      if (initialTemplate.image_url) {
        const fetchConfig = async () => {
          try {
            const rawUrl = initialTemplate.image_url.split('?')[0];
            const jsonUrl = rawUrl.replace('.png', '.json');
            const res = await fetch(jsonUrl);
            if (res.ok) {
              const data = await res.json();
              setBgColor(data.bgColor || '#ffccd5');
              if (data.bgImage) setBgImage(data.bgImage);
              setGridMask(data.gridMask || 'square');
              setFrameColor(data.frameColor || 'transparent');
              setFrameWidth(data.frameWidth || 0);
              setElements(data.elements || []);
            }
          } catch (e) {
            console.error("No json config found, could not restore full state", e);
          }
        };
        fetchConfig();
      }
    }
  }, [initialTemplate]);

  // Render Background and Holes to Canvas
  useEffect(() => {
    const drawBgAndSlots = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 1200;
      const h = 1800;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        await new Promise(r => img.onload = () => { ctx.drawImage(img, 0, 0, w, h); r(null); });
      }

      // Punch Slots
      const photoW = 504;
      const photoH = 504;
      const marginX = 64;
      const marginY = 30;
      const cols = 2;

      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < slotCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = marginX + col * (photoW + marginX);
        const y = marginY + row * (photoH + marginY);
        
        ctx.beginPath();
        drawMaskPath(ctx, gridMask, x, y, photoW, photoH);
        ctx.fill();
      }

      // Draw Frames over holes
      ctx.globalCompositeOperation = 'source-over';
      if (frameColor !== 'transparent' && frameWidth > 0) {
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = frameWidth;
        for (let i = 0; i < slotCount; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = marginX + col * (photoW + marginX);
          const y = marginY + row * (photoH + marginY);
          
          ctx.beginPath();
          drawMaskPath(ctx, gridMask, x, y, photoW, photoH);
          ctx.stroke();
        }
      }
    };
    drawBgAndSlots();
  }, [bgColor, bgImage, gridMask, slotCount, frameColor, frameWidth]);

  // Drag Handling
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setActiveElementId(id);
    const el = elements.find(e => e.id === id);
    if (el) {
      setDragInfo({ id, startX: e.clientX, startY: e.clientY, elStartX: el.x, elStartY: el.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo) return;
    const dx = (e.clientX - dragInfo.startX) / previewScale;
    const dy = (e.clientY - dragInfo.startY) / previewScale;
    
    setElements(elements.map(el => 
      el.id === dragInfo.id ? { ...el, x: dragInfo.elStartX + dx, y: dragInfo.elStartY + dy } : el
    ));
  };

  const updateActiveElement = (updates: Partial<EditorElement>) => {
    if (!activeElementId) return;
    setElements(elements.map(el => el.id === activeElementId ? { ...el, ...updates } : el));
  };

  // Element Adders
  const addText = () => {
    setElements([...elements, { id: Date.now().toString(), type: 'text', content: 'Double Click to Edit', x: 600, y: 1500, scale: 1, rotation: 0, font: 'sans-serif', color: '#000000' }]);
  };

  const addTimestamp = () => {
    const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setElements([...elements, { id: Date.now().toString(), type: 'timestamp', content: date, x: 600, y: 1650, scale: 0.5, rotation: 0, font: 'monospace', color: '#000000' }]);
  };

  const handleImageUpload = (type: 'bg' | 'image', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (prev) => {
      if (type === 'bg') setBgImage(prev.target?.result as string);
      else setElements([...elements, { id: Date.now().toString(), type: 'image', content: prev.target?.result as string, x: 600, y: 900, scale: 1, rotation: 0 }]);
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (emoji: string) => {
    setElements([...elements, { id: Date.now().toString(), type: 'sticker', content: emoji, x: 600, y: 900, scale: 2, rotation: 0 }]);
  };

  // Export
  const saveTemplate = async () => {
    if (!eventId) {
      alert("Please select a Booth to assign this template to.");
      return;
    }
    
    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1200;
      exportCanvas.height = 1800;
      const ctx = exportCanvas.getContext('2d')!;

      // 1. Draw Canvas Layer (Bg + Holes)
      ctx.drawImage(canvasRef.current!, 0, 0);

      // 2. Draw Elements Layer
      for (const el of elements) {
        if (el.type === 'timestamp') continue; // Do not bake live timestamp into the PNG

        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rotation * Math.PI / 180);
        ctx.scale(el.scale, el.scale);

        if (el.type === 'text' || el.type === 'sticker') {
          ctx.font = `bold 64px ${el.font || 'sans-serif'}`;
          if (el.color) ctx.fillStyle = el.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.content, 0, 0);
        } else if (el.type === 'image') {
          const img = new Image();
          img.src = el.content;
          await new Promise(r => img.onload = r);
          
          let drawW = img.width;
          let drawH = img.height;
          if (drawW > 500 || drawH > 500) {
             const ratio = Math.min(500 / drawW, 500 / drawH);
             drawW *= ratio;
             drawH *= ratio;
          }
          ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
        }
        ctx.restore();
      }

      // 3. Upload to Supabase Storage
      const blob = await new Promise<Blob>((resolve) => exportCanvas.toBlob(b => resolve(b!), 'image/png'));
      const fileName = `${Date.now()}-${name.replace(/ /g, '_')}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // Upload JSON config state
      const jsonFileName = fileName.replace('.png', '.json');
      const configBlob = new Blob([JSON.stringify({
        bgColor, bgImage, gridMask, frameColor, frameWidth, elements
      })], { type: 'application/json' });
      
      await supabase.storage.from('templates').upload(jsonFileName, configBlob);

      // Append timestamp config to URL if exists
      let finalUrl = publicUrl;
      const tsEl = elements.find(e => e.type === 'timestamp');
      if (tsEl) {
         const tsConfig = encodeURIComponent(JSON.stringify({ x: tsEl.x, y: tsEl.y, s: tsEl.scale, c: tsEl.color, f: tsEl.font, r: tsEl.rotation }));
         finalUrl += `?ts=${tsConfig}`;
      }

      // 4. Save to Database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const templateData = {
        name,
        user_id: user.id,
        event_id: eventId || null,
        image_url: finalUrl,
        category: category,
        slot_count: slotCount
      };

      let dbError;
      if (initialTemplate) {
        const { error } = await supabase.from('templates').update(templateData).eq('id', initialTemplate.id);
        dbError = error;
      } else {
        const { error } = await supabase.from('templates').insert(templateData);
        dbError = error;
      }

      if (dbError) throw dbError;
      
      onSave();
    } catch (e: any) {
      alert(`Error saving template: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeElement = elements.find(e => e.id === activeElementId);

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col lg:flex-row animate-in fade-in duration-500">
      {/* Editor Sidebar */}
      <div className="w-full lg:w-[450px] bg-[var(--color-pawtobooth-light)] border-r border-black/5 flex flex-col h-full shadow-2xl z-20 overflow-hidden">
         <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]">Template <span className="text-[#3E6B43]">Studio</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--color-pawtobooth-dark)]/60"><X className="w-5 h-5"/></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            
            {/* Properties */}
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block">Project Info</label>
               <input 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 placeholder="Template Name"
                 className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-[var(--color-pawtobooth-dark)] shadow-sm font-bold"
               />
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <select value={eventId} onChange={e => setEventId(e.target.value)} className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-xs shadow-sm">
                     <option value="">Select Booth...</option>
                     {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <select value={slotCount} onChange={e => setSlotCount(parseInt(e.target.value))} className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none text-xs shadow-sm font-bold">
                      <option value={3}>3 Slots</option>
                      <option value={4}>4 Slots</option>
                      <option value={6}>6 Slots</option>
                   </select>
                 </div>
               </div>
            </div>

            <hr className="border-black/5" />

            {/* Grid Mask & Background */}
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Layers className="w-3 h-3"/> Layout & Background</label>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 pl-2">Grid Shape</span>
                   <select value={gridMask} onChange={e => setGridMask(e.target.value as MaskShape)} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs shadow-sm font-bold outline-none">
                      <option value="square">Square</option>
                      <option value="circle">Circle</option>
                      <option value="heart">Love / Heart</option>
                      <option value="arch">Arch Window</option>
                      <option value="flower">Flower</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 pl-2">Frame Line</span>
                   <select value={frameWidth} onChange={e => setFrameWidth(parseInt(e.target.value))} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs shadow-sm font-bold outline-none">
                      <option value={0}>No Frame</option>
                      <option value={4}>Thin Frame</option>
                      <option value={12}>Thick Frame</option>
                      <option value={24}>Bold Frame</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[8px] text-[var(--color-pawtobooth-dark)]/40 uppercase font-bold">BG Color</p>
                     <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg border border-black/5" />
                  </div>
                  {frameWidth > 0 && (
                  <div className="space-y-1">
                     <p className="text-[8px] text-[var(--color-pawtobooth-dark)]/40 uppercase font-bold">Frame Color</p>
                     <input type="color" value={frameColor === 'transparent' ? '#ffffff' : frameColor} onChange={e => setFrameColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg border border-black/5" />
                  </div>
                  )}
               </div>

               <div className="flex gap-2">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/5 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#3E6B43] hover:text-white transition-all">
                    <Upload className="w-3 h-3" /> {bgImage ? 'Change BG Image' : 'Upload Pattern/BG'}
                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={e => handleImageUpload('bg', e)} />
                 </label>
                 {bgImage && <button onClick={() => setBgImage(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>}
               </div>
            </div>

            <hr className="border-black/5" />

            {/* Elements Adder */}
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Plus className="w-3 h-3"/> Add Elements</label>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={addText} className="py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5"><Type className="w-3 h-3 inline mr-2"/> Text</button>
                  <button onClick={addTimestamp} className="py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5">Time Stamp</button>
                  <label className="py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 text-center cursor-pointer">
                    <ImageIcon className="w-3 h-3 inline mr-2"/> Watermark/Logo
                    <input type="file" className="hidden" accept="image/png" onChange={e => handleImageUpload('image', e)} />
                  </label>
               </div>
               
               <div className="flex gap-2 flex-wrap bg-white p-3 rounded-xl border border-black/5">
                 <span className="text-[10px] font-bold opacity-40 uppercase w-full mb-1">Quick Stickers</span>
                  {['❤️', '✨', '🌸', '🥳', '🎁', '⭐', '💍', '🥂'].map(s => (
                    <button key={s} onClick={() => addSticker(s)} className="w-8 h-8 rounded hover:bg-black/5 text-xl">{s}</button>
                  ))}
                 <label className="w-full mt-2 py-2 bg-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 text-center cursor-pointer">
                   <Upload className="w-3 h-3 inline mr-2"/> Custom Sticker
                   <input type="file" className="hidden" accept="image/png" onChange={e => handleImageUpload('sticker' as any, e)} />
                 </label>
               </div>
            </div>

            {/* Active Element Tools */}
            {activeElement && (
              <div className="space-y-4 p-4 bg-[#3E6B43]/5 border border-[#3E6B43]/20 rounded-2xl animate-in slide-in-from-bottom-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-[#3E6B43] uppercase tracking-widest">Active Element</label>
                    <div className="flex gap-2">
                      <button onClick={() => setElements([...elements, { ...activeElement, id: Date.now().toString(), x: activeElement.x + 20, y: activeElement.y + 20 }])} className="text-[#3E6B43] hover:scale-110 px-1 font-bold text-xs">DUP</button>
                      <button onClick={() => setElements(elements.filter(e => e.id !== activeElementId))} className="text-red-500 hover:scale-110"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 </div>
                 
                 {(activeElement.type === 'text' || activeElement.type === 'timestamp') && (
                    <div className="space-y-3">
                       <input 
                         value={activeElement.content}
                         onChange={e => updateActiveElement({ content: e.target.value })}
                         className="w-full bg-white border border-[#3E6B43]/20 p-3 rounded-lg text-sm outline-none"
                       />
                       <div className="flex gap-2">
                         <input type="color" value={activeElement.color} onChange={e => updateActiveElement({ color: e.target.value })} className="w-10 h-10 bg-white rounded-lg border border-[#3E6B43]/20 cursor-pointer" />
                         <select value={activeElement.font} onChange={e => updateActiveElement({ font: e.target.value })} className="flex-1 bg-white border border-[#3E6B43]/20 rounded-lg text-xs px-2 outline-none">
                            <option value="sans-serif">Modern Sans</option>
                            <option value="serif">Classic Serif</option>
                            <option value="monospace">Mono Station</option>
                            <option value="'Comic Sans MS', cursive">Doodle</option>
                         </select>
                       </div>
                    </div>
                 )}

                 <div className="flex items-center justify-between gap-2 pt-2">
                    <button onClick={() => updateActiveElement({ scale: activeElement.scale * 1.1 })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-[#3E6B43] hover:text-white transition-colors flex-1 flex justify-center"><Plus className="w-4 h-4"/></button>
                    <button onClick={() => updateActiveElement({ scale: activeElement.scale * 0.9 })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-[#3E6B43] hover:text-white transition-colors flex-1 flex justify-center"><Minus className="w-4 h-4"/></button>
                    <button onClick={() => updateActiveElement({ rotation: activeElement.rotation + 15 })} className="p-2 bg-white rounded-lg shadow-sm hover:bg-[#3E6B43] hover:text-white transition-colors flex-1 flex justify-center"><RotateCw className="w-4 h-4"/></button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Main Preview Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[var(--color-pawtobooth-beige)] flex flex-col items-center justify-center relative overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragInfo(null)}
        onPointerLeave={() => setDragInfo(null)}
        onPointerDown={() => setActiveElementId(null)}
      >
         <div className="absolute top-8 left-8 flex items-center gap-3 z-50">
            <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-widest">Wysiwyg Drag & Drop Editor</span>
         </div>

         <div className="absolute top-8 right-8 z-50">
            <button 
              onClick={saveTemplate}
              disabled={isSaving}
              className="px-6 py-3 bg-[var(--color-pawtobooth-dark)] text-[var(--color-pawtobooth-beige)] font-black uppercase text-xs tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-[#3E6B43] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
               {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
               Deploy Design
            </button>
         </div>

         {/* The 1200x1800 Canvas Container */}
         <div 
           className="absolute top-1/2 left-1/2 bg-white shadow-2xl transition-transform ease-out duration-100"
           style={{ 
             width: 1200, 
             height: 1800, 
             transform: `translate(-50%, -50%) scale(${previewScale})`,
             cursor: dragInfo ? 'grabbing' : 'default'
           }}
         >
            {/* Base Layer: Background + Masks + Frames rendered via Canvas */}
            <canvas ref={canvasRef} width={1200} height={1800} className="absolute inset-0 pointer-events-none" />

            {/* Visual Helper: Grid Background showing through the transparent holes */}
            <div className="absolute inset-0 -z-10 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

            {/* Elements Layer: DOM overlays */}
            {elements.map(el => (
              <div 
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el.id)}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                  cursor: activeElementId === el.id ? 'move' : 'pointer',
                  border: activeElementId === el.id ? '4px dashed rgba(62,107,67,0.5)' : 'none',
                  padding: activeElementId === el.id ? '10px' : '0',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
              >
                {(el.type === 'text' || el.type === 'timestamp') && (
                   <span style={{ fontFamily: el.font, fontSize: '64px', color: el.color, fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                     {el.content}
                   </span>
                )}
                {el.type === 'image' && (
                   <img src={el.content} style={{ maxWidth: '500px', maxHeight: '500px', pointerEvents: 'none' }} />
                )}
                {el.type === 'sticker' && (
                   <span style={{ fontSize: '64px', pointerEvents: 'none', lineHeight: 1 }}>{el.content}</span>
                )}
                
                {/* On-Element Transform Controls */}
                {activeElementId === el.id && (
                  <div 
                    className="absolute -bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-white p-2 shadow-2xl"
                    style={{ pointerEvents: 'auto', transform: `scale(${1/Math.max(0.1, el.scale)})` }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button onClick={(e) => { e.stopPropagation(); updateActiveElement({ scale: el.scale * 1.1 }) }} className="rounded-lg bg-black/5 p-3 hover:bg-[#3E6B43] hover:text-white"><Plus className="h-6 w-6"/></button>
                    <button onClick={(e) => { e.stopPropagation(); updateActiveElement({ scale: el.scale * 0.9 }) }} className="rounded-lg bg-black/5 p-3 hover:bg-[#3E6B43] hover:text-white"><Minus className="h-6 w-6"/></button>
                    <button onClick={(e) => { e.stopPropagation(); updateActiveElement({ rotation: el.rotation + 15 }) }} className="rounded-lg bg-black/5 p-3 hover:bg-[#3E6B43] hover:text-white"><RotateCw className="h-6 w-6"/></button>
                  </div>
                )}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
