import { Radio } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockBroadcasts } from '@/data/mockData';

const BroadcastsView = () => {
  return (
    <div className="flex h-full">
      <div className="w-96 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Broadcasts</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          {mockBroadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className="p-4 border-b border-border hover:bg-sidebar-hover cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{broadcast.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {broadcast.lastBroadcast}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{broadcast.recipients} recipients</span>
                    <span>•</span>
                    <span>{broadcast.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a broadcast to view</p>
        </div>
      </div>
    </div>
  );
};

export default BroadcastsView;
