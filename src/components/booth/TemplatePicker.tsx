import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Filter } from 'lucide-react';
import { PhotoTemplate } from '../../types';
import { cn } from '../../lib/utils';

interface TemplatePickerProps {
  templates: PhotoTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: PhotoTemplate) => void;
  onProceed: () => void;
}

export function TemplatePicker({ templates, selectedTemplateId, onSelect, onProceed }: TemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...new Set(templates.map(t => t.category || 'General'))];
  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => (t.category || 'General') === activeCategory);

  return (
    <motion.div 
      key="templates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 w-full max-w-6xl px-8 flex flex-col h-full items-center justify-center space-y-8"
    >
       <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tight text-[var(--color-pawtobooth-dark)] italic">Choose Your <span className="text-[#3E6B43]">Frame</span></h2>
        <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-widest">Select a style for your session</p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-2 scrollbar-hide">
         {categories.map(cat => (
           <button
             key={cat}
             onClick={() => setActiveCategory(cat)}
             className={cn(
               "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2",
               activeCategory === cat 
                 ? "bg-[var(--color-pawtobooth-dark)] text-white border-[var(--color-pawtobooth-dark)] shadow-xl scale-105" 
                 : "bg-white/50 backdrop-blur-md text-[var(--color-pawtobooth-dark)]/40 border-black/5 hover:border-black/10"
             )}
           >
             {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full max-h-[50vh] overflow-y-auto p-4 scrollbar-hide">
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
                "relative group aspect-[3/4] overflow-hidden rounded-[32px] border-4 transition-all duration-300 bg-white shadow-lg",
                selectedTemplateId === template.id ? "border-[#3E6B43] scale-105 shadow-2xl" : "border-transparent opacity-80 hover:opacity-100"
              )}
            >
              <img src={template.image_url} alt={template.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-8">
                <span className="text-white text-[10px] font-black uppercase tracking-widest block truncate">{template.name}</span>
                <span className="text-white/40 text-[8px] font-mono uppercase">{template.category || 'General'}</span>
              </div>
              {selectedTemplateId === template.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-[#3E6B43] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
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

      <button 
        onClick={onProceed}
        disabled={!selectedTemplateId}
        className="group relative px-16 py-6 bg-[#3E6B43] text-white font-black uppercase tracking-[0.2em] text-sm rounded-full hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-[0_20px_50px_rgba(62,107,67,0.3)] disabled:opacity-50 disabled:grayscale flex items-center gap-3"
      >
        Continue Session <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
}
