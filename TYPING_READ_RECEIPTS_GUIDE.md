# Typing Indicators & Read Receipts Implementation Guide

## 1. Typing Status Context

```tsx
// src/context/TypingContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
  typingSince: number;
}

interface TypingContextType {
  typingUsers: Map<string, TypingUser>;
  setUserTyping: (chatId: string, userId: string, userName: string) => void;
  setUserNotTyping: (chatId: string, userId: string) => void;
  isUserTyping: (chatId: string, userId: string) => boolean;
  getTypingUsers: (chatId: string) => TypingUser[];
  getTypingMessage: (chatId: string) => string;
}

const TypingContext = createContext<TypingContextType | undefined>(undefined);

export const TypingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const setUserTyping = useCallback((chatId: string, userId: string, userName: string) => {
    const key = `${chatId}:${userId}`;

    // Clear existing timeout
    const existingTimeout = typingTimeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add/update typing user
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, {
        userId,
        userName,
        chatId,
        typingSince: Date.now()
      });
      return newMap;
    });

    // Auto-clear typing status after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setUserNotTyping(chatId, userId);
    }, 3000);

    typingTimeoutsRef.current.set(key, timeout);
  }, []);

  const setUserNotTyping = useCallback((chatId: string, userId: string) => {
    const key = `${chatId}:${userId}`;
    
    const timeout = typingTimeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutsRef.current.delete(key);
    }

    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const isUserTyping = useCallback((chatId: string, userId: string) => {
    return typingUsers.has(`${chatId}:${userId}`);
  }, [typingUsers]);

  const getTypingUsers = useCallback((chatId: string) => {
    return Array.from(typingUsers.values()).filter((u) => u.chatId === chatId);
  }, [typingUsers]);

  const getTypingMessage = useCallback((chatId: string) => {
    const users = getTypingUsers(chatId);
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].userName} is typing...`;
    if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing...`;
    return `${users[0].userName} and ${users.length - 1} others are typing...`;
  }, [getTypingUsers]);

  const value: TypingContextType = {
    typingUsers,
    setUserTyping,
    setUserNotTyping,
    isUserTyping,
    getTypingUsers,
    getTypingMessage
  };

  return (
    <TypingContext.Provider value={value}>
      {children}
    </TypingContext.Provider>
  );
};

export const useTyping = () => {
  const context = useContext(TypingContext);
  if (!context) {
    throw new Error('useTyping must be used within TypingProvider');
  }
  return context;
};
```

## 2. Typing Indicator Hook

```tsx
// src/hooks/useTypingIndicator.ts
import { useCallback, useRef, useEffect } from 'react';

interface UseTypingIndicatorProps {
  chatId: string;
  userId: string;
  userName: string;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export const useTypingIndicator = ({
  chatId,
  userId,
  userName,
  onTypingStart,
  onTypingEnd
}: UseTypingIndicatorProps) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  const notifyTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingEnd?.();
    }, 1000);
  }, [onTypingStart, onTypingEnd]);

  const handleInputChange = useCallback((value: string) => {
    if (value.trim().length > 0) {
      notifyTyping();
    } else {
      isTypingRef.current = false;
      onTypingEnd?.();
    }
  }, [notifyTyping, onTypingEnd]);

  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    onTypingEnd?.();
  }, [onTypingEnd]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    handleInputChange,
    notifyTyping,
    cleanup
  };
};
```

## 3. Typing Indicator UI

```tsx
// src/components/app/TypingIndicator.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userNames: string[];
  className?: string;
}

export const TypingIndicator = ({ userNames, className }: TypingIndicatorProps) => {
  if (userNames.length === 0) return null;

  const getMessage = () => {
    if (userNames.length === 1) return `${userNames[0]} is typing`;
    if (userNames.length === 2) return `${userNames[0]} and ${userNames[1]} are typing`;
    return `${userNames[0]} and ${userNames.length - 1} others are typing`;
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground py-2', className)}>
      <span>{getMessage()}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
};
```

