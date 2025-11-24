import { 
  Bell, 
  Lock, 
  Shield, 
  Info, 
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

const SettingsView = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: Shield, label: 'Privacy', onClick: () => {} },
        { icon: Lock, label: 'Security', onClick: () => {} },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: darkMode ? Moon : Sun, 
          label: 'Dark Mode', 
          toggle: true,
          value: darkMode,
          onChange: setDarkMode
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: Info, label: 'About SUCHAK', onClick: () => {} },
        { icon: Shield, label: 'E2E Encryption Info', onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="h-full bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        {settingsSections.map((section) => (
          <div key={section.title} className="py-2">
            <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <Switch
                      checked={item.value}
                      onCheckedChange={item.onChange}
                    />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default SettingsView;
