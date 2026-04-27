import { Users, DollarSign, Printer, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface AdminStatsProps {
  sessionCount: number;
  revenue: number;
  queueCount: number;
  eventCount: number;
}

export function AdminStats({ sessionCount, revenue, queueCount, eventCount }: AdminStatsProps) {
  const stats = [
    { label: 'Total Sessions', value: sessionCount, icon: Users, color: 'text-blue-600' },
    { label: 'Total Revenue', value: `Rp ${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#3E6B43]' },
    { label: 'Print Queue', value: queueCount, icon: Printer, color: 'text-purple-600' },
    { label: 'Active Events', value: eventCount, icon: Calendar, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-6 bg-white border border-black/5 rounded-[32px] space-y-4 shadow-sm"
        >
          <div className={cn("p-3 rounded-2xl bg-[var(--color-pawtobooth-light)] w-fit", stat.color)}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[var(--color-pawtobooth-dark)]/60 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