## 4. Read Receipts Context

```tsx
// src/context/ReadReceiptsContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type ReadStatus = 'sent' | 'delivered' | 'read';

interface MessageReadReceipt {
  messageId: string;
  userId: string;
  status: ReadStatus;
  timestamp: Date;
}

interface ReadReceiptsContextType {
  receipts: Map<string, MessageReadReceipt[]>;
  addReceipt: (messageId: string, userId: string, status: ReadStatus) => void;
  getMessageReceipts: (messageId: string) => MessageReadReceipt[];
  updateMessageStatus: (messageId: string, status: ReadStatus) => void;
  markChatAsRead: (chatId: string) => void;
}

const ReadReceiptsContext = createContext<ReadReceiptsContextType | undefined>(undefined);

export const ReadReceiptsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [receipts, setReceipts] = useState<Map<string, MessageReadReceipt[]>>(new Map());

  const addReceipt = useCallback((messageId: string, userId: string, status: ReadStatus) => {
    setReceipts((prev) => {
      const newMap = new Map(prev);
      const messageReceipts = newMap.get(messageId) || [];

      // Check if receipt already exists
      const existingIndex = messageReceipts.findIndex((r) => r.userId === userId);
      if (existingIndex >= 0) {
        messageReceipts[existingIndex] = {
          messageId,
          userId,
          status,
          timestamp: new Date()
        };
      } else {
        messageReceipts.push({
          messageId,
          userId,
          status,
          timestamp: new Date()
        });
      }

      newMap.set(messageId, messageReceipts);
      return newMap;
    });
  }, []);

  const getMessageReceipts = useCallback((messageId: string) => {
    return receipts.get(messageId) || [];
  }, [receipts]);

  const updateMessageStatus = useCallback((messageId: string, status: ReadStatus) => {
    setReceipts((prev) => {
      const newMap = new Map(prev);
      const messageReceipts = newMap.get(messageId) || [];

      messageReceipts.forEach((receipt) => {
        // Upgrade status if new status is higher
        if (status === 'read' || (status === 'delivered' && receipt.status === 'sent')) {
          receipt.status = status;
          receipt.timestamp = new Date();
        }
      });

      newMap.set(messageId, messageReceipts);
      return newMap;
    });
  }, []);

  const markChatAsRead = useCallback((chatId: string) => {
    // Update all messages in chat to 'read' status
    setReceipts((prev) => {
      const newMap = new Map(prev);
      Array.from(newMap.entries()).forEach(([messageId, messageReceipts]) => {
        messageReceipts.forEach((receipt) => {
          receipt.status = 'read';
          receipt.timestamp = new Date();
        });
      });
      return newMap;
    });
  }, []);

  const value: ReadReceiptsContextType = {
    receipts,
    addReceipt,
    getMessageReceipts,
    updateMessageStatus,
    markChatAsRead
  };

  return (
    <ReadReceiptsContext.Provider value={value}>
      {children}
    </ReadReceiptsContext.Provider>
  );
};

export const useReadReceipts = () => {
  const context = useContext(ReadReceiptsContext);
  if (!context) {
    throw new Error('useReadReceipts must be used within ReadReceiptsProvider');
  }
  return context;
};
```

## 5. Read Receipt Indicator Component

