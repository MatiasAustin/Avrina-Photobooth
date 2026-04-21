import { LogOut, Calendar, ImageIcon, Printer, TrendingUp, Camera, Zap, CreditCard, Crown, Shield, User, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isPremium?: boolean;
}

export function AdminSidebar({ activeTab, onTabChange, isPremium = false }: AdminSidebarProps) {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, pro: false },
    { id: 'subscription', label: 'Subscription', icon: Shield, pro: false },
    { id: 'profile', label: 'Store Profile', icon: User, pro: false },
    { id: 'events', label: 'Events Registry', icon: Calendar, pro: true },
    { id: 'templates', label: 'Templates', icon: ImageIcon, pro: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, pro: true },
    { id: 'prints', label: 'Print Queue', icon: Printer, pro: true },
    { id: 'print_node', label: 'Remote Print Node', icon: Zap, pro: true },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-neutral-900/50 flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Camera className="text-black w-5 h-5" />
        </div>
        <h1 className="font-bold tracking-tighter text-xl uppercase">Avrina <span className="text-white/20">Admin</span></h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isLocked = !isPremium && item.pro;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isLocked) {
                  onTabChange('premium_locked');
                } else {
                  onTabChange(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-white text-black shadow-lg" 
                  : isLocked 
                    ? "text-neutral-600 cursor-not-allowed" 
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isLocked && "opacity-50")} />
                <span className={isLocked ? "opacity-50" : ""}>{item.label}</span>
              </div>
              {isLocked ? (
                <Lock className="w-3 h-3 text-neutral-600" />
              ) : item.pro && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600/10 text-blue-500 text-[8px] font-black uppercase tracking-tighter border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Crown className="w-2 h-2 fill-current" /> PRO
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-white/5">
        <button 
          onClick={() => navigate('/launchpad')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white hover:text-black transition-all border border-white/10"
        >
          <Zap className="w-4 h-4 text-glow" />
          Station Launchpad
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Exit to Public
        </button>
      </div>
    </aside>
  );
}
