import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActiveCallScreenProps {
  callId: string;
  type: 'voice' | 'video';
  onEnd: () => void;
}

const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ callId, type, onEnd }) => {
  const [muted, setMuted] = React.useState(false);
  const [videoOn, setVideoOn] = React.useState(type === 'video');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
      <div className="absolute top-6 left-6">
        <p className="text-sm opacity-80">Call ID: {callId}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center text-4xl font-semibold">
          {type === 'video' ? '📹' : '🎧'}
        </div>
      </div>

      <div className="mb-12 flex items-center gap-6">
        <Button
          variant="ghost"
          className={cn('w-14 h-14 rounded-full', muted ? 'bg-red-600' : 'bg-gray-700')}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <MicOff /> : <Mic />}
        </Button>

        {type === 'video' && (
          <Button
            variant="ghost"
            className={cn('w-14 h-14 rounded-full', videoOn ? 'bg-gray-700' : 'bg-red-600')}
            onClick={() => setVideoOn((v) => !v)}
          >
            {videoOn ? <Video /> : <VideoOff />}
          </Button>
        )}

        <Button variant="destructive" className="w-20 h-20 rounded-full" onClick={onEnd}>
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
};

export default ActiveCallScreen;
