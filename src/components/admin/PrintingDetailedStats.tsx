import React, { useMemo } from 'react';
import { BarChart, Printer, TrendingUp, Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface PrintingDetailedStatsProps {
  printJobs: any[];
}

export function PrintingDetailedStats({ printJobs }: PrintingDetailedStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const completed = printJobs.filter(j => j.status === 'completed');

    const daily = completed.filter(j => new Date(j.created_at) > dayAgo).length;
    const weekly = completed.filter(j => new Date(j.created_at) > weekAgo).length;
    const monthly = completed.filter(j => new Date(j.created_at) > monthAgo).length;

    return { daily, weekly, monthly, total: completed.length };
  }, [printJobs]);

  const cards = [
    { label: 'Daily Prints', value: stats.daily, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Weekly Prints', value: stats.weekly, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Monthly Prints', value: stats.monthly, icon: BarChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Prints', value: stats.total, icon: Printer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--color-pawtobooth-dark)]/60 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#3E6B43]" /> Printing Analytics
         </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white border border-black/5 rounded-[32px] space-y-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={cn("p-2 rounded-xl w-fit", card.bg, card.color)}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
               <p className="text-[10px] font-bold uppercase opacity-40">{card.label}</p>
               <p className="text-2xl font-black">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
