# Voice & Video Calling Implementation Guide

## 1. WebRTC Setup

### Install Dependencies
```bash
npm install simple-peer socket.io-client
npm install --save-dev @types/simple-peer
```

### WebRTC Peer Hook
```tsx
// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer, { Instance as PeerInstance } from 'simple-peer';
import { useChat } from '@/context/ChatContext';

interface UseWebRTCProps {
  callId: string;
  isInitiator: boolean;
  callType: 'voice' | 'video';
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnd?: () => void;
}

export const useWebRTC = ({
  callId,
  isInitiator,
  callType,
  onLocalStream,
  onRemoteStream,
  onCallEnd
}: UseWebRTCProps) => {
  const peerRef = useRef<PeerInstance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  const constraints: MediaStreamConstraints = {
    audio: true,
    video: callType === 'video' ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    } : false
  };

  const initializePeer = useCallback(async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      onLocalStream?.(stream);

      // Create peer connection
      const peerInstance = new SimplePeer({
        initiator: isInitiator,
        trickleIce: true,
        stream,
        config: {
          iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
            {
              urls: [process.env.REACT_APP_TURN_SERVER || 'turn:turnserver.example.com'],
              username: process.env.REACT_APP_TURN_USERNAME,
              credential: process.env.REACT_APP_TURN_PASSWORD
            }
          ]
        }
      });

      peerInstance.on('signal', (data) => {
        // Send signal data through WebSocket
        socketRef.current?.emit('webrtc:signal', {
          callId,
          signal: data
        });
      });

      peerInstance.on('stream', (stream: MediaStream) => {
        onRemoteStream?.(stream);
      });

      peerInstance.on('connect', () => {
        setConnectionState('connected');
      });

      peerInstance.on('error', (err) => {
        console.error('WebRTC Error:', err);
        setError(err.message);
        setConnectionState('failed');
      });

      peerInstance.on('close', () => {
        setConnectionState('disconnected');
        onCallEnd?.();
      });

      peerInstance.on('signal', (data) => {
        console.log('Signal data:', data);
      });

      peerRef.current = peerInstance;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize peer';
      setError(errorMsg);
      setConnectionState('failed');
    }
  }, [isInitiator, callType, onLocalStream, onRemoteStream, callEnd]);

  const handleSignal = useCallback((signal: any) => {
    if (peerRef.current) {
      peerRef.current.signal(signal);
    }
  }, []);

  const endCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onCallEnd?.();
  }, [onCallEnd]);

  const toggleAudio = useCallback((enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (callType === 'video' && localStreamRef.current) {
      try {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const constraints: any = {
          audio: false,
          video: {
            facingMode: videoTrack.getSettings().facingMode === 'user' ? 'environment' : 'user'
          }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        const newVideoTrack = newStream.getVideoTracks()[0];

        const sender = peerRef.current
          ?.getSenders?.()
          ?.find((s: any) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        videoTrack.stop();
      } catch (err) {
        console.error('Camera switch error:', err);
      }
    }
  }, [callType]);

  return {
    initializePeer,
    handleSignal,
    endCall,
    toggleAudio,
    toggleVideo,
    switchCamera,
    connectionState,
    error,
    localStream: localStreamRef.current,
    peer: peerRef.current
  };
};
```

## 2. Call Screen Component

