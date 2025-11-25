import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  mockChats,
  mockMessages,
  frequentlyContacted,
  Contact as MockContact,
  Chat as MockChat,
  Message as MockMessage,
} from '@/data/mockData';

export type Contact = MockContact;
export type Chat = MockChat;
export type Message = MockMessage;

interface ChatState {
  contacts: Contact[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
}

interface ChatContextType extends ChatState {
  addContact: (c: { name: string; phone?: string }) => Contact;
  createGroup: (name: string, memberIds: string[]) => Chat;
  sendMessage: (chatId: string, text: string, senderId?: string) => Message | null;
  sendAudioMessage: (chatId: string, blob: Blob, meta?: { duration?: number }) => Message | null;
  sendFileMessage: (chatId: string, file: File) => Message | null;
  selectChat: (chatId: string | null) => void;
  getMessagesForChat: (chatId: string) => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const nowTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const STORAGE_KEY = 'suchak_chat_state';

const loadStateFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ChatState;
    }
  } catch (e) {
    console.error('Failed to load chat state from localStorage:', e);
  }
  return null;
};

const saveStateToStorage = (state: ChatState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save chat state to localStorage:', e);
  }
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const stored = loadStateFromStorage();
    return stored?.contacts || frequentlyContacted;
  });
  const [chats, setChats] = useState<Chat[]>(() => {
    const stored = loadStateFromStorage();
    return stored?.chats || mockChats;
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const stored = loadStateFromStorage();
    return stored?.messages || { ...mockMessages };
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const stored = loadStateFromStorage();
    return stored?.activeChatId ?? null;
  });

  // Save state whenever it changes
  useEffect(() => {
    saveStateToStorage({ contacts, chats, messages, activeChatId });
  }, [contacts, chats, messages, activeChatId]);

  const genId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const addContact = (c: { name: string; phone?: string }) => {
    const contact: Contact = {
      id: genId(),
      name: c.name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`,
      status: c.phone ?? '',
      isAvailable: true,
    };
    setContacts((s) => [contact, ...s]);

    // also create an empty chat for this contact so it appears in chats instantly
    const chat: Chat = {
      id: genId(),
      name: contact.name,
      avatar: contact.avatar,
      lastMessage: '',
      timestamp: nowTime(),
      unread: 0,
      status: 'online',
      isContact: true,
    };
    setChats((s) => [chat, ...s]);
    setMessages((m) => ({ ...m, [chat.id]: [] }));
    return contact;
  };

  const createGroup = (name: string, memberIds: string[]) => {
    const members = contacts
      .filter((c) => memberIds.includes(c.id))
      .map((c) => c.name);

    const group: Chat = {
      id: genId(),
      name: name || `Group ${Math.floor(Math.random() * 1000)}`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      lastMessage: '',
      timestamp: nowTime(),
      unread: 0,
      status: 'online',
      isGroup: true,
      isContact: true,
      participants: members,
    };

    setChats((s) => [group, ...s]);
    setMessages((m) => ({ ...m, [group.id]: [] }));
    return group;
  };

  const sendMessage = (chatId: string, text: string, senderId = 'me') => {
    if (!chatId) return null;
    const msg: Message = {
      id: genId(),
      senderId,
      senderName: senderId === 'me' ? 'You' : undefined,
      text,
      timestamp: nowTime(),
      status: 'sent',
      type: 'text',
    };

    setMessages((prev) => {
      const arr = prev[chatId] ? [...prev[chatId], msg] : [msg];
      return { ...prev, [chatId]: arr };
    });

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, lastMessage: text, timestamp: nowTime() } : c))
    );

    return msg;
  };

  const sendAudioMessage = (chatId: string, blob: Blob, meta: { duration?: number } = {}) => {
    if (!chatId) return null;

    // Create an object URL for immediate playback/storage. In production upload to server and replace URL.
    const url = URL.createObjectURL(blob);
    const size = blob.size;

    const msg: Message = {
      id: genId(),
      senderId: 'me',
      senderName: 'You',
      timestamp: nowTime(),
      status: 'sent',
      type: 'audio',
      audio: {
        url,
        duration: meta.duration,
        size,
      },
    };

    setMessages((prev) => {
      const arr = prev[chatId] ? [...prev[chatId], msg] : [msg];
      return { ...prev, [chatId]: arr };
    });

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, lastMessage: 'Voice message', timestamp: nowTime() } : c))
    );

    return msg;
  };

  const sendFileMessage = (chatId: string, file: File) => {
    if (!chatId) return null;

    const url = URL.createObjectURL(file);

    const msg: Message = {
      id: genId(),
      senderId: 'me',
      senderName: 'You',
      timestamp: nowTime(),
      status: 'sent',
      type: 'file',
      file: {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || 'file',
      },
      // stash url in image for quick download preview; in prod put under file.downloadUrl
      image: undefined,
      // attach raw file via extra property so UI or uploader can access it (not persisted)
    };

    // store URL on a temp key in messages by adding audio-like property if needed
    // We'll reuse `audio.url` field for preview if needed, otherwise rely on file metadata and a blob URL map
    // For simplicity attach a pseudo field on the message (allowed in JS runtime)
    (msg as any).fileUrl = url;

    setMessages((prev) => {
      const arr = prev[chatId] ? [...prev[chatId], msg] : [msg];
      return { ...prev, [chatId]: arr };
    });

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, lastMessage: file.name, timestamp: nowTime() } : c))
    );

    return msg;
  };

  const selectChat = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const getMessagesForChat = (chatId: string) => {
    return messages[chatId] || [];
  };

  return (
    <ChatContext.Provider
      value={{ contacts, chats, messages, activeChatId, addContact, createGroup, sendMessage, sendAudioMessage, sendFileMessage, selectChat, getMessagesForChat }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export default ChatContext;
