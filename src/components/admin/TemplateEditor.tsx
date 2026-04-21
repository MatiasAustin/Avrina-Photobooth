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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate Preview
  useEffect(() => {
    const drawPreview = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 600;
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

      // 2. Draw Sample Photo Slots (for preview only)
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      const margin = 40;
      const photoH = (h - (margin * 5)) / 4.5;
      const photoW = w - (margin * 2);

      for (let i = 0; i < 4; i++) {
        const y = margin + i * (photoH + margin);
        ctx.fillRect(margin, y, photoW, photoH);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, y, photoW, photoH);
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = 'italic 20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`Photo ${i+1} Area`, w/2, y + photoH/2);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
      }

      // 3. Footer Area
      const footerY = h - photoH - margin;
      
      // Logo
      if (logo) {
         const logoImg = new Image();
         logoImg.src = logo;
         await new Promise((resolve) => {
            logoImg.onload = () => {
               const logoSize = 120;
               ctx.drawImage(logoImg, w/2 - logoSize/2, footerY + 40, logoSize, logoSize);
               resolve(null);
            };
            logoImg.onerror = resolve;
         });
      }

      // Text
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      
      ctx.font = `bold 42px ${fontFamily}`;
      ctx.fillText(heading, w/2, h - 140);
      
      ctx.font = `24px ${fontFamily}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(subheading, w/2, h - 90);
      ctx.globalAlpha = 1.0;
    };

    drawPreview();
  }, [bgColor, textColor, heading, subheading, logo, bgImage, fontFamily]);

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
      exportCanvas.width = 600;
      exportCanvas.height = 1800;

      // Draw everything EXCEPT the photo slots (they must be transparent)
      exCtx.fillStyle = bgColor;
      exCtx.fillRect(0, 0, 600, 1800);
      
      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        await new Promise(r => img.onload = () => { exCtx.drawImage(img, 0, 0, 600, 1800); r(null); });
      }

      // Clear Photo Slots to transparent
      const margin = 40;
      const photoH = (1800 - (margin * 5)) / 4.5;
      const photoW = 600 - (margin * 2);
      exCtx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 4; i++) {
        const y = margin + i * (photoH + margin);
        exCtx.fillRect(margin, y, photoW, photoH);
      }
      exCtx.globalCompositeOperation = 'source-over';

      // Footer Assets
      if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        await new Promise(r => logoImg.onload = () => { exCtx.drawImage(logoImg, 600/2 - 60, 1800 - photoH - 40 + 40, 120, 120); r(null); });
      }

      exCtx.fillStyle = textColor;
      exCtx.textAlign = 'center';
      exCtx.font = `bold 42px ${fontFamily}`;
      exCtx.fillText(heading, 600/2, 1800 - 140);
      exCtx.font = `24px ${fontFamily}`;
      exCtx.globalAlpha = 0.6;
      exCtx.fillText(subheading, 600/2, 1800 - 90);

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
      const { error: dbError } = await supabase.from('templates').insert({
        name,
        event_id: eventId,
        image_url: publicUrl
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
    <div className="fixed inset-0 z-[120] bg-black flex flex-col lg:flex-row animate-in fade-in duration-500">
      {/* Editor Sidebar */}
      <div className="w-full lg:w-96 bg-neutral-900 border-r border-white/5 flex flex-col h-full">
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Design <span className="text-white/20">Studio</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
               <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Project Info</label>
               <input 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 placeholder="Template Name"
                 className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 transition-colors"
               />
               <select 
                 value={eventId}
                 onChange={e => setEventId(e.target.value)}
                 className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 transition-colors text-sm"
               >
                 <option value="">Assign to Booth...</option>
                 {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
               </select>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-2"><Palette className="w-3 h-3"/> Colors & Background</label>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[8px] text-neutral-600 uppercase font-bold">Paper Color</p>
                     <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] text-neutral-600 uppercase font-bold">Text Color</p>
                     <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded-lg" />
                  </div>
               </div>
               <div className="flex gap-2">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition-all">
                    <ImageIcon className="w-3 h-3" /> {bgImage ? 'Change BG' : 'Upload BG'}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload('bg', e)} />
                 </label>
                 {bgImage && <button onClick={() => setBgImage(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>}
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-2"><Type className="w-3 h-3"/> Typography</label>
               <select 
                 value={fontFamily}
                 onChange={e => setFontFamily(e.target.value)}
                 className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-xs uppercase font-bold tracking-widest"
               >
                 <option value="sans-serif">Modern Sans</option>
                 <option value="serif">Classic Serif</option>
                 <option value="monospace">Mono Station</option>
               </select>
               <input 
                 value={heading}
                 onChange={e => setHeading(e.target.value)}
                 placeholder="Main Heading"
                 className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 transition-colors"
               />
               <input 
                 value={subheading}
                 onChange={e => setSubheading(e.target.value)}
                 placeholder="Subheading / Date"
                 className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-white/20 transition-colors"
               />
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Branding</label>
               <div className="flex gap-2">
                 <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition-all">
                    <Upload className="w-3 h-3" /> {logo ? 'Change Logo' : 'Upload PNG Logo'}
                    <input type="file" className="hidden" accept="image/png" onChange={e => handleFileUpload('logo', e)} />
                 </label>
                 {logo && <button onClick={() => setLogo(null)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>}
               </div>
            </div>
         </div>

         <div className="p-6 border-t border-white/5">
            <button 
              onClick={saveTemplate}
              disabled={isSaving}
              className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
               {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-black/20 border-t-black rounded-full" /> : <Save className="w-4 h-4" />}
               Deploy Design
            </button>
         </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-12 relative overflow-hidden">
         <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Wysiwyg Engine Active</span>
         </div>

         <div className="relative shadow-[0_0_100px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden animate-in zoom-in duration-700">
            <canvas 
              ref={canvasRef} 
              className="max-h-[85vh] w-auto bg-white rounded-sm shadow-2xl"
            />
         </div>

         <div className="mt-8 flex items-center gap-8">
            <div className="text-center">
               <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-[0.4em] mb-2">Target Dimensions</p>
               <p className="text-sm font-bold text-neutral-400">600 x 1800 <span className="text-neutral-700">(Standard 2x6)</span></p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
               <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-[0.4em] mb-2">Alpha Support</p>
               <p className="text-sm font-bold text-neutral-400">Full PNG Transparency</p>
            </div>
         </div>
      </div>
    </div>
  );
}
