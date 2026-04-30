import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Filter, FlipHorizontal2, Eye, EyeOff, X } from 'lucide-react';
import { PhotoTemplate } from '../../types';
import { cn } from '../../lib/utils';

const EFFECTS = [
  { label: 'Normal', value: '' },
  { label: 'B&W', value: 'grayscale(100%)' },
  { label: 'Sepia', value: 'sepia(80%)' },
  { label: 'Warm', value: 'sepia(30%) saturate(150%) hue-rotate(-10deg)' },
  { label: 'Cool', value: 'hue-rotate(30deg) saturate(80%)' },
  { label: 'Vivid', value: 'saturate(200%) contrast(110%)' },
  { label: 'Drama', value: 'contrast(140%) brightness(85%)' },
  { label: 'Soft', value: 'brightness(115%) contrast(85%)' },
];

interface TemplatePickerProps {
  templates: PhotoTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: PhotoTemplate) => void;
  onProceed: () => void;
  cameraStream?: MediaStream | null;
  cameraFilter: string;
  isMirrored: boolean;
  onFilterChange: (filter: string) => void;
  onMirrorToggle: () => void;
}

export function TemplatePicker({ 
  templates, selectedTemplateId, onSelect, onProceed,
  cameraStream, cameraFilter, isMirrored, onFilterChange, onMirrorToggle
}: TemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showPreview, setShowPreview] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (showPreview && previewVideoRef.current && cameraStream) {
      previewVideoRef.current.srcObject = cameraStream;
      previewVideoRef.current.play().catch(console.warn);
    }
  }, [cameraStream, showPreview]);

  const categories = ['All', ...new Set(templates.map(t => t.category || 'General'))];
  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => (t.category || 'General') === activeCategory);

  return (
    <motion.div 
      key="templates"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center p-4 pt-14"
    >
      <div className="w-full max-w-6xl bg-white/96 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-black/5 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="px-8 pt-7 pb-4 flex items-center justify-between shrink-0 border-b border-black/5">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)] italic leading-none">
              Choose Your <span className="text-[#3E6B43]">Frame</span>
            </h2>
            <p className="text-[var(--color-pawtobooth-dark)]/50 font-mono text-[10px] uppercase tracking-widest mt-1">Select a style for your session</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMirrorToggle}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2",
                isMirrored
                  ? "bg-[var(--color-pawtobooth-dark)] text-white border-[var(--color-pawtobooth-dark)]"
                  : "bg-white text-[var(--color-pawtobooth-dark)]/50 border-black/10 hover:border-black/20"
              )}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" /> {isMirrored ? 'Mirrored' : 'Mirror Off'}
            </button>
            <button
              onClick={() => setShowPreview(p => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2",
                showPreview
                  ? "bg-[#3E6B43] text-white border-[#3E6B43]"
                  : "bg-white text-[var(--color-pawtobooth-dark)]/50 border-black/10 hover:border-black/20"
              )}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'Hide Preview' : 'Camera Preview'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Left: Camera Preview + Effects Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed md:relative inset-y-0 left-0 w-[280px] bg-white md:bg-transparent z-50 border-r border-black/5 overflow-hidden shadow-2xl md:shadow-none"
              >
                <div className="p-5 space-y-4 w-[280px] h-full overflow-y-auto">
                  <div className="md:hidden flex justify-end">
                    <button onClick={() => setShowPreview(false)} className="p-2 bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                  {/* Live Camera */}
                  <div className="aspect-square bg-black rounded-3xl overflow-hidden relative border-4 border-white shadow-lg">
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ 
                        filter: cameraFilter || undefined,
                        transform: isMirrored ? 'scaleX(-1)' : undefined
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">
                      Live Preview
                    </div>
                    {cameraFilter && (
                      <div className="absolute top-2 right-2 bg-[#3E6B43]/80 text-white text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">
                        {EFFECTS.find(e => e.value === cameraFilter)?.label}
                      </div>
                    )}
                  </div>

                  {/* Effects Grid */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-pawtobooth-dark)]/40">Camera Effect</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {EFFECTS.map(effect => (
                        <button
                          key={effect.value}
                          onClick={() => onFilterChange(effect.value)}
                          className={cn(
                            "py-2 rounded-xl text-[8px] font-black uppercase tracking-wide transition-all border-2",
                            cameraFilter === effect.value
                              ? "border-[#3E6B43] bg-[#3E6B43]/10 text-[#3E6B43]"
                              : "border-transparent bg-black/5 text-[var(--color-pawtobooth-dark)]/40 hover:border-black/10 hover:bg-black/10"
                          )}
                        >
                          {effect.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Template Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto scrollbar-hide shrink-0 border-b border-black/5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 shrink-0",
                    activeCategory === cat 
                      ? "bg-[var(--color-pawtobooth-dark)] text-white border-[var(--color-pawtobooth-dark)] shadow-md" 
                      : "bg-white text-[var(--color-pawtobooth-dark)]/40 border-black/5 hover:border-black/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.length > 0 ? filteredTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => onSelect(template)}
                      className={cn(
                        "relative group aspect-[3/4] overflow-hidden rounded-[24px] border-4 transition-all duration-300 bg-white shadow-md",
                        selectedTemplateId === template.id 
                          ? "border-[#3E6B43] scale-105 shadow-xl shadow-[#3E6B43]/20" 
                          : "border-transparent opacity-80 hover:opacity-100 hover:shadow-lg hover:scale-[1.02]"
                      )}
                    >
                      <img src={template.image_url} alt={template.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-8">
                        <span className="text-white text-[9px] font-black uppercase tracking-widest block truncate">{template.name}</span>
                        <span className="text-white/40 text-[7px] font-mono uppercase">{template.category || 'General'}</span>
                      </div>
                      {selectedTemplateId === template.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#3E6B43] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </motion.button>
                  )) : (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <Filter className="w-12 h-12 text-[var(--color-pawtobooth-dark)]/10 mx-auto" />
                      <p className="text-[var(--color-pawtobooth-dark)]/40 font-mono text-xs uppercase tracking-widest">No templates in this category</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-6 py-5 border-t border-black/5 shrink-0 flex items-center justify-between bg-white/50">
              <p className="text-[10px] font-bold text-[var(--color-pawtobooth-dark)]/30 uppercase tracking-widest">
                {selectedTemplateId ? '✓ Template selected' : 'Select a template to continue'}
              </p>
              <button 
                onClick={onProceed}
                disabled={!selectedTemplateId}
                className="group px-10 py-4 bg-[#3E6B43] text-white font-black uppercase tracking-[0.2em] text-sm rounded-full hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-xl shadow-[#3E6B43]/20 disabled:opacity-50 disabled:grayscale flex items-center gap-3"
              >
                Continue Session <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
