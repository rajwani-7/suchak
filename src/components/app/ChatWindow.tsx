import { useState } from 'react';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockChats, mockMessages } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface ChatWindowProps {
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}

const ChatWindow = ({ selectedChatId, onSelectChat }: ChatWindowProps) => {
  const [message, setMessage] = useState('');
  const { t } = useLanguage();
  const selectedChat = mockChats.find((chat) => chat.id === selectedChatId);

  const handleSend = () => {
    if (message.trim()) {
      setMessage('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-96 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.searchChats}
              className="pl-10 bg-secondary border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                'w-full p-4 flex items-start gap-3 hover:bg-sidebar-hover transition-colors border-b border-border',
                selectedChatId === chat.id && 'bg-sidebar-hover'
              )}
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-semibold">
                    {chat.unread}
                  </span>
                </div>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Messages */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-chat-bg">
          {/* Header */}
          <div className="h-16 bg-card border-b border-border px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedChat.avatar} />
                <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">{selectedChat.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>{t.encrypted}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.senderId === 'me' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-md px-4 py-2 rounded-lg',
                      msg.senderId === 'me'
                        ? 'bg-chat-sent text-primary-foreground'
                        : 'bg-chat-received text-foreground'
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.typeMessage}
                className="flex-1 bg-secondary border-none"
              />
              {message ? (
                <Button onClick={handleSend} size="icon" className="rounded-full">
                  <Send className="w-5 h-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon">
                  <Mic className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-chat-bg">
          <p className="text-muted-foreground">{t.selectChatToStart}</p>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
