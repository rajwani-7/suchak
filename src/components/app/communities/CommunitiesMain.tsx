import React from 'react';
import { useCommunities } from '@/context/CommunitiesContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

const CommunitiesMain = () => {
  const { state, dispatch } = useCommunities();
  const { communities, selectedCommunityId } = state;

  const handleSelectCommunity = (id: string) => {
    dispatch({ type: 'SELECT_COMMUNITY', payload: id });
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-96 flex-shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Communities</h2>
          {/* TODO: Add create community button */}
        </div>
        <ScrollArea className="flex-1 overflow-auto">
          {communities.map((community) => (
            <div
              key={community.id}
              onClick={() => handleSelectCommunity(community.id)}
              className={`p-4 border-b border-border cursor-pointer transition-colors ${
                selectedCommunityId === community.id ? 'bg-sidebar-hover' : 'hover:bg-sidebar-hover'
              }`}
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
        {selectedCommunityId ? (
          <p className="text-foreground">Community selected: {selectedCommunityId}</p>
        ) : (
          <div className="text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select a community to view</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesMain;
