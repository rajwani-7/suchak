import { Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockCommunities } from '@/data/mockData';

const CommunitiesView = () => {
  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-96 flex-shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Communities</h2>
        </div>
        <ScrollArea className="flex-1 overflow-auto">
          {mockCommunities.map((community) => (
            <div
              key={community.id}
              className="p-4 border-b border-border hover:bg-sidebar-hover cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={community.avatar} />
                  <AvatarFallback>
                    <Users className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{community.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {community.members} members · {community.lastActivity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a community to view</p>
        </div>
      </div>
    </div>
  );
};

export default CommunitiesView;
