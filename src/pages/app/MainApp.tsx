import { useEffect, useState } from 'react';
import { MessageSquare, Users, Radio, Phone, Settings, User } from 'lucide-react';
import Sidebar from '@/components/app/Sidebar';
import ChatWindow from '@/components/app/ChatWindow';
import { ChatProvider } from '@/context/ChatContext';
import CommunitiesView from '@/components/app/CommunitiesView';
import BroadcastsView from '@/components/app/BroadcastsView';
import CallsView from '@/components/app/CallsView';
import SettingsView from '@/components/app/SettingsView';
import ProfileView from '@/components/app/ProfileView';
import { useIsMobile } from '@/hooks/use-mobile';
import ActiveCallScreen from '@/components/app/ActiveCallScreen';

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
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<ActiveView>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(isMobile ? null : '1');
  const [activeCall, setActiveCall] = useState<{ callId: string; type: 'voice' | 'video' } | null>(null);

  useEffect(() => {
    // On mount, check URL for /call/:id
    const checkPath = () => {
      const path = window.location.pathname;
      // match either /call/:id or /app/call/:id
      const m = path.match(/^(?:\/app)?\/call\/(.+)$/);
      if (m) {
        const callId = m[1];
        // try to read callType from history state
        const state = window.history.state as { callType?: 'voice' | 'video' } | null;
        const callType = state?.callType || 'voice';
        setActiveCall({ callId, type: callType });
      }
    };
    checkPath();

    const onPop = () => checkPath();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
        <ChatProvider>
          {renderView()}
          {activeCall && (
            <ActiveCallScreen
              callId={activeCall.callId}
              type={activeCall.type}
              onEnd={() => {
                // End call: clear URL and hide
                window.history.pushState({}, '', '/');
                setActiveCall(null);
              }}
            />
          )}
        </ChatProvider>
      </div>
    </div>
  );
};

export default MainApp;
