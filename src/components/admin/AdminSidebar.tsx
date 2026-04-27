import { LogOut, Calendar, ImageIcon, Printer, TrendingUp, Camera, Zap, CreditCard, Crown, Shield, User, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isPremium?: boolean;
}

export function AdminSidebar({ activeTab, onTabChange, isPremium = false }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
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
    <aside className="w-64 border-r border-black/5 bg-[var(--color-pawtobooth-light)] flex flex-col">
      <div className="p-8 border-b border-black/5 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#3E6B43] rounded-lg flex items-center justify-center">
          <Camera className="text-white w-5 h-5" />
        </div>
        <h1 className="font-bold tracking-tighter text-xl uppercase text-[var(--color-pawtobooth-dark)]">{settings.appName.split(' ')[0]} <span className="text-[#3E6B43]">{settings.appName.split(' ')[1] || 'Admin'}</span></h1>
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
                  ? "bg-[var(--color-pawtobooth-dark)] text-[var(--color-pawtobooth-beige)] shadow-sm" 
                  : isLocked 
                    ? "text-[var(--color-pawtobooth-dark)]/30 cursor-not-allowed" 
                    : "text-[var(--color-pawtobooth-dark)]/60 hover:bg-[#3E6B43]/10 hover:text-[#3E6B43]"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isLocked && "opacity-50")} />
                <span className={isLocked ? "opacity-50" : ""}>{item.label}</span>
              </div>
              {isLocked ? (
                <Lock className="w-3 h-3 text-[var(--color-pawtobooth-dark)]/30" />
              ) : item.pro && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#3E6B43]/10 text-[#3E6B43] text-[8px] font-black uppercase tracking-tighter border border-[#3E6B43]/20 group-hover:bg-[#3E6B43] group-hover:text-white transition-all">
                  <Crown className="w-2 h-2 fill-current" /> PRO
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-black/5">
        <button 
          onClick={() => navigate('/launchpad')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[#3E6B43] text-white hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-sm"
        >
          <Zap className="w-4 h-4 text-glow" />
          Station Launchpad
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)] hover:bg-black/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Exit to Public
        </button>
      </div>
    </aside>
  );
}
