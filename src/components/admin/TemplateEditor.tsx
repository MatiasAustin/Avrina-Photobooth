import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Type, Palette, Upload, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface TemplateEditorProps {
  onClose: () => void;
  onSave: () => void;
  events: any[];
}

export function TemplateEditor({ onClose, onSave, events }: TemplateEditorProps) {
  const [name, setName] = useState('New Custom Frame');
  const [eventId, setEventId] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [heading, setHeading] = useState('Wedding Celebration');
  const [subheading, setSubheading] = useState('April 21, 2026');
  const [logo, setLogo] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [stickers, setStickers] = useState<any[]>([]);
  const [category, setCategory] = useState('General');
  const [slotCount, setSlotCount] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate Preview
  useEffect(() => {
    const drawPreview = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 1200;
      const h = 1800;
      canvas.width = w;
      canvas.height = h;

      // 1. Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(null);
          };
          img.onerror = resolve;
        });
      }

      // 2. Draw Sample Photo Slots (Realistic Preview)
      const photoW = 504;
      const photoH = 504;
      const marginX = 64;
      const marginY = 30;
      const cols = 2;

      for (let i = 0; i < slotCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = marginX + col * (photoW + marginX);
        const y = marginY + row * (photoH + marginY);
        
        // Shadow for photos
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, photoW, photoH);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Photo Border
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, photoW, photoH);
      }

      // 3. Draw Stickers
      for (const sticker of stickers) {
        ctx.font = `${sticker.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.content, sticker.x, sticker.y);
      }

      // 4. Footer Area
      const footerY = 1800 - 300;
      
      // Logo
      if (logo) {
         const logoImg = new Image();
         logoImg.src = logo;
         await new Promise((resolve) => {
            logoImg.onload = () => {
               const logoSize = 240;
               ctx.drawImage(logoImg, w/2 - logoSize/2, footerY, logoSize, logoSize);
               resolve(null);
            };
            logoImg.onerror = resolve;
         });
      }

      // Text
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      ctx.font = `bold 84px ${fontFamily}`;
      ctx.fillText(heading, w/2, h - 160);
      
      ctx.font = `48px ${fontFamily}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(subheading, w/2, h - 100);
      ctx.globalAlpha = 1.0;
    };

    drawPreview();
  }, [bgColor, textColor, heading, subheading, logo, bgImage, fontFamily, stickers, slotCount]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scale = 1200 / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    // Find if we clicked on a sticker
    const hitIdx = stickers.findIndex(s => {
      const dist = Math.sqrt((s.x - x)**2 + (s.y - y)**2);
      return dist < s.size;
    });

    if (hitIdx !== -1) {
      setIsDragging(true);
      setDragTarget(hitIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || dragTarget === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 1200 / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    const newStickers = [...stickers];
    newStickers[dragTarget] = { ...newStickers[dragTarget], x, y };
    setStickers(newStickers);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  const addSticker = (content: string) => {
    setStickers([...stickers, { 
      id: Date.now().toString(), 
      content, 
      x: 600, 
      y: 1500, 
      size: 160 
    }]);
  };

  const handleFileUpload = (type: 'logo' | 'bg', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (prev) => {
        if (type === 'logo') setLogo(prev.target?.result as string);
        else setBgImage(prev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveTemplate = async () => {
    if (!eventId) {
      alert("Please select a Booth to assign this template to.");
      return;
    }
    
    setIsSaving(true);
    try {
      // 1. Generate High-Res PNG (Transparent Photo Areas)
      const exportCanvas = document.createElement('canvas');
      const exCtx = exportCanvas.getContext('2d')!;
      exportCanvas.width = 1200;
      exportCanvas.height = 1800;

      // Draw everything EXCEPT the photo slots (they must be transparent)
      exCtx.fillStyle = bgColor;
      exCtx.fillRect(0, 0, 1200, 1800);
      
      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        await new Promise(r => img.onload = () => { exCtx.drawImage(img, 0, 0, 1200, 1800); r(null); });
      }

      // Clear Photo Slots to transparent
      const photoW = 504;
      const photoH = 504;
      const marginX = 64;
      const marginY = 30;
      const cols = 2;

      exCtx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < slotCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = marginX + col * (photoW + marginX);
        const y = marginY + row * (photoH + marginY);
        exCtx.fillRect(x, y, photoW, photoH);
      }
      exCtx.globalCompositeOperation = 'source-over';

      // Stickers
      for (const sticker of stickers) {
        exCtx.font = `${sticker.size}px serif`;
        exCtx.textAlign = 'center';
        exCtx.textBaseline = 'middle';
        exCtx.fillText(sticker.content, sticker.x, sticker.y);
      }

      // Footer Assets
      if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        await new Promise(r => logoImg.onload = () => { exCtx.drawImage(logoImg, 1200/2 - 120, 1800 - 300, 240, 240); r(null); });
      }

      exCtx.fillStyle = textColor;
      exCtx.textAlign = 'center';
      exCtx.font = `bold 84px ${fontFamily}`;
      exCtx.fillText(heading, 1200/2, 1800 - 160);
      exCtx.font = `48px ${fontFamily}`;
      exCtx.globalAlpha = 0.6;
      exCtx.fillText(subheading, 1200/2, 1800 - 100);

      // 2. Upload to Supabase Storage
      const blob = await new Promise<Blob>((resolve) => exportCanvas.toBlob(b => resolve(b!), 'image/png'));
      const fileName = `${Date.now()}-${name.replace(/ /g, '_')}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // 3. Save to Database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const { error: dbError } = await supabase.from('templates').insert({
        name,
        user_id: user.id,
        event_id: eventId || null,
        image_url: publicUrl,
        category: category,
        slot_count: slotCount
      });

      if (dbError) throw dbError;
      
      onSave();
    } catch (e: any) {
      alert(`Error saving template: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col lg:flex-row animate-in fade-in duration-500">
      {/* Editor Sidebar */}
      <div className="w-full lg:w-96 bg-[var(--color-pawtobooth-light)] border-r border-black/5 flex flex-col h-full">
         <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--color-pawtobooth-dark)]">Design <span className="text-[#3E6B43]">Studio</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--color-pawtobooth-dark)]/60"><X className="w-5 h-5"/></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block">Project Info</label>
               <input 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 placeholder="Template Name"
                 className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-[var(--color-pawtobooth-dark)] shadow-sm"
               />
             <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Assign Booth</label>
                 <select 
                   value={eventId}
                   onChange={e => setEventId(e.target.value)}
                   className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-xs text-[var(--color-pawtobooth-dark)] shadow-sm"
                 >
                   <option value="">Global Template</option>
                   {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Category</label>
                 <select 
                   value={category}
                   onChange={e => setCategory(e.target.value)}
                   className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-xs text-[var(--color-pawtobooth-dark)] shadow-sm"
                 >
                    <option value="General">General</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Doodle">Doodle</option>
                    <option value="Pink">Pink</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-2">Photo Slots</label>
                 <select 
                   value={slotCount}
                   onChange={e => setSlotCount(parseInt(e.target.value))}
                   className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-xs text-[var(--color-pawtobooth-dark)] shadow-sm font-bold"
                 >
                    <option value={3}>3 Slots</option>
                    <option value={4}>4 Slots</option>
                    <option value={6}>6 Slots</option>
                 </select>
               </div>
             </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Palette className="w-3 h-3 text-[#3E6B43]"/> Colors & Background</label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[8px] text-[var(--color-pawtobooth-dark)]/40 uppercase font-bold">Paper Color</p>
                     <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg border border-black/5" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] text-[var(--color-pawtobooth-dark)]/40 uppercase font-bold">Text Color</p>
                     <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg border border-black/5" />
                  </div>
               </div>
               <div className="flex gap-2">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/5 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#3E6B43] hover:text-white hover:border-[#3E6B43] transition-all text-[var(--color-pawtobooth-dark)]">
                    <ImageIcon className="w-3 h-3" /> {bgImage ? 'Change BG' : 'Upload BG'}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload('bg', e)} />
                 </label>
                 {bgImage && <button onClick={() => setBgImage(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>}
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Type className="w-3 h-3 text-[#3E6B43]"/> Typography</label>
               <select 
                 value={fontFamily}
                 onChange={e => setFontFamily(e.target.value)}
                 className="w-full bg-white border border-black/5 p-4 rounded-xl text-xs uppercase font-bold tracking-widest text-[var(--color-pawtobooth-dark)] focus:border-[#3E6B43] outline-none shadow-sm"
               >
                 <option value="sans-serif">Modern Sans</option>
                 <option value="serif">Classic Serif</option>
                 <option value="monospace">Mono Station</option>
               </select>
               <input 
                 value={heading}
                 onChange={e => setHeading(e.target.value)}
                 placeholder="Main Heading"
                 className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-[var(--color-pawtobooth-dark)] shadow-sm"
               />
               <input 
                 value={subheading}
                 onChange={e => setSubheading(e.target.value)}
                 placeholder="Subheading / Date"
                 className="w-full bg-white border border-black/5 p-4 rounded-xl focus:border-[#3E6B43] outline-none transition-colors text-[var(--color-pawtobooth-dark)] shadow-sm"
               />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><Palette className="w-3 h-3 text-[#3E6B43]"/> Stickers & Props</label>
               <div className="grid grid-cols-4 gap-2">
                  {['❤️', '✨', '🌸', '🥳', '🎁', '⭐', '💍', '🥂'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => addSticker(s)}
                      className="aspect-square bg-white border border-black/5 shadow-sm rounded-xl flex items-center justify-center text-xl hover:bg-[#3E6B43] hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
               </div>
               <p className="text-[8px] text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-widest text-center mt-2">Tap to add, drag on canvas to position</p>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest block flex items-center gap-2"><ImageIcon className="w-3 h-3 text-[#3E6B43]"/> Branding</label>
               <div className="flex gap-2">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-black/5 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#3E6B43] hover:text-white transition-all text-[var(--color-pawtobooth-dark)]">
                    <Upload className="w-3 h-3" /> {logo ? 'Change Logo' : 'Upload PNG Logo'}
                    <input type="file" className="hidden" accept="image/png" onChange={e => handleFileUpload('logo', e)} />
                 </label>
                 {logo && <button onClick={() => setLogo(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>}
               </div>
            </div>
         </div>

         <div className="p-6 border-t border-black/5 bg-white">
            <button 
              onClick={saveTemplate}
              disabled={isSaving}
              className="w-full py-4 bg-[var(--color-pawtobooth-dark)] text-[var(--color-pawtobooth-beige)] font-black uppercase text-xs tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-[#3E6B43] active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
               {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
               Deploy Design
            </button>
         </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-[var(--color-pawtobooth-beige)] flex flex-col items-center justify-center p-12 relative overflow-hidden">
         <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className="w-2 h-2 bg-[#3E6B43] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-widest">Wysiwyg Engine Active</span>
         </div>

         <div className="relative shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in duration-700 border border-black/5">
            <canvas 
              ref={canvasRef} 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-h-[85vh] w-auto bg-white rounded-sm cursor-crosshair"
            />
         </div>

         <div className="mt-8 flex items-center gap-8">
            <div className="text-center">
               <p className="text-[8px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-[0.4em] mb-2">Target Dimensions</p>
               <p className="text-sm font-bold text-[var(--color-pawtobooth-dark)]">1200 x 1800 <span className="text-[var(--color-pawtobooth-dark)]/40">(Standard 4x6)</span></p>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <div className="text-center">
               <p className="text-[8px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-[0.4em] mb-2">Alpha Support</p>
               <p className="text-sm font-bold text-[var(--color-pawtobooth-dark)]">Full PNG Transparency</p>
            </div>
         </div>
      </div>
    </div>
  );
}
