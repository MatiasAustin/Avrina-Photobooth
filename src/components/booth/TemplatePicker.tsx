import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { PhotoTemplate } from '../../types';
import { cn } from '../../lib/utils';

interface TemplatePickerProps {
  templates: PhotoTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: PhotoTemplate) => void;
  onProceed: () => void;
}

export function TemplatePicker({ templates, selectedTemplateId, onSelect, onProceed }: TemplatePickerProps) {
  return (
    <motion.div 
      key="templates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="z-10 w-full max-w-6xl px-8 flex flex-col h-full items-center justify-center space-y-12"
    >
       <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold uppercase tracking-tight">Choose Your Frame</h2>
        <p className="text-neutral-400">Select a memory style for your session</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {templates.length > 0 ? templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={cn(
              "relative group aspect-[3/4] overflow-hidden rounded-2xl border-4 transition-all duration-300",
              selectedTemplateId === template.id ? "border-white scale-105" : "border-transparent opacity-60 hover:opacity-100"
            )}
          >
            <img src={template.image_url} alt={template.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-xs font-bold uppercase tracking-widest">{template.name}</span>
            </div>
          </button>
        )) : (
           <div className="col-span-full py-12 text-center text-neutral-500 font-mono">
              No templates found. Set them up in the admin dashboard.
           </div>
        )}
      </div>

      <button 
        onClick={onProceed}
        className="bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
