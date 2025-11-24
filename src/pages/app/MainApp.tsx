import { useState } from 'react';
import { MessageSquare, Users, Radio, Phone, Settings, User } from 'lucide-react';
import Sidebar from '@/components/app/Sidebar';
import ChatWindow from '@/components/app/ChatWindow';
import CommunitiesView from '@/components/app/CommunitiesView';
import BroadcastsView from '@/components/app/BroadcastsView';
import CallsView from '@/components/app/CallsView';
import SettingsView from '@/components/app/SettingsView';
import ProfileView from '@/components/app/ProfileView';

export type ActiveView = 'chats' | 'communities' | 'broadcasts' | 'calls' | 'settings' | 'profile';

const menuItems = [
  { id: 'chats' as const, icon: MessageSquare, label: 'Chats' },
  { id: 'communities' as const, icon: Users, label: 'Communities' },
  { id: 'broadcasts' as const, icon: Radio, label: 'Broadcasts' },
  { id: 'calls' as const, icon: Phone, label: 'Calls' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
  { id: 'profile' as const, icon: User, label: 'Profile' },
];

const MainApp = () => {
  const [activeView, setActiveView] = useState<ActiveView>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>('1');

  const renderView = () => {
    switch (activeView) {
      case 'chats':
        return <ChatWindow selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />;
      case 'communities':
        return <CommunitiesView />;
      case 'broadcasts':
        return <BroadcastsView />;
      case 'calls':
        return <CallsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <ChatWindow selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        menuItems={menuItems}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <div className="flex-1">
        {renderView()}
      </div>
    </div>
  );
};

export default MainApp;
