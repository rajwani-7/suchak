import { LucideIcon } from 'lucide-react';
import { ActiveView } from '@/pages/app/MainApp';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItem {
  id: ActiveView;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const Sidebar = ({ menuItems, activeView, onViewChange }: SidebarProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const getTranslatedLabel = (id: ActiveView) => {
    const labels: Record<ActiveView, string> = {
      chats: t.chats,
      communities: t.communities,
      broadcasts: t.broadcasts,
      calls: t.calls,
      settings: t.settings,
      profile: t.profile,
    };
    return labels[id];
  };
  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col items-center py-4 space-y-2",
      isMobile ? "w-14" : "w-16"
    )}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground'
            )}
            title={item.label}
          >
            <Icon className="w-6 h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {getTranslatedLabel(item.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;