```tsx
// src/components/app/ReadReceiptIndicator.tsx
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReadStatus } from '@/context/ReadReceiptsContext';

interface ReadReceiptIndicatorProps {
  status: ReadStatus;
  readBy?: Array<{ userId: string; userName: string; timestamp: Date }>;
}

export const ReadReceiptIndicator = ({ status, readBy = [] }: ReadReceiptIndicatorProps) => {
  const getIcon = () => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getTooltip = () => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        if (readBy.length === 0) return 'Read';
        if (readBy.length === 1) {
          return `Read by ${readBy[0].userName} at ${readBy[0].timestamp.toLocaleTimeString()}`;
        }
        return `Read by ${readBy.length} people`;
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1">
            {getIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{getTooltip()}</p>
          {readBy.length > 1 && status === 'read' && (
            <ul className="mt-2 text-xs">
              {readBy.map((user) => (
                <li key={user.userId}>
                  {user.userName}: {user.timestamp.toLocaleTimeString()}
                </li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

## 6. Updated Message Component with Read Receipts

```tsx
// src/components/app/MessageBubble.tsx (Updated)
import React from 'react';
import { useReadReceipts } from '@/context/ReadReceiptsContext';
import { ReadReceiptIndicator } from './ReadReceiptIndicator';

interface MessageBubbleProps {
  id: string;
  content: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
  readStatus?: 'sent' | 'delivered' | 'read';
}

export const MessageBubble = ({
  id,
  content,
  senderName,
  timestamp,
  isOwn,
  readStatus = 'sent'
}: MessageBubbleProps) => {
  const { getMessageReceipts } = useReadReceipts();
  const receipts = getMessageReceipts(id);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted text-muted-foreground rounded-bl-none'
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold mb-1">{senderName}</p>
        )}
        <p className="text-sm break-words">{content}</p>
        <div className={`flex items-center gap-1 text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <span>{formatTime(timestamp)}</span>
          {isOwn && (
            <ReadReceiptIndicator
              status={readStatus}
              readBy={receipts.map((r) => ({
                userId: r.userId,
                userName: 'User', // Get from user context
                timestamp: r.timestamp
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

## 7. Backend Integration

```javascript
// backend/routes/readReceipts.js
router.post('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Record read receipt
    await db.query(
      `INSERT INTO message_read_receipts (message_id, user_id, read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET read_at = NOW()`,
      [messageId, userId]
    );

    // Get message and broadcast
    const message = await db.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );

    const msg = message.rows[0];

    // Emit read receipt through WebSocket
    io.to(`chat:${msg.chat_id}`).emit('message:read', {
      messageId,
      userId,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages/:messageId/receipts', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const receipts = await db.query(
      `SELECT mrr.user_id, mrr.read_at, u.name
       FROM message_read_receipts mrr
       JOIN users u ON mrr.user_id = u.id
       WHERE mrr.message_id = $1
       ORDER BY mrr.read_at DESC`,
      [messageId]
    );

    res.json(receipts.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  socket.on('typing:start', async (data) => {
    const { chatId, userId, userName } = data;
    socket.broadcast.to(`chat:${chatId}`).emit('user:typing', {
      userId,
      userName,
      chatId
    });
  });

  socket.on('typing:stop', (data) => {
    const { chatId, userId } = data;
    socket.broadcast.to(`chat:${chatId}`).emit('user:stopped-typing', {
      userId,
      chatId
    });
  });

  socket.on('chat:mark-read', async (data) => {
    const { chatId, userId } = data;

    // Mark all messages in chat as read
    await db.query(
      `UPDATE message_read_receipts SET read_at = NOW()
       WHERE message_id IN (SELECT id FROM messages WHERE chat_id = $1)
       AND user_id = $2`,
      [chatId, userId]
    );

    socket.broadcast.to(`chat:${chatId}`).emit('chat:marked-read', {
      chatId,
      userId
    });
  });
});
```

## 8. Updating MainApp.tsx

```tsx
// Update your MainApp.tsx to include new providers
import { TypingProvider } from '@/context/TypingContext';
import { ReadReceiptsProvider } from '@/context/ReadReceiptsContext';

export const MainApp = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <TypingProvider>
          <ReadReceiptsProvider>
            {/* Your main layout */}
          </ReadReceiptsProvider>
        </TypingProvider>
      </ChatProvider>
    </AuthProvider>
  );
};
```

This implementation provides complete typing indicators and read receipts functionality with real-time updates!

