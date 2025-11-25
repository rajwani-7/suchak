# Emoji & Reactions Implementation Guide

## 1. Emoji Picker Component

### Install Dependencies
```bash
npm install emoji-picker-react emoji-mart lucide-react
```

### EmojiPicker Component
```tsx
// src/components/ui/emoji-picker.tsx
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export const EmojiPickerButton = ({ onEmojiSelect, className }: EmojiPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    onEmojiSelect(emojiObject.emoji);
    setShowPicker(false);
  };

  return (
    <div ref={pickerRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPicker(!showPicker)}
        className="h-9 w-9"
      >
        <Smile className="w-5 h-5" />
      </Button>

      {showPicker && (
        <div className="absolute bottom-12 left-0 z-50 shadow-lg rounded-lg overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
```

## 2. Message Reactions System

### Add to ChatContext
```typescript
// src/context/ChatContext.tsx
interface ChatContextType extends ChatState {
  // ...existing methods...
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
  getMessageReactions: (messageId: string) => Record<string, Set<string>>;
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [reactions, setReactions] = useState<
    Record<string, Record<string, Set<string>>>
  >(() => loadReactionsFromStorage());

  const addReaction = (messageId: string, emoji: string, userId: string) => {
    setReactions((prev) => {
      const updated = { ...prev };
      if (!updated[messageId]) {
        updated[messageId] = {};
      }
      if (!updated[messageId][emoji]) {
        updated[messageId][emoji] = new Set();
      }
      updated[messageId][emoji].add(userId);
      saveReactionsToStorage(updated);
      return updated;
    });

    // Emit to server
    socket.emit('message:react', {
      messageId,
      emoji,
      userId,
      timestamp: new Date()
    });
  };

  const removeReaction = (messageId: string, emoji: string, userId: string) => {
    setReactions((prev) => {
      const updated = { ...prev };
      if (updated[messageId]?.[emoji]) {
        updated[messageId][emoji].delete(userId);
        if (updated[messageId][emoji].size === 0) {
          delete updated[messageId][emoji];
        }
      }
      saveReactionsToStorage(updated);
      return updated;
    });

    socket.emit('message:unreact', {
      messageId,
      emoji,
      userId,
      timestamp: new Date()
    });
  };

  const getMessageReactions = (messageId: string) => {
    return reactions[messageId] || {};
  };

  return (
    <ChatContext.Provider
      value={{
        // ...existing values...
        addReaction,
        removeReaction,
        getMessageReactions
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
```

## 3. Reaction Bubble Component

```tsx
// src/components/app/MessageReactions.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmojiPickerButton } from '@/components/ui/emoji-picker';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  messageId: string;
  reactions: Record<string, Set<string>>;
  currentUserId: string;
  isMe: boolean;
}

export const MessageReactions = ({
  messageId,
  reactions,
  currentUserId,
  isMe
}: MessageReactionsProps) => {
  const { addReaction, removeReaction } = useChat();
  const [showPicker, setShowPicker] = useState(false);

  const handleAddReaction = (emoji: string) => {
    addReaction(messageId, emoji, currentUserId);
    setShowPicker(false);
  };

  const handleToggleReaction = (emoji: string) => {
    if (reactions[emoji]?.has(currentUserId)) {
      removeReaction(messageId, emoji, currentUserId);
    } else {
      addReaction(messageId, emoji, currentUserId);
    }
  };

  if (Object.keys(reactions).length === 0 && !showPicker) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap max-w-xs">
      {Object.entries(reactions).map(([emoji, users]) => {
        const hasReacted = users.has(currentUserId);
        const count = users.size;

        return (
          <button
            key={emoji}
            onClick={() => handleToggleReaction(emoji)}
            className={cn(
              'px-2 py-0.5 rounded-full text-sm flex items-center gap-1 transition-colors',
              hasReacted
                ? 'bg-primary/20 border border-primary'
                : 'bg-muted hover:bg-muted/80 border border-border'
            )}
            title={Array.from(users).join(', ')}
          >
            <span>{emoji}</span>
            {count > 1 && <span className="text-xs font-medium">{count}</span>}
          </button>
        );
      })}

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full"
          onClick={() => setShowPicker(!showPicker)}
        >
          +
        </Button>

        {showPicker && (
          <div className="absolute -top-full left-0 mb-2 z-50">
            <EmojiPickerButton
              onEmojiSelect={handleAddReaction}
              className="inline-block"
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

## 4. Emoji Autocomplete in Message Input

```tsx
// src/components/app/ChatInput.tsx
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmojiPickerButton } from '@/components/ui/emoji-picker';
import { Send } from 'lucide-react';