```tsx
// src/components/app/CallScreen.tsx
import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useWebRTC } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface CallScreenProps {
  callId: string;
  recipientName: string;
  recipientAvatar: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  onCallEnd: () => void;
  onStatusChange?: (status: string) => void;
}

export const CallScreen = ({
  callId,
  recipientName,
  recipientAvatar,
  callType,
  isInitiator,
  onCallEnd,
  onStatusChange
}: CallScreenProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(callType === 'video');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  const { initializePeer, handleSignal, endCall, toggleAudio, toggleVideo, switchCamera, connectionState } = useWebRTC({
    callId,
    isInitiator,
    callType,
    onLocalStream: setLocalStream,
    onRemoteStream: setRemoteStream,
    onCallEnd: () => {
      onCallEnd();
    }
  });

  // Initialize WebRTC
  useEffect(() => {
    initializePeer();
  }, [initializePeer]);

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer
  useEffect(() => {
    if (connectionState === 'connected') {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [connectionState]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const handleEndCall = () => {
    endCall();
    onCallEnd();
  };

  const handleToggleAudio = () => {
    toggleAudio(!audioEnabled);
    setAudioEnabled(!audioEnabled);
    onStatusChange?.(audioEnabled ? 'Audio off' : 'Audio on');
  };

  const handleToggleVideo = () => {
    toggleVideo(!videoEnabled);
    setVideoEnabled(!videoEnabled);
  };

  return (
    <div className={cn(
      'fixed inset-0 bg-black flex flex-col items-center justify-center z-50',
      callType === 'voice' && 'bg-gradient-to-br from-primary/20 to-primary/10'
    )}>
      {/* Video Container */}
      {callType === 'video' ? (
        <div className="relative w-full h-full">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Local Video (PIP) */}
          <div className="absolute bottom-20 right-4 w-24 h-32 bg-black rounded-lg overflow-hidden border-2 border-primary">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Connection Status */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
            {connectionState === 'connecting' && '⏳ Connecting...'}
            {connectionState === 'connected' && `📞 ${formatDuration(callDuration)}`}
            {connectionState === 'failed' && '❌ Connection failed'}
          </div>
        </div>
      ) : (
        // Voice Call UI
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>{recipientName[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">{recipientName}</h2>
            <p className="text-lg text-gray-300">
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'connected' && formatDuration(callDuration)}
              {connectionState === 'failed' && 'Call failed'}
            </p>
          </div>

          {/* Local Audio Visualization (Voice only) */}
          {localStream && (
            <div className="flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary animate-pulse"
                  style={{
                    height: `${20 + i * 15}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video element for local video in voice mode */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />

      {/* Controls */}
      <div className="fixed bottom-8 left-0 right-0 flex items-center justify-center gap-4 z-50">
        {/* Audio Toggle */}
        <Button
          onClick={handleToggleAudio}
          className={cn(
            'rounded-full w-14 h-14',
            audioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
          )}
        >
          {audioEnabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </Button>

        {/* Video Toggle (only for video calls) */}
        {callType === 'video' && (
          <Button
            onClick={handleToggleVideo}
            className={cn(
              'rounded-full w-14 h-14',
              videoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {videoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>
        )}

        {/* Camera Switch (video calls) */}
        {callType === 'video' && (
          <Button
            onClick={switchCamera}
            className="rounded-full w-14 h-14 bg-gray-600 hover:bg-gray-700"
          >
            <RotateCw className="w-6 h-6" />
          </Button>
        )}

        {/* End Call */}
        <Button
          onClick={handleEndCall}
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};
```

## 3. Incoming Call UI

```tsx
// src/components/app/IncomingCall.tsx
import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface IncomingCallProps {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callType: 'voice' | 'video';
  onAccept: (callId: string, callType: 'voice' | 'video') => void;
  onReject: (callId: string) => void;
}

export const IncomingCall = ({
  callId,
  callerId,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject
}: IncomingCallProps) => {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Play ringtone
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==');
    audio.loop = true;
    audio.play().catch((e) => console.error('Could not play ringtone:', e));

    return () => {
      audio.pause();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl p-8 w-96 text-center space-y-6">
        {/* Caller Avatar */}
        <div className="flex justify-center">
          <Avatar className="w-24 h-24">
            <AvatarImage src={callerAvatar} />
            <AvatarFallback>{callerName[0]}</AvatarFallback>
          </Avatar>
        </div>

        {/* Call Type */}
        <div className="flex items-center justify-center gap-2">
          {callType === 'video' ? (
            <Video className="w-5 h-5 text-primary" />
          ) : (
            <Phone className="w-5 h-5 text-primary" />
          )}
          <span className="text-sm text-muted-foreground capitalize">{callType} call</span>
        </div>

        {/* Caller Name */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{callerName}</h2>
          <p className="text-sm text-muted-foreground">Incoming {callType} call...</p>
        </div>

        {/* Pulsing Indicator */}
        {isRinging && (
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={() => onReject(callId)}
            variant="destructive"
            className="flex-1 rounded-full h-14"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            Decline
          </Button>
          <Button
            onClick={() => onAccept(callId, callType)}
            className="flex-1 rounded-full h-14 bg-green-600 hover:bg-green-700"
          >
            <Phone className="w-5 h-5 mr-2" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
```

## 4. Call Logs Component

```tsx
// src/components/app/CallLogs.tsx
import React from 'react';
import { Phone, Video, Clock, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Call {
  id: string;
  contactName: string;
  contactAvatar: string;
  callType: 'voice' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  duration: number;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
}

interface CallLogsProps {
  calls: Call[];
  onCallClick?: (callId: string, contactId: string) => void;
}

export const CallLogs = ({ calls, onCallClick }: CallLogsProps) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now.setDate(now.getDate() - 1));

    if (date.toDateString() === new Date().toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {calls.map((call) => (
          <div
            key={call.id}
            onClick={() => onCallClick?.(call.id, call.contactName)}
            className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={call.contactAvatar} />
                <AvatarFallback>{call.contactName[0]}</AvatarFallback>
              </Avatar>

              {/* Call Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">{call.contactName}</h3>
                  {call.callType === 'video' ? (
                    <Video className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {call.status === 'missed' && <span className="text-red-500">• Missed</span>}
                  {call.status === 'completed' && (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(call.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatTime(call.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
```

## 5. Backend Call Management API

```javascript
// backend/routes/calls.js
router.post('/calls/initiate', authenticateToken, async (req, res) => {
  try {
    const { recipientId, callType } = req.body;
    const initiatorId = req.user.id;

    // Create call record
    const call = await db.query(
      `INSERT INTO calls (initiator_id, recipient_id, call_type, status)
       VALUES ($1, $2, $3, 'initiating')
       RETURNING id`,
      [initiatorId, recipientId, callType]
    );

    const callId = call.rows[0].id;

    // Emit through WebSocket
    io.to(`user:${recipientId}`).emit('call:incoming', {
      callId,
      initiatorId,
      initiatorName: req.user.name,
      initiatorAvatar: req.user.avatar,
      callType,
      timestamp: new Date()
    });

    res.json({ callId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/calls/:callId/answer', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    await db.query(
      'UPDATE calls SET status = $1, started_at = NOW() WHERE id = $2',
      ['ongoing', callId]
    );

    const call = await db.query('SELECT * FROM calls WHERE id = $1', [callId]);
    const callData = call.rows[0];

    io.to(`call:${callId}`).emit('call:answered', {
      callId,
      answeredBy: req.user.id,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/calls/:callId/end', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await db.query(
      'SELECT started_at FROM calls WHERE id = $1',
      [callId]
    );

    const duration = call.rows[0].started_at
      ? Math.floor((Date.now() - new Date(call.rows[0].started_at).getTime()) / 1000)
      : 0;

    await db.query(
      'UPDATE calls SET status = $1, ended_at = NOW(), duration_seconds = $2 WHERE id = $3',
      ['ended', duration, callId]
    );

    io.to(`call:${callId}`).emit('call:ended', {
      callId,
      duration,
      timestamp: new Date()
    });

    res.json({ success: true, duration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/calls/logs', authenticateToken, async (req, res) => {
  try {
    const calls = await db.query(
      `SELECT c.*, 
              u.name, u.avatar
       FROM calls c
       LEFT JOIN users u ON (
         CASE WHEN c.initiator_id = $1 THEN c.recipient_id = u.id
              ELSE c.initiator_id = u.id
         END
       )
       WHERE c.initiator_id = $1 OR c.recipient_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json(calls.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

This provides a complete voice and video calling system with WebRTC integration!

