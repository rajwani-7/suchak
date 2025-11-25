# WhatsApp-Like Chat Application - Complete Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Real-time Architecture](#real-time-architecture)
6. [Security](#security)
7. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### Core Components
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React/TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│ • Chat UI                                                    │
│ • Media Uploader                                            │
│ • Emoji Picker                                              │
│ • Call Screen                                               │
│ • Media Compression (Client-side)                           │
└─────────────┬───────────────────────────────────┬───────────┘
              │ HTTP/REST                         │ WebSocket
              ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│            API GATEWAY / LOAD BALANCER                      │
└─────────────┬───────────────────────────────────┬───────────┘
              │                                   │
              ▼                                   ▼
┌──────────────────────────┐    ┌────────────────────────────┐
│  REST API Server         │    │  WebSocket Server (Socket) │
│  (Node.js/Express)       │    │  (Node.js/Socket.io)       │
├──────────────────────────┤    ├────────────────────────────┤
│ • Auth                   │    │ • Real-time Messages       │
│ • File Upload (S3/Azure) │    │ • Typing Indicators        │
│ • Message CRUD           │    │ • Online Status            │
│ • User Management        │    │ • Call Signaling           │
│ • Chat Management        │    │ • Presence                 │
│ • Call Logs              │    │ • Seen/Delivered Receipts  │
└──────────────────────────┘    └────────────────────────────┘
              │                                   │
              └─────────────────┬─────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│ • PostgreSQL (Primary - Relational Data)                   │
│ • Redis (Cache & Session Store)                            │
│ • MongoDB (Optional - Message History Archive)             │
│ • S3/Azure Blob (Media Storage)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
```javascript
{
  "core": {
    "react": "^18.x",
    "typescript": "^5.x",
    "react-router-dom": "^6.x",
    "react-query": "@tanstack/react-query"
  },
  "state-management": {
    "zustand": "^4.x",  // Lightweight alternative to Redux
    "context-api": "built-in"
  },
  "real-time": {
    "socket.io-client": "^4.x",
    "webrtc": "built-in browser API"
  },
  "media": {
    "react-webcam": "^7.x",
    "sharp-image-processor": "for client-side compression",
    "emoji-picker-react": "^4.x",
    "emoji-mart": "alternative option"
  },
  "ui": {
    "tailwindcss": "^3.x",
    "shadcn/ui": "for components",
    "framer-motion": "^10.x"  // Smooth animations
  },
  "utilities": {
    "axios": "HTTP client",
    "date-fns": "Date formatting",
    "lodash": "Utilities",
    "crypto-js": "Client-side encryption"
  }
}
```

### Backend
```javascript
{
  "server": {
    "node.js": "^18.x+",
    "express": "^4.x",
    "socket.io": "^4.x"
  },
  "database": {
    "postgresql": "^15.x",
    "redis": "^7.x",
    "prisma": "ORM"
  },
  "authentication": {
    "jsonwebtoken": "JWT",
    "bcrypt": "Password hashing",
    "passport.js": "Optional"
  },
  "file-storage": {
    "aws-sdk": "S3",
    "multer": "File upload middleware",
    "sharp": "Image compression & processing"
  },
  "real-time": {
    "socket.io": "WebSocket abstraction",
    "redis": "Socket adapter for scaling"
  },
  "media": {
    "simple-peer": "WebRTC wrapper",
    "wrtc": "Node.js WebRTC implementation",
    "ffmpeg": "Audio/video processing"
  },
  "security": {
    "express-rate-limit": "Rate limiting",
    "helmet": "Security headers",
    "express-validator": "Input validation",
    "crypto": "Encryption"
  },
  "monitoring": {
    "winston": "Logging",
    "sentry": "Error tracking"
  }
}
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  status ENUM('online', 'offline', 'away') DEFAULT 'offline',
  last_seen TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chats Table (1-to-1 or Group)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_type ENUM('direct', 'group') DEFAULT 'direct',
  group_name VARCHAR(255),
  group_avatar TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);

-- Chat Participants (For group chats & storing members)
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  muted_until TIMESTAMP,
  last_read_message_id UUID,
  last_read_at TIMESTAMP,
  UNIQUE(chat_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  message_type ENUM('text', 'image', 'video', 'audio', 'document', 'system') DEFAULT 'text',
  media_url TEXT,
  media_file_key TEXT, -- S3/Azure key for secure deletion
  media_size INT,
  duration INT, -- For audio/video in seconds
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  forwarded_from_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by UUID, -- Who deleted it (for delete-for-everyone)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_chat_id_created_at (chat_id, created_at DESC)
);

-- Message Receipts (Seen, Delivered, Read)
CREATE TABLE message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_type ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  received_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Message Reactions (Emoji reactions)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- Unicode emoji
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Calls Table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  call_type ENUM('voice', 'video') DEFAULT 'voice',
  status ENUM('initiating', 'ringing', 'ongoing', 'ended', 'rejected', 'missed') DEFAULT 'initiating',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INT,
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  call_quality ENUM('poor', 'fair', 'good', 'excellent'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Call Logs (For historical records)
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  event_type ENUM('initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended') DEFAULT 'initiated',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Chat Backup/Export
CREATE TABLE chat_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  backup_url TEXT NOT NULL,
  backup_size INT,
  created_at TIMESTAMP DEFAULT NOW(),
  restored_at TIMESTAMP
);

-- Blocked Users
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Typing Indicators (Ephemeral, can use Redis instead)
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '3 seconds'
);
```

### Redis Schema (Cache & Real-time)
```
User Presence:
  user:{user_id}:status -> "online" | "offline" | "away"
  user:{user_id}:last_seen -> ISO timestamp
  
Socket Connections:
  socket:{socket_id}:user_id -> user UUID
  user:{user_id}:sockets -> Set of socket IDs
  
Message Cache:
  chat:{chat_id}:messages:{page} -> JSON array of messages
  message:{message_id} -> Message object
  
Typing Indicators:
  chat:{chat_id}:typing -> Set of user IDs currently typing
  
Call Signaling:
  call:{call_id}:status -> "initiating" | "ringing" | "ongoing"
  call:{call_id}:participants -> Set of user IDs
  
Temporary Tokens:
  otp:{phone_number} -> OTP token
  reset_token:{token} -> User ID
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register              - Register user
POST   /api/auth/login                 - Login with phone OTP
POST   /api/auth/verify-otp            - Verify OTP
POST   /api/auth/logout                - Logout
POST   /api/auth/refresh-token         - Refresh JWT
```

### Users
```
GET    /api/users/:user_id             - Get user profile
PUT    /api/users/:user_id             - Update profile
GET    /api/users/search?q=name        - Search users
PUT    /api/users/:user_id/status      - Update online status
POST   /api/users/:user_id/avatar      - Upload avatar
GET    /api/users/:user_id/blocked     - Get blocked users list
POST   /api/users/:user_id/block       - Block user
DELETE /api/users/:user_id/unblock     - Unblock user
```

### Chats
```
POST   /api/chats                      - Create chat (direct or group)
GET    /api/chats                      - Get all chats (paginated)
GET    /api/chats/:chat_id             - Get chat details
PUT    /api/chats/:chat_id             - Update chat (group name, avatar)
DELETE /api/chats/:chat_id             - Archive/delete chat
GET    /api/chats/:chat_id/members     - Get group members
POST   /api/chats/:chat_id/members     - Add member to group
DELETE /api/chats/:chat_id/members/:user_id - Remove member
PUT    /api/chats/:chat_id/mute        - Mute chat
POST   /api/chats/:chat_id/archive     - Archive chat
POST   /api/chats/:chat_id/backup      - Backup chat
```

### Messages
```
POST   /api/chats/:chat_id/messages    - Send message
GET    /api/chats/:chat_id/messages    - Get messages (paginated)
GET    /api/messages/:message_id       - Get single message
PUT    /api/messages/:message_id       - Edit message
DELETE /api/messages/:message_id       - Delete message (for me / for everyone)
POST   /api/messages/:message_id/forward - Forward message
POST   /api/messages/:message_id/reply - Reply to message
GET    /api/messages/search?q=text     - Search messages
```

### Message Receipts & Reactions
```
POST   /api/messages/:message_id/read  - Mark as read
POST   /api/messages/:message_id/reaction - Add emoji reaction
DELETE /api/messages/:message_id/reaction/:emoji - Remove reaction
GET    /api/messages/:message_id/reactions - Get all reactions
```

### Media Upload
```
POST   /api/upload/image               - Upload image (jpg, png, webp)
POST   /api/upload/video               - Upload video (mp4, mov)
POST   /api/upload/audio               - Upload audio (m4a, ogg)
POST   /api/upload/document            - Upload document (pdf, docx, etc)
POST   /api/upload/batch               - Batch upload multiple files
GET    /api/media/:file_id/download    - Download media
DELETE /api/media/:file_id             - Delete media
```

### Calls
```
POST   /api/calls/initiate             - Initiate call (voice/video)
POST   /api/calls/:call_id/answer      - Answer call
POST   /api/calls/:call_id/reject      - Reject call
POST   /api/calls/:call_id/end         - End call
GET    /api/calls/logs                 - Get call history
GET    /api/calls/:call_id/stats       - Get call quality stats
POST   /api/calls/:call_id/record      - Start recording (optional)
```

---

## Real-time Architecture

### WebSocket Events (Socket.io)

#### Connection Events
```javascript
// Client connects
socket.on('connect', () => {
  socket.emit('user:online', { userId, timestamp });
});

// Client disconnects
socket.on('disconnect', () => {
  // Server marks user as offline after timeout
});
```

#### Messaging Events
```javascript
// Send message
socket.emit('message:send', {
  chatId,
  content,
  messageType: 'text' | 'image' | 'audio' | 'document',
  replyToId?: string,
  forwardedFromId?: string
});

// Receive message
socket.on('message:received', (message) => {
  // Update UI with new message
});

// Message delivered
socket.on('message:delivered', { messageId, deliveredAt });

// Message read
socket.on('message:read', { messageId, readAt, readBy });

// Message edited
socket.emit('message:edit', { messageId, newContent });
socket.on('message:edited', (updatedMessage));

// Message deleted
socket.emit('message:delete', { messageId, deleteForEveryone });
socket.on('message:deleted', { messageId, deletedAt });

// Message reaction
socket.emit('message:react', { messageId, emoji });
socket.on('message:reaction-added', { messageId, emoji, userId });
socket.on('message:reaction-removed', { messageId, emoji, userId });
```

#### Presence Events
```javascript
// User typing
socket.emit('user:typing', { chatId, userId });
socket.on('user:typing', { chatId, userId, typingUsers });

// User stopped typing
socket.emit('user:stop-typing', { chatId, userId });
socket.on('user:stop-typing', { chatId, userId });

// Online status
socket.emit('user:status-change', { userId, status: 'online' | 'away' | 'offline' });
socket.on('user:status-changed', { userId, status, timestamp });

// Last seen
socket.on('user:last-seen', { userId, timestamp });
```

#### Call Events
```javascript
// Initiate call
socket.emit('call:initiate', {
  recipientId,
  callType: 'voice' | 'video',
  roomId
});

// Call ringing
socket.on('call:ringing', {
  callId,
  initiatorId,
  initiatorName,
  callType
});

// Call answer
socket.emit('call:answer', { callId, roomId });
socket.on('call:answered', { callId });

// Call reject
socket.emit('call:reject', { callId, reason });
socket.on('call:rejected', { callId, reason });

// Call end
socket.emit('call:end', { callId });
socket.on('call:ended', { callId, duration });

// ICE candidate (WebRTC)
socket.emit('webrtc:ice-candidate', {
  callId,
  candidate
});

// SDP offer/answer (WebRTC)
socket.emit('webrtc:offer', { callId, offer });
socket.emit('webrtc:answer', { callId, answer });

// Call quality update
socket.emit('call:quality', {
  callId,
  quality: 'poor' | 'fair' | 'good' | 'excellent'
});
```

#### Group Chat Events
```javascript
socket.emit('group:member-added', { chatId, newMemberId });
socket.on('group:member-added', { chatId, newMember });

socket.emit('group:member-removed', { chatId, removedMemberId });
socket.on('group:member-removed', { chatId, removedMemberId });

socket.emit('group:name-changed', { chatId, newName });
socket.on('group:name-changed', { chatId, newName });
```

---

## Security

### Authentication & Authorization
```javascript
// JWT Token Structure
{
  "iss": "suchak-app",
  "sub": "user-uuid",
  "phone": "+91xxxxxxxxxx",
  "role": "user",
  "iat": timestamp,
  "exp": timestamp + 24hours,
  "refresh_exp": timestamp + 7days
}

// Rate Limiting
- Login attempts: 5 per minute per IP
- API calls: 100 per minute per user
- File uploads: 50MB per upload, 500MB per day per user

// Input Validation
- Message length: Max 4096 characters
- File size: Images (25MB), Videos (100MB), Documents (50MB)
- Media types whitelist validation
```

### End-to-End Encryption (Simulation)
```javascript
// Client-side encryption before sending
const encryptMessage = (content, sharedKey) => {
  return CryptoJS.AES.encrypt(content, sharedKey).toString();
};

// Server stores encrypted message
const decryptMessage = (encryptedContent, sharedKey) => {
  return CryptoJS.AES.decrypt(encryptedContent, sharedKey).toString(CryptoJS.enc.Utf8);
};

// Only intended recipient can decrypt with shared key
```

### Data Protection
```
- All API calls over HTTPS/TLS 1.2+
- Passwords hashed with bcrypt (12+ rounds)
- Media files encrypted at rest (S3 SSE-S3)
- Database backups encrypted
- PII data (phone numbers) partially masked in logs
- Session tokens invalidated on logout
- CORS restricted to whitelisted domains
```

### Media Security
```
- File type validation (MIME type + magic bytes)
- Virus scanning for uploads (ClamAV)
- Image metadata stripped (EXIF data removal)
- Secure file URLs with signed/temporary tokens
- S3 pre-signed URLs expire after 24 hours
- Media deletion cascades when message is deleted
```

---

## Implementation Roadmap

### Phase 1: Core Messaging (Week 1-2)
- [ ] User authentication (phone + OTP)
- [ ] Create/fetch chats
- [ ] Send/receive text messages
- [ ] WebSocket connection
- [ ] Online status
- [ ] Message delivery status

### Phase 2: Media & Files (Week 3-4)
- [ ] Image upload with preview
- [ ] File upload (documents)
- [ ] Client-side image compression
- [ ] Media preview UI
- [ ] Batch file upload

### Phase 3: Advanced Messaging (Week 5-6)
- [ ] Message reactions (emoji picker)
- [ ] Reply/quote messages
- [ ] Message forwarding
- [ ] Message editing
- [ ] Message deletion (for me / for everyone)
- [ ] Message search

### Phase 4: Presence & Typing (Week 7)
- [ ] Real-time typing indicator
- [ ] Last seen timestamp
- [ ] Online/offline/away status
- [ ] Read receipts

### Phase 5: Calling (Week 8-9)
- [ ] WebRTC setup
- [ ] Voice calls
- [ ] Video calls
- [ ] Call UI (ringing, in-call)
- [ ] Call logs
- [ ] Call quality monitoring

### Phase 6: Audio Features (Week 10)
- [ ] Voice recording (push-to-talk)
- [ ] Audio message playback
- [ ] Emoji autocomplete
- [ ] Message reactions UI

### Phase 7: Group Chats (Week 11)
- [ ] Create groups
- [ ] Add/remove members
- [ ] Group notifications
- [ ] Group admin controls
- [ ] Group media archive

### Phase 8: Advanced Features (Week 12+)
- [ ] Chat backup/restore
- [ ] Message pin
- [ ] Chat wallpaper
- [ ] Notifications preferences
- [ ] End-to-end encryption
- [ ] Performance optimization

---

## Performance Optimization

### Frontend
```javascript
// Message virtualization (don't render all messages)
import { FixedSizeList } from 'react-window';

// Memoization
const MessageBubble = React.memo(({ message }) => {...});

// Image lazy loading
<img loading="lazy" src={url} />

// Code splitting
const CallScreen = lazy(() => import('./CallScreen'));

// Service Worker for offline support
// Compress images before upload
```

### Backend
```javascript
// Database indexing
- Index on (chat_id, created_at DESC) for message queries
- Index on user_id for user-specific queries

// Caching strategy
- Redis cache for active chats
- LRU cache for recently accessed messages
- CDN for media files

// Query optimization
- Pagination (limit 50 messages per request)
- Select only required fields
- Use connection pooling

// Message queuing
- Bull/BullMQ for async tasks
- Background jobs for media processing
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│      CloudFlare / AWS CloudFront       │ (CDN)
│      (Media delivery + DDoS protection)│
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│     AWS ALB / Nginx Load Balancer      │
└────────┬──────────────────────┬─────────┘
         │                      │
    ┌────▼────┐            ┌────▼────┐
    │API Pod 1 │            │API Pod 2 │  (Auto-scaling)
    └─────────┘            └─────────┘
         │                      │
    ┌────▼────┐            ┌────▼────┐
    │Socket 1  │            │Socket 2  │  (WebSocket)
    └─────────┘            └─────────┘
         └────────┬─────────┘
                  │
        ┌─────────▼──────────┐
        │   PostgreSQL RDS   │
        │   (Multi-AZ)       │
        └────────────────────┘
        ┌─────────┐
        │  Redis  │
        │ Cluster │
        └────────┘
        ┌─────────┐
        │ S3/Blob │
        │ Storage │
        └────────┘
```

---

## Key Metrics & Monitoring

```
Performance Metrics:
- Message send latency: < 500ms
- WebSocket connection time: < 1s
- Media upload speed: > 5MB/s
- Video codec: VP9/H.264
- Audio codec: Opus (20-128 kbps)

Availability:
- API uptime: 99.9%
- WebSocket stability: 99.95%
- Call success rate: > 98%

Scaling:
- Support 10M+ concurrent users
- 1M+ messages/second throughput
- 100K+ concurrent calls
```

---

## Next Steps

1. Set up backend API with Express + TypeScript
2. Configure WebSocket server with Socket.io
3. Set up PostgreSQL + Redis
4. Implement authentication flow
5. Build React frontend components
6. Integrate WebRTC for calling
7. Set up media upload pipeline
8. Implement real-time features
9. Add security measures
10. Deploy and monitor