const EMOJI_DATA = {
  ':smile:': '😊',
  ':laughing:': '😂',
  ':heart:': '❤️',
  ':fire:': '🔥',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':clap:': '👏',
  ':tada:': '🎉',
  ':pray:': '🙏',
  ':rocket:': '🚀'
};

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ code: string; emoji: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Emoji autocomplete: detect :keyword pattern
    const match = value.match(/:(\w+)$/);
    if (match) {
      const keyword = match[1].toLowerCase();
      const matches = Object.entries(EMOJI_DATA)
        .filter(([code]) => code.includes(`:${keyword}`))
        .map(([code, emoji]) => ({ code, emoji }));
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const insertEmoji = (emoji: string) => {
    const lastColonIndex = message.lastIndexOf(':');
    const newMessage = message.substring(0, lastColonIndex) + emoji;
    setMessage(newMessage);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      {/* Emoji autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 w-48 z-50">
          {suggestions.map(({ code, emoji }) => (
            <button
              key={code}
              onClick={() => insertEmoji(emoji)}
              className="w-full text-left px-3 py-2 hover:bg-muted rounded transition-colors flex items-center gap-2"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-sm text-muted-foreground">{code}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <EmojiPickerButton
          onEmojiSelect={(emoji) => setMessage(message + emoji)}
          className="flex-shrink-0"
        />

        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message... (:smile: for emoji)"
          className="flex-1"
        />

        <Button onClick={handleSend} size="icon" className="flex-shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
```

## 5. Backend Emoji Reactions API

```javascript
// backend/routes/messages.js
router.post('/messages/:messageId/reaction', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    // Validate emoji
    const emojiRegex = /(\u00d7\u0021|\u203c|\u20e3|[\u2139-\u3297]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\uddff])/g;
    if (!emojiRegex.test(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }

    // Insert or update reaction
    const reaction = await db.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING
       RETURNING *`,
      [messageId, userId, emoji]
    );

    // Broadcast to all users in chat
    const message = await db.query('SELECT chat_id FROM messages WHERE id = $1', [messageId]);
    const chatId = message.rows[0].chat_id;

    io.to(`chat:${chatId}`).emit('message:reaction-added', {
      messageId,
      emoji,
      userId,
      timestamp: new Date()
    });

    res.json(reaction.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/messages/:messageId/reaction/:emoji', authenticateToken, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    const message = await db.query('SELECT chat_id FROM messages WHERE id = $1', [messageId]);
    const chatId = message.rows[0].chat_id;

    io.to(`chat:${chatId}`).emit('message:reaction-removed', {
      messageId,
      emoji,
      userId,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;

    const reactions = await db.query(
      `SELECT emoji, array_agg(user_id) as users, count(*) as count
       FROM message_reactions
       WHERE message_id = $1
       GROUP BY emoji`,
      [messageId]
    );

    res.json(reactions.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## 6. Storage & Persistence

```typescript
// src/lib/emoji-storage.ts
const EMOJI_REACTIONS_KEY = 'suchak_emoji_reactions';

export const saveReactionsToStorage = (reactions: Record<string, Record<string, Set<string>>>) => {
  try {
    const serialized = Object.entries(reactions).reduce((acc, [msgId, emojis]) => {
      acc[msgId] = Object.entries(emojis).reduce((emojiAcc, [emoji, users]) => {
        emojiAcc[emoji] = Array.from(users);
        return emojiAcc;
      }, {} as Record<string, string[]>);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    localStorage.setItem(EMOJI_REACTIONS_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.error('Failed to save reactions:', e);
  }
};

export const loadReactionsFromStorage = () => {
  try {
    const stored = localStorage.getItem(EMOJI_REACTIONS_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    return Object.entries(parsed).reduce((acc, [msgId, emojis]) => {
      acc[msgId] = Object.entries(emojis as Record<string, string[]>).reduce((emojiAcc, [emoji, users]) => {
        emojiAcc[emoji] = new Set(users);
        return emojiAcc;
      }, {} as Record<string, Set<string>>);
      return acc;
    }, {} as Record<string, Record<string, Set<string>>>);
  } catch (e) {
    console.error('Failed to load reactions:', e);
    return {};
  }
};
```

## 7. Integration in Message Bubble

```tsx
// Updated src/components/app/MessageBubble.tsx
import { MessageReactions } from './MessageReactions';
import { useChat } from '@/context/ChatContext';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  currentUserId: string;
}

export const MessageBubble = ({ message, isMe, currentUserId }: MessageBubbleProps) => {
  const { getMessageReactions } = useChat();
  const reactions = getMessageReactions(message.id);

  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-md px-4 py-2 rounded-lg relative group',
          isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="text-sm">{message.text}</p>

        <MessageReactions
          messageId={message.id}
          reactions={reactions}
          currentUserId={currentUserId}
          isMe={isMe}
        />

        {/* Hover action to add reaction */}
        <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <EmojiPickerButton
            onEmojiSelect={(emoji) => addReaction(message.id, emoji, currentUserId)}
          />
        </div>
      </div>
    </div>
  );
};
```

This provides a complete emoji and reactions system matching WhatsApp's functionality!

