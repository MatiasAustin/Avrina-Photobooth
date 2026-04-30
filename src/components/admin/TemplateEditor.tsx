import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Type, Palette, Upload, Trash2, Plus, Minus, RotateCw, Layers, Move, Check, Type as FontIcon, Search, PlusCircle, Bookmark } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { MaskShape, drawMaskPath } from '../../lib/canvas-shapes';
import { ALL_GOOGLE_FONTS } from '../../lib/fonts';

const DEFAULT_FONTS = [
  'Inter', 'Playfair Display', 'Dancing Script', 'Montserrat', 'Pacifico', 
  'Bebas Neue', 'Lobster', 'Roboto', 'Outfit', 'Quicksand'
];

interface TemplateEditorProps {
  onClose: () => void;
  onSave: () => void;
  events: any[];
  initialTemplate?: any;
}

interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'timestamp';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  font?: string;
  color?: string;
  opacity?: number;
  blendMode?: string;
}

type TransformType = 'move' | 'scale' | 'rotate';
interface DragInfo {
  id: string;
  type: TransformType;
  startX: number;
  startY: number;
  elStartX: number;
  elStartY: number;
  elStartScale: number;
  elStartRot: number;
}

export function TemplateEditor({ onClose, onSave, events, initialTemplate }: TemplateEditorProps) {
  // Project Config
  const [name, setName] = useState('New Frame Template');
  const [eventId, setEventId] = useState('');
  const [category, setCategory] = useState('General');
  const [slotCount, setSlotCount] = useState(6);
  
  // Background & Grid Settings
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [gridMask, setGridMask] = useState<MaskShape>('square');
  const [frameColor, setFrameColor] = useState<string>('transparent');
  const [frameWidth, setFrameWidth] = useState<number>(0);

  // Elements
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  
  // Asset Library State
  const [bgAssets, setBgAssets] = useState<string[]>([]);
  const [elementAssets, setElementAssets] = useState<string[]>([]);
  const [showAssetLibrary, setShowAssetLibrary] = useState<{ show: boolean, mode: 'bg' | 'element' }>({ show: false, mode: 'bg' });
  const [allTemplates, setAllTemplates] = useState<any[]>([]);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.4);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplate?.id || null);

  // Font Browser State
  const [showFontBrowser, setShowFontBrowser] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [systemFonts, setSystemFonts] = useState<string[]>(() => {
    const saved = localStorage.getItem('pawtobooth_saved_fonts');
    return saved ? JSON.parse(saved) : DEFAULT_FONTS;
  });

  const injectFont = (font: string) => {
    if (!font) return;
    const linkId = `font-${font.replace(/ /g, '-')}`;
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
  };

  const addFontToSystem = (font: string) => {
    if (systemFonts.includes(font)) return;
    const newFonts = [...systemFonts, font];
    setSystemFonts(newFonts);
    localStorage.setItem('pawtobooth_saved_fonts', JSON.stringify(newFonts));
    injectFont(font);
  };

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  // Fetch Assets from existing templates
  const fetchAssets = async () => {
    const { data: templates } = await supabase.from('templates').select('*');
    if (!templates) return;
    setAllTemplates(templates);
    
    const bgs = new Set<string>();
    const els = new Set<string>();

    for (const t of templates) {
      try {
        const rawUrl = t.image_url.split('?')[0];
        const jsonUrl = rawUrl.replace('.png', '.json');
        const res = await fetch(jsonUrl);
        if (res.ok) {
          const config = await res.json();
          if (config.bgImage) bgs.add(config.bgImage);
          if (config.elements) {
            config.elements.forEach((el: any) => {
              if (el.type === 'image') els.add(el.content);
            });
          }
        }
      } catch (e) {}
    }
    setBgAssets(Array.from(bgs));
    setElementAssets(Array.from(els));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setPreviewScale(Math.min((height - 100) / 1800, 0.5));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || 'Edited Template');
      setEventId(initialTemplate.event_id || '');
      setCategory(initialTemplate.category || 'General');
      setSlotCount(initialTemplate.slot_count || 6);
      
      if (initialTemplate.image_url) {
        const fetchConfig = async () => {
          try {
            const rawUrl = initialTemplate.image_url.split('?')[0];
            const jsonUrl = rawUrl.replace('.png', '.json');
            const res = await fetch(jsonUrl);
            if (res.ok) {
              const data = await res.json();
              setBgColor(data.bgColor || '#ffffff');
              if (data.bgImage) setBgImage(data.bgImage);
              setGridMask(data.gridMask || 'square');
              setFrameColor(data.frameColor || 'transparent');
              setFrameWidth(data.frameWidth || 0);
              setElements(data.elements || []);
            }
          } catch (e) {}
        };
        fetchConfig();
      }
    }
  }, [initialTemplate]);
  const loadFont = async (font: string) => {
    try {
      await document.fonts.load(`bold 64px "${font}"`);
      // Force redraw
      setElements([...elements]);
    } catch (e) {}
  };

  // Ensure fonts are loaded
  useEffect(() => {
    const loadFonts = async () => {
      const fontsToLoad = elements
        .filter(el => el.type === 'text' || el.type === 'timestamp')
        .map(el => el.font)
        .filter(Boolean);
      
      for (const font of fontsToLoad) {
        if (font) {
          try {
            await document.fonts.load(`bold 64px "${font}"`);
          } catch (e) {
            console.warn(`Font failed to load: ${font}`);
          }
        }
      }
    };
    loadFonts().then(() => {
      // Trigger redraw
      setElements([...elements]);
    });
  }, [activeElementId]); // Redraw when something changes

  useEffect(() => {
    const drawBgAndSlots = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 1200;
      const h = 1800;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        await new Promise(r => img.onload = () => { ctx.drawImage(img, 0, 0, w, h); r(null); });
      }

      const photoW = 504;
      const photoH = 504;
      const cols = 2;

      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < slotCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col === 0 ? 48 : 648;
        
        let y = 0;
        let currentPhotoH = photoH;

        if (slotCount === 6) {
           y = [32, 568, 1104][row];
        } else if (slotCount === 8) {
           currentPhotoH = 378; // 4:3 Landscape
           y = [32, 442, 852, 1262][row];
        } else {
           y = [120, 744][row];
        }
        
        ctx.beginPath();
        drawMaskPath(ctx, gridMask, x, y, photoW, currentPhotoH);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      if (frameColor !== 'transparent' && frameWidth > 0) {
        ctx.strokeStyle = frameColor;
        ctx.lineWidth = frameWidth;
        for (let i = 0; i < slotCount; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col === 0 ? 48 : 648;
          let y = 0;
          let currentPhotoH = photoH;

          if (slotCount === 6) {
             y = [32, 568, 1104][row];
          } else if (slotCount === 8) {
             currentPhotoH = 378;
             y = [32, 442, 852, 1262][row];
          } else {
             y = [120, 744][row];
          }
          ctx.beginPath();
          drawMaskPath(ctx, gridMask, x, y, photoW, currentPhotoH);
          ctx.stroke();
        }
      }
    };
    drawBgAndSlots();
  }, [bgColor, bgImage, gridMask, slotCount, frameColor, frameWidth]);

  const handlePointerDown = (e: React.PointerEvent, id: string, type: TransformType = 'move') => {
    e.stopPropagation();
    setActiveElementId(id);
    const el = elements.find(e => e.id === id);
    if (el) {
      setDragInfo({ 
        id, type, startX: e.clientX, startY: e.clientY, 
        elStartX: el.x, elStartY: el.y, elStartScale: el.scale, elStartRot: el.rotation 
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo) return;
    if (dragInfo.type === 'move') {
      const dx = (e.clientX - dragInfo.startX) / previewScale;
      const dy = (e.clientY - dragInfo.startY) / previewScale;
      updateActiveElement({ x: dragInfo.elStartX + dx, y: dragInfo.elStartY + dy });
    } else if (dragInfo.type === 'scale') {
      const dx = (e.clientX - dragInfo.startX) / previewScale;
      const scaleChange = 1 + (dx / 200); 
      updateActiveElement({ scale: Math.max(0.1, dragInfo.elStartScale * scaleChange) });
    } else if (dragInfo.type === 'rotate') {
      const dx = (e.clientX - dragInfo.startX);
      const dy = (e.clientY - dragInfo.startY);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      updateActiveElement({ rotation: dragInfo.elStartRot + angle });
    }
  };

  const updateActiveElement = (updates: Partial<EditorElement>) => {
    if (!activeElementId) return;
    setElements(elements.map(el => el.id === activeElementId ? { ...el, ...updates } : el));
  };

  const addText = () => {
    setElements([...elements, { id: Date.now().toString(), type: 'text', content: 'Double Click to Edit', x: 600, y: 1500, scale: 1, rotation: 0, font: 'sans-serif', color: '#000000', opacity: 1, blendMode: 'source-over' }]);
  };

  const addTimestamp = () => {
    const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setElements([...elements, { id: Date.now().toString(), type: 'timestamp', content: date, x: 600, y: 1650, scale: 0.5, rotation: 0, font: 'monospace', color: '#000000', opacity: 1, blendMode: 'source-over' }]);
  };

  const handleImageUpload = (type: 'bg' | 'image', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (prev) => {
      const src = prev.target?.result as string;
      if (type === 'bg') {
        setBgColor('#ffffff');
        setBgImage(src);
        if (!bgAssets.includes(src)) setBgAssets(prev => [...prev, src]);
      } else {
        setElements([...elements, { id: Date.now().toString(), type: 'image', content: src, x: 600, y: 900, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' }]);
        if (!elementAssets.includes(src)) setElementAssets(prev => [...prev, src]);
      }
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (emoji: string) => {
    setElements([...elements, { id: Date.now().toString(), type: 'sticker', content: emoji, x: 600, y: 900, scale: 2, rotation: 0, opacity: 1, blendMode: 'source-over' }]);
  };

  const saveTemplate = async (shouldClose: boolean = true) => {
    setIsSaving(true);
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1200;
      exportCanvas.height = 1800;
      const ctx = exportCanvas.getContext('2d')!;

      ctx.drawImage(canvasRef.current!, 0, 0);

      for (const el of elements) {
        if (el.type === 'timestamp') continue;
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rotation * Math.PI / 180);
        ctx.scale(el.scale, el.scale);
        if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;
        if (el.blendMode) ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;

        if (el.type === 'text' || el.type === 'sticker') {
          ctx.font = `bold 64px ${el.font || 'sans-serif'}`;
          ctx.fillStyle = el.color || '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.content, 0, 0);
        } else if (el.type === 'image') {
          const img = new Image();
          img.src = el.content;
          await new Promise(r => img.onload = r);
          let drawW = img.width, drawH = img.height;
          if (drawW > 500 || drawH > 500) {
             const ratio = Math.min(500 / drawW, 500 / drawH);
             drawW *= ratio, drawH *= ratio;
          }
          ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
        }
        ctx.restore();
      }

      const blob = await new Promise<Blob>((resolve) => exportCanvas.toBlob(b => resolve(b!), 'image/png'));
      const fileName = `${Date.now()}-${name.replace(/ /g, '_')}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('templates').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(fileName);
      const jsonFileName = fileName.replace('.png', '.json');
      const configBlob = new Blob([JSON.stringify({ bgColor, bgImage, gridMask, frameColor, frameWidth, elements })], { type: 'application/json' });
      await supabase.storage.from('templates').upload(jsonFileName, configBlob);

      let finalUrl = publicUrl;
      const tsElements = elements.filter(e => e.type === 'timestamp');
      if (tsElements.length > 0) {
         const tsConfigs = tsElements.map(el => ({ x: el.x, y: el.y, s: el.scale, c: el.color, f: el.font, r: el.rotation }));
         finalUrl += `?ts=${encodeURIComponent(JSON.stringify(tsConfigs))}`;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const templateData = { 
        name, 
        user_id: user?.id, 
        event_id: eventId || null, 
        image_url: finalUrl, 
        category, 
        slot_count: slotCount,
        is_published: shouldClose // Assume if they publish, it's published
      };

      if (templateId) {
        await supabase.from('templates').update(templateData).eq('id', templateId);
      } else {
        const { data: newTemplate } = await supabase.from('templates').insert(templateData).select().single();
        if (newTemplate) setTemplateId(newTemplate.id);
      }
      
      setLastSaved(new Date().toLocaleTimeString());
      if (shouldClose) onSave();
    } catch (e: any) {
      alert(`Error saving: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeElement = elements.find(e => e.id === activeElementId);

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col lg:flex-row animate-in fade-in duration-500">
      <div className="w-full lg:w-[450px] bg-[var(--color-pawtobooth-light)] border-r border-black/5 flex flex-col h-full shadow-2xl z-20 overflow-hidden">
         <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]">Template <span className="text-[#3E6B43]">Studio</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--color-pawtobooth-dark)]/60"><X className="w-5 h-5"/></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block">Project Info</label>
               <input value={name} onChange={e => setName(e.target.value)} placeholder="Template Name" className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none shadow-sm font-bold" />
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[8px] font-bold uppercase opacity-30 pl-2">Assign Booth</p>
                    <select value={eventId} onChange={e => setEventId(e.target.value)} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs font-bold shadow-sm">
                      <option value="">Global (All Booths)</option>
                      {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-bold uppercase opacity-30 pl-2">Photo Slots</p>
                    <select value={slotCount} onChange={e => setSlotCount(parseInt(e.target.value))} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs font-bold shadow-sm">
                       <option value={4}>4 Slots (2x2 Square)</option>
                       <option value={6}>6 Slots (2x3 Square)</option>
                       <option value={8}>8 Slots (2x4 Landscape)</option>
                    </select>
                  </div>
               </div>
            </div>

            <hr className="border-black/5" />

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Layers className="w-3 h-3"/> Layout & Background</label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 pl-2">Grid Shape</span>
                    <select value={gridMask} onChange={e => setGridMask(e.target.value as MaskShape)} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs font-bold">
                       <option value="square">Square</option>
                       <option value="rounded-square">Rounded Square</option>
                       <option value="circle">Circle</option>
                       <option value="heart">Heart</option>
                       <option value="arch">Arch</option>
                       <option value="flower">Flower</option>
                       <option value="wave-square">Wave Square</option>
                       <option value="wave-circle">Wave Circle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 pl-2">Frame</span>
                    <select value={frameWidth} onChange={e => setFrameWidth(parseInt(e.target.value))} className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs font-bold">
                       <option value={0}>None</option>
                       <option value={4}>Thin</option>
                       <option value={12}>Bold</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-3">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/5 shadow-sm rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-[#3E6B43] hover:text-white transition-all">
                    <Upload className="w-3 h-3" /> Upload New Background
                    <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={e => handleImageUpload('bg', e)} />
                 </label>
                 <button 
                   onClick={() => setShowAssetLibrary({ show: true, mode: 'bg' })} 
                   className="w-full py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase hover:bg-black/5 shadow-sm transition-all text-[var(--color-pawtobooth-dark)]/60"
                 >
                   Browse Background Library ({bgAssets.length})
                 </button>
               </div>
            </div>

            <hr className="border-black/5" />

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Plus className="w-3 h-3"/> Add Elements</label>
               <div className="p-4 bg-blue-50 border border-blue-100 rounded-[24px] space-y-1">
                  <p className="text-[8px] font-black uppercase text-blue-600">Asset Guide</p>
                  <p className="text-[9px] text-blue-800/70 leading-tight">
                    • **Background**: 1200x1800 px recommended.<br/>
                    • **Element**: Resolution varies, ensure it's not too small to avoid blur.<br/>
                    • **Transparency**: Use PNG-24 for element transparency.
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={addText} className="py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase hover:bg-black/5 shadow-sm">Add Text</button>
                  <button onClick={addTimestamp} className="py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase hover:bg-black/5 shadow-sm">Add Time</button>
               </div>
               <div className="space-y-3">
                  <label className="w-full py-3 bg-white border border-black/5 rounded-xl text-[10px] font-bold uppercase hover:bg-black/5 text-center cursor-pointer shadow-sm block">
                    + Upload New Element/Logo
                    <input type="file" className="hidden" accept="image/png" onChange={e => handleImageUpload('image', e)} />
                  </label>
                  <button 
                    onClick={() => setShowAssetLibrary({ show: true, mode: 'element' })} 
                    className="w-full py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase hover:bg-black/5 shadow-sm transition-all text-[var(--color-pawtobooth-dark)]/60"
                  >
                    Browse Element Library ({elementAssets.length})
                  </button>
               </div>
            </div>

            {activeElement && (
              <div className="p-4 bg-[#3E6B43]/5 border border-[#3E6B43]/20 rounded-2xl space-y-4 animate-in slide-in-from-bottom-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-[#3E6B43] uppercase">Active Element</label>
                    <button onClick={() => setElements(elements.filter(e => e.id !== activeElementId))} className="text-red-500 hover:scale-110"><Trash2 className="w-4 h-4"/></button>
                 </div>
                 {(activeElement.type === 'text' || activeElement.type === 'timestamp') && (
                    <div className="space-y-3">
                       <input value={activeElement.content} onChange={e => updateActiveElement({ content: e.target.value })} className="w-full bg-white border border-[#3E6B43]/20 p-3 rounded-lg text-sm" />
                       <div className="flex gap-2">
                         <input type="color" value={activeElement.color} onChange={e => updateActiveElement({ color: e.target.value })} className="w-10 h-10 bg-white rounded-lg border border-[#3E6B43]/20 cursor-pointer" />
                         <select 
                           value={activeElement.font} 
                           onChange={e => { updateActiveElement({ font: e.target.value }); injectFont(e.target.value); loadFont(e.target.value); }} 
                           className="flex-1 bg-white border border-[#3E6B43]/20 rounded-lg text-xs px-2 outline-none font-bold"
                           style={{ fontFamily: activeElement.font }}
                         >
                             {systemFonts.map(f => (
                               <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                             ))}
                         </select>
                         <button 
                             onClick={() => setShowFontBrowser(true)}
                             className="p-2 bg-[#3E6B43]/10 text-[#3E6B43] rounded-lg hover:bg-[#3E6B43] hover:text-white transition-all"
                             title="Browse More Fonts"
                           >
                             <Search className="w-4 h-4" />
                           </button>
                       </div>
                    </div>
                 )}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[8px] font-bold uppercase opacity-40">Opacity</p>
                       <input type="range" min="0" max="1" step="0.01" value={activeElement.opacity ?? 1} onChange={e => updateActiveElement({ opacity: parseFloat(e.target.value) })} className="w-full accent-[#3E6B43]" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-bold uppercase opacity-40">Blend</p>
                       <select value={activeElement.blendMode || 'source-over'} onChange={e => updateActiveElement({ blendMode: e.target.value })} className="w-full bg-white border border-black/5 rounded-lg text-[10px] p-1 font-bold">
                          <option value="source-over">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="darken">Darken</option>
                          <option value="lighten">Lighten</option>
                          <option value="color-dodge">Color Dodge</option>
                          <option value="color-burn">Color Burn</option>
                          <option value="hard-light">Hard Light</option>
                          <option value="soft-light">Soft Light</option>
                          <option value="difference">Difference</option>
                          <option value="exclusion">Exclusion</option>
                       </select>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 bg-[var(--color-pawtobooth-beige)] flex flex-col items-center justify-center relative overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragInfo(null)}
        onPointerLeave={() => setDragInfo(null)}
        onPointerDown={() => setActiveElementId(null)}
      >
         <div className="absolute top-8 left-8 flex items-center gap-4 z-50">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
               <span className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-widest font-black">Live Editor</span>
            </div>
            {lastSaved && (
               <span className="text-[10px] font-mono text-[#3E6B43]/60 bg-[#3E6B43]/5 px-3 py-1 rounded-full flex items-center gap-2 border border-[#3E6B43]/10">
                  <Check className="w-3 h-3" /> Draft Saved: {lastSaved}
               </span>
            )}
         </div>

         <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
            <button 
              onClick={() => saveTemplate(false)} 
              disabled={isSaving} 
              className="px-6 py-4 bg-white border border-black/5 text-[var(--color-pawtobooth-dark)] font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-black/5 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
               Save Draft
            </button>
            <button 
              onClick={() => saveTemplate(true)} 
              disabled={isSaving} 
              className="px-8 py-4 bg-[var(--color-pawtobooth-dark)] text-white font-black uppercase text-xs tracking-widest rounded-xl flex items-center gap-3 shadow-2xl disabled:opacity-50 hover:bg-[#3E6B43] active:scale-95 transition-all"
            >
               {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish & Exit
            </button>
         </div>

         <div 
           className="absolute top-1/2 left-1/2 bg-white shadow-2xl transition-transform"
           style={{ width: 1200, height: 1800, transform: `translate(-50%, -50%) scale(${previewScale})` }}
         >
            <canvas ref={canvasRef} width={1200} height={1800} className="absolute inset-0 pointer-events-none" />
            {elements.map(el => (
               <div key={el.id} onPointerDown={(e) => handlePointerDown(e, el.id)}
                 style={{
                   position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                   cursor: 'move', border: activeElementId === el.id ? '2px solid #3E6B43' : 'none', padding: '10px',
                   opacity: el.opacity ?? 1, mixBlendMode: el.blendMode as any
                 }}
               >
                  {el.type === 'image' ? <img src={el.content} style={{ maxWidth: '500px', maxHeight: '500px' }} /> : 
                   <span style={{ fontFamily: el.font, fontSize: '64px', color: el.color, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{el.content}</span>}
                  
                  {activeElementId === el.id && (
                    <>
                      <div onPointerDown={(e) => handlePointerDown(e, el.id, 'scale')} className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-[#3E6B43] rounded-full cursor-nesw-resize shadow-lg" />
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div onPointerDown={(e) => handlePointerDown(e, el.id, 'rotate')} className="w-10 h-10 bg-white border-2 border-[#3E6B43] rounded-full flex items-center justify-center cursor-grab shadow-lg">
                           <RotateCw className="w-5 h-5 text-[#3E6B43]" />
                        </div>
                      </div>
                    </>
                  )}
               </div>
            ))}
         </div>
      </div>

      {showAssetLibrary.show && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-12 bg-black/60 backdrop-blur-md">
           <div className="w-full max-w-4xl bg-white rounded-[50px] p-12 space-y-8 shadow-2xl relative">
              <button onClick={() => setShowAssetLibrary({ ...showAssetLibrary, show: false })} className="absolute top-8 right-8 p-3 hover:bg-black/5 rounded-full"><X /></button>
              <div className="space-y-1">
                 <h3 className="text-2xl font-black uppercase tracking-tight">{showAssetLibrary.mode === 'bg' ? 'Background' : 'Element'} Library</h3>
                 <p className="text-xs font-mono uppercase opacity-30 tracking-widest">Select from previously uploaded {showAssetLibrary.mode === 'bg' ? 'backgrounds' : 'elements'}</p>
              </div>
              <div className="grid grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto pr-4">
                 {(showAssetLibrary.mode === 'bg' ? bgAssets : elementAssets).map(url => {
                    const isUsed = allTemplates.some(t => t.image_url?.includes(url));
                    return (
                      <div key={url} className="group relative aspect-square bg-neutral-100 rounded-3xl overflow-hidden border-2 border-transparent hover:border-[#3E6B43]">
                         <img src={url} className="w-full h-full object-contain p-2" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button onClick={() => { 
                               if (showAssetLibrary.mode === 'element') {
                                 setElements([...elements, { id: Date.now().toString(), type: 'image', content: url, x: 600, y: 900, scale: 1, rotation: 0, opacity: 1, blendMode: 'source-over' }]);
                               } else {
                                 setBgColor('#ffffff'), setBgImage(url);
                               }
                               setShowAssetLibrary({ ...showAssetLibrary, show: false });
                            }} className="p-3 bg-white text-[#3E6B43] rounded-xl hover:scale-110 transition-transform"><Check /></button>
                            <button onClick={async () => {
                               if (isUsed) return alert("Cannot delete: Asset is still used in templates.");
                               if (!confirm("Delete asset from library?")) return;
                               if (showAssetLibrary.mode === 'bg') setBgAssets(prev => prev.filter(a => a !== url));
                               else setElementAssets(prev => prev.filter(a => a !== url));
                            }} className={cn("p-3 bg-white text-red-500 rounded-xl hover:scale-110", isUsed && "opacity-20")}>
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    );
                 })}
                 {(showAssetLibrary.mode === 'bg' ? bgAssets : elementAssets).length === 0 && <p className="col-span-4 text-center py-20 text-black/20 font-bold uppercase italic">No assets found</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
