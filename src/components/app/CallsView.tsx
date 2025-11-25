import { useState } from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockCalls } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

const CallsView = () => {
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const { t } = useLanguage();

  const activeCallData = mockCalls.find((call) => call.id === activeCall);

  const handleEndCall = () => {
    setActiveCall(null);
  };

  if (activeCall && activeCallData) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <Avatar className="w-40 h-40 mx-auto">
              <AvatarImage src={activeCallData.avatar} />
              <AvatarFallback className="text-4xl">
                {activeCallData.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {activeCallData.name}
            </h2>
            <p className="text-muted-foreground">{t.calling}</p>
          </div>

          <Button
            onClick={handleEndCall}
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Calls</h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        {mockCalls.map((call) => (
          <div
            key={call.id}
            className="p-4 border-b border-border hover:bg-sidebar-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={call.avatar} />
                <AvatarFallback>{call.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{call.name}</h3>
                  {call.type === 'video' ? (
                    <Video className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      call.status === 'missed'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {call.status === 'missed' ? 'Missed' : call.duration}
                  </span>
                  <span className="text-muted-foreground">· {call.timestamp}</span>
                </div>
              </div>
              <Button
                onClick={() => setActiveCall(call.id)}
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary"
              >
                {call.type === 'video' ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default CallsView;
