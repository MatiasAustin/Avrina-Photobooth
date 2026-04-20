import { LogOut, Calendar, ImageIcon, Printer, TrendingUp, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'events', label: 'Events Registry', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: ImageIcon },
    { id: 'prints', label: 'Print Queue', icon: Printer },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-neutral-900/50 flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Camera className="text-black w-5 h-5" />
        </div>
        <h1 className="font-bold tracking-tighter text-xl uppercase">Lux Admin</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.id ? "bg-white text-black" : "text-neutral-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => window.location.hash = ''}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Booth Mode
        </button>
      </div>
    </aside>
  );
}
