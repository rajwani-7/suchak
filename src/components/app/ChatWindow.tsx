import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, Lock, Video, Phone, Filter, X, Eye, Heart, User, UserX, Users, FileText, Plus, ArrowLeft, ThumbsUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/context/ChatContext';
import NewContactModal from './NewContactModal';
import NewGroupModal from './NewGroupModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import EmojiPicker from '@/components/ui/EmojiPicker';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { useToast } from '@/hooks/use-toast';
import CallModal from './CallModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ChatWindowProps {
  selectedChatId: string | null;
  onSelectChat: (id: string | null) => void;
}

type FilterType = 'all' | 'unread' | 'favorites' | 'contacts' | 'non-contacts' | 'groups' | 'drafts';

const ChatWindow = ({ selectedChatId, onSelectChat }: ChatWindowProps) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [callModal, setCallModal] = useState<{ open: boolean; type: 'voice' | 'video' | null }>({ open: false, type: null });
  const [isMessageSearchActive, setIsMessageSearchActive] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(0);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const { chats, getMessagesForChat, sendMessage, sendAudioMessage, sendFileMessage, contacts, selectChat } = useChat();
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;
  const messages = useMemo(
    () => (selectedChatId ? getMessagesForChat(selectedChatId) : []),
    [selectedChatId, getMessagesForChat]);

  // Filter messages based on search query
  const searchResults = useMemo(() => {
    if (!messageSearchQuery.trim() || !isMessageSearchActive) return [];
    
    const query = messageSearchQuery.toLowerCase();
    return messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => {
        if (msg.type === 'text') {
          return msg.text?.toLowerCase().includes(query);
        }
        if (msg.type === 'file' && msg.file) {
          return msg.file.name.toLowerCase().includes(query);
        }
        if (msg.type === 'link' && msg.link) {
          return msg.link.title?.toLowerCase().includes(query) ||
                 msg.link.description?.toLowerCase().includes(query) ||
                 msg.link.url?.toLowerCase().includes(query);
        }
        return false;
      });
  }, [messages, messageSearchQuery, isMessageSearchActive]);

  const handleToggleMessageSearch = useCallback(() => {
    if (isMessageSearchActive) {
      // Close search
      setIsMessageSearchActive(false);
      setMessageSearchQuery('');
      setCurrentSearchResultIndex(0);
    } else {
      // Open search
      setIsMessageSearchActive(true);
    }
  }, [isMessageSearchActive]);

  const handleSearchNavigation = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    if (direction === 'next') {
      setCurrentSearchResultIndex((prev) => 
        prev >= searchResults.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentSearchResultIndex((prev) => 
        prev <= 0 ? searchResults.length - 1 : prev - 1
      );
    }
  }, [searchResults.length]);

  // Helper function to check if a message matches current search result
  const isCurrentSearchResult = useCallback((msgId: string) => {
    if (!isMessageSearchActive || searchResults.length === 0) return false;
    return searchResults[currentSearchResultIndex]?.msg.id === msgId;
  }, [isMessageSearchActive, searchResults, currentSearchResultIndex]);

  // Helper function to check if a message is a search result
  const isSearchResult = useCallback((msgId: string) => {
    if (!isMessageSearchActive || searchResults.length === 0) return false;
    return searchResults.some(({ msg }) => msg.id === msgId);
  }, [isMessageSearchActive, searchResults]);

  const recorder = useAudioRecorder();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Ref to store blob URLs created in this session to revoke them on unmount
  const blobUrlRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    const urls = blobUrlRef.current;
    return () => {
      urls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Filter chats based on filter type and search query
  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Apply filter type
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter((chat) => chat.unread > 0);
        break;
      case 'favorites':
        filtered = filtered.filter((chat) => chat.isFavorite);
        break;
      case 'contacts':
        filtered = filtered.filter((chat) => chat.isContact);
        break;
      case 'non-contacts':
        filtered = filtered.filter((chat) => !chat.isContact);
        break;
      case 'groups':
        filtered = filtered.filter((chat) => chat.isGroup);
        break;
      case 'drafts':
        filtered = filtered.filter((chat) => chat.isDraft);
        break;
      default:
        break;
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [filterType, searchQuery, chats]);

  const handleSend = () => {
    if (message.trim() && selectedChatId) {
      sendMessage(selectedChatId, message.trim());
      setMessage('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return '✓✓✓';
      case 'delivered':
        return '✓✓';
      case 'sent':
        return '✓';
      default:
        return '✓';
    }
  };

  const filterOptions = [
    { value: 'all' as FilterType, label: 'All chats', icon: null },
    { value: 'unread' as FilterType, label: 'Unread', icon: Eye },
    { value: 'favorites' as FilterType, label: 'Favorites', icon: Heart },
    { value: 'contacts' as FilterType, label: 'Contacts', icon: User },
    { value: 'non-contacts' as FilterType, label: 'Non-contacts', icon: UserX },
    { value: 'groups' as FilterType, label: 'Groups', icon: Users },
    { value: 'drafts' as FilterType, label: 'Drafts', icon: FileText },
  ];

  return (
    // Main container for the entire chat interface. Uses flexbox for layout.
    // h-full ensures it takes the full height of its parent.
    // 'relative' is needed for absolutely positioned children like the new chat sheet.
    <div className="flex h-full bg-card">
      {/* Chat List */}
      <div className={cn(
        "border-r border-border flex flex-col bg-card transition-transform duration-300 ease-in-out",
        // On mobile, the chat list is an overlay that takes the full screen width.
        "fixed inset-y-0 left-0 z-40 w-full md:relative md:z-auto md:w-96 md:flex",
        // On mobile we slide the chat list off-screen when a chat is selected
        selectedChatId ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Chats</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewChat(true)}
                className="h-9 w-9"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Filter className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          setFilterType(option.value);
                          setShowFilterMenu(false);
                        }}
                        className={cn(
                          'flex items-center gap-2',
                          filterType === option.value && 'bg-accent'
                        )}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{option.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search or start a new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredChats.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-sm text-muted-foreground">No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-sidebar-hover transition-colors border-b border-border',
                  selectedChatId === chat.id && 'bg-sidebar-hover'
                )}
              >
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-primary-foreground font-semibold">
                      {chat.unread}
                    </span>
                  </div>
                )}
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Messages */}
      {selectedChat ? (
        <div className={cn(
          "flex flex-1 flex-col bg-chat-bg relative overflow-hidden",
          // When a chat is selected on mobile, this view is visible.
          // On desktop, it's always visible as a flex item.
        )}>
          {/* WhatsApp-like background pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-56 36c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm67 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm56 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM12 45c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm69 15c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM8 29c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm14-15c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border z-20">
            <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 -ml-2"
                  onClick={() => onSelectChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </div>
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={selectedChat.avatar} />
                <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{selectedChat.name}</h3>
                {selectedChat.isGroup && selectedChat.participants ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedChat.participants.join(', ')}
                  </p>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>{t.encrypted}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCallModal({ open: true, type: 'video' })}>
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setCallModal({ open: true, type: 'voice' })}>
                  <Phone className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-9 w-9",
                    isMessageSearchActive && "bg-accent"
                  )}
                  onClick={handleToggleMessageSearch}
                >
                  <Search className="w-5 h-5" />
                </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
            </div>

            {/* Message Search Bar */}
            {isMessageSearchActive && (
              <div className="px-4 py-3 border-t border-border bg-secondary/50">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={messageSearchQuery}
                      onChange={(e) => {
                        setMessageSearchQuery(e.target.value);
                        setCurrentSearchResultIndex(0);
                      }}
                      placeholder="Search in conversation..."
                      className="pl-10 pr-4 bg-background border border-border"
                      autoFocus
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {currentSearchResultIndex + 1} of {searchResults.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSearchNavigation('prev')}
                          disabled={searchResults.length === 0}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSearchNavigation('next')}
                          disabled={searchResults.length === 0}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {messageSearchQuery && (
                    <span className="text-sm text-muted-foreground">
                      {searchResults.length === 0 && 'No results'}
                    </span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleToggleMessageSearch}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {/* Scrollable message area. flex-1 allows it to grow and fill available space. */}
          <ScrollArea className="flex-1 relative z-10">
            {/* The container for messages has a max-width and is centered, like WhatsApp Web. */}
            {/* p-4 provides padding, with responsive adjustments for smaller screens. */}
            <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === 'me';
                const showDateSeparator = index === 0 || 
                  (index > 0 && messages[index - 1].timestamp.split(' ')[0] !== msg.timestamp.split(' ')[0]);
                
                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="px-3 py-1 bg-card rounded-full text-xs text-muted-foreground">
                          Today
                        </div>
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex group relative',
                        isMe ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isMe && msg.senderName && (
                        <div className="mr-2 mb-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            {msg.senderName}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-lg lg:max-w-xl px-3 py-2 rounded-lg relative transition-all',
                          isMe
                            ? 'bg-chat-sent text-primary-foreground rounded-tr-none'
                            : 'bg-chat-received text-foreground rounded-tl-none',
                          isCurrentSearchResult(msg.id) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                          isSearchResult(msg.id) && !isCurrentSearchResult(msg.id) && 'bg-yellow-100 dark:bg-yellow-900/30'
                        )}
                      >
                        {msg.type === 'text' && (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            {msg.isEdited && (
                              <span className="text-xs opacity-70 italic">(edited)</span>
                            )}
                          </>
                        )}
                        
                        {msg.type === 'link' && msg.link && (
                          <div className="space-y-2">
                            <div className="bg-black/10 dark:bg-white/10 rounded p-3">
                              <p className="text-sm font-medium mb-1">{msg.link.title}</p>
                              <p className="text-xs opacity-90 mb-2">{msg.link.description}</p>
                              <a
                                href={msg.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs opacity-70 hover:opacity-100 break-all"
                              >
                                {msg.link.url}
                              </a>
                            </div>
                          </div>
                        )}

                        {msg.type === 'file' && msg.file && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 rounded">
                              <FileText className="w-8 h-8 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{msg.file.name}</p>
                                <p className="text-xs opacity-70">{msg.file.size} • {msg.file.type}</p>
                              </div>
                            </div>
                            {(() => {
                              // The fileUrl can be a remote URL or a local blob URL.
                              // It's added temporarily on the client for previews.
                              const fileUrl = 'fileUrl' in msg ? (msg as { fileUrl?: string }).fileUrl : undefined;

                              return (
                                fileUrl && <div className="flex gap-2 mt-2">
                                  <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-block">
                                    <Button size="sm" variant="outline" className="text-xs h-7">
                                      Open
                                    </Button>
                                  </a>
                                  <a href={fileUrl} download={msg.file.name} className="inline-block">
                                    <Button size="sm" variant="outline" className="text-xs h-7">
                                      Save as...
                                    </Button>
                                  </a>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {msg.type === 'image' && msg.image && (
                          <div className="space-y-2">
                            <img
                              src={msg.image}
                              alt="Shared"
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}

                        {msg.type === 'audio' && msg.audio && (
                          <div className="space-y-2">
                            <AudioPlayer
                              // Prefer the temporary local fileUrl for playback if it exists
                              src={'fileUrl' in msg ? (msg as { fileUrl?: string }).fileUrl : msg.audio.url}
                              duration={msg.audio.duration ?? null}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex items-center gap-1">
                                {msg.reactions.map((reaction, idx) => (
                                  <button
                                    key={idx}
                                    className="px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-xs flex items-center gap-1 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span className="text-[10px] opacity-70">
                                      {reaction.users.length}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">{msg.timestamp}</span>
                            {isMe && (
                              <span className="text-xs opacity-70">
                                {getStatusIcon(msg.status)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Reaction button - show on hover or always on mobile */}
                        <div className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-card border border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle reaction
                            }}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Input */}
          {/* Sticky bottom input bar. z-10 keeps it above the background pattern. */}
          <div className="p-2 sm:p-4 bg-card border-t border-border relative z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowEmoji((s) => !s)}>
                  <Smile className="w-5 h-5" />
                </Button>
                {showEmoji && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onSelect={(e) => { setMessage((m) => m + e); setShowEmoji(false); }} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="chat-file-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && selectedChatId) {
                    // Create a blob URL for immediate preview
                    const fileUrl = URL.createObjectURL(f);
                    blobUrlRef.current.add(fileUrl);
                    // Pass the file and the blob URL to the send function
                    sendFileMessage(selectedChatId, f, { fileUrl });

                    toast({ title: 'File queued', description: `Ready to send ${f.name}` });
                  }
                  e.currentTarget.value = '';
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t.typeMessage}
                className="flex-1 bg-secondary border-none"
              />
              {message ? (
                <Button onClick={handleSend} size="icon" className="rounded-full h-9 w-9">
                  <Send className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant={recorder.state === 'recording' ? 'destructive' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={async () => {
                    if (!selectedChatId) return;
                    if (recorder.state !== 'recording') {
                      try {
                        await recorder.start();
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        console.debug('Recorder start failed:', err);
                        toast({ title: 'Recording failed', description: msg || 'Microphone access not available.' });
                      }
                    } else {
                      const audioBlob = recorder.stop();
                      if (audioBlob) {
                        if (audioBlob.size === 0) {
                          toast({ title: 'Recording error', description: 'Captured audio is empty.' });
                          return;
                        }

                        // Re-create the blob with a specific MIME type to ensure compatibility.
                        // MediaRecorder in Chrome/Firefox often produces webm, but may not set the type.
                        const webmBlob = new Blob([audioBlob], { type: 'audio/webm' });

                        // send audio message
                        const fileUrl = URL.createObjectURL(webmBlob);
                        blobUrlRef.current.add(fileUrl);
                        sendAudioMessage(selectedChatId, webmBlob, {
                          duration: recorder.duration ?? undefined,
                          fileUrl: fileUrl,
                        });
                      } else {
                        toast({ title: 'Recording error', description: 'No audio captured.' });
                      }
                    }
                  }}
                >
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                    {recorder.state === 'recording' && (
                      <span className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </Button>
              )}
            </div>
          </div>
          <CallModal
            open={callModal.open}
            type={callModal.type}
            onClose={() => setCallModal({ open: false, type: null })}
            onAccept={() => {
              // start a call and create a persistent link like WhatsApp
              const callId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
              const callType = callModal.type || 'voice';
              // push history state with call type so MainApp can read it
              window.history.pushState({ callType }, '', `/app/call/${callId}`);
              // trigger popstate so MainApp picks it up
              window.dispatchEvent(new PopStateEvent('popstate'));
              setCallModal({ open: false, type: null });
            }}
          />
        </div>
      ) : (
        <div className={cn(
          "hidden md:flex flex-1 items-center justify-center bg-chat-bg",
          // This is the placeholder view when no chat is selected on desktop.
        )}>
          <p className="text-muted-foreground">{t.selectChatToStart}</p>
        </div>
      )}

      {/* New Chat Overlay */}
      <Sheet open={showNewChat} onOpenChange={setShowNewChat}>
        <SheetContent side="left" className="w-full md:w-96 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>New chat</SheetTitle>
          </SheetHeader>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name or number"
                className="pl-10 bg-secondary border-none"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => setShowNewGroup(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span>New group</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => setShowNewContact(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span>New contact</span>
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                  Frequently contacted
                </h3>
                {(contacts || []).map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      // find or open chat for this contact
                      const existingChat = chats.find((c) => c.name === contact.name);
                      if (existingChat) {
                        onSelectChat(existingChat.id);
                        selectChat(existingChat.id);
                      }
                      setShowNewChat(false);
                    }}
                    className="w-full p-3 flex items-center gap-3 hover:bg-sidebar-hover transition-colors rounded-lg"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.status}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                  All contacts
                </h3>
                {(contacts || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2">No contacts available</p>
                ) : (
                  (contacts || []).map((c) => (
                    <div key={c.id} className="px-2 py-1 flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback>{c.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <NewContactModal open={showNewContact} onOpenChange={setShowNewContact} />
      <NewGroupModal open={showNewGroup} onOpenChange={setShowNewGroup} />
    </div>
  );
};

export default ChatWindow;
