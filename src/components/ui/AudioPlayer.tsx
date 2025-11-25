import React, { useRef, useEffect, useState } from 'react';

interface AudioPlayerProps {
  src: string;
  duration: number | null; // Duration in seconds
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, duration }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      // When the src changes, load the new audio
      audioRef.current.load();
      setError(null); // Clear any previous errors
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    console.error("Audio playback error:", e.nativeEvent);
    console.error("Audio error details:", audio.error);
    setError(`Playback error: ${audio.error?.message || 'Unknown error'}`);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <audio ref={audioRef} controls src={src} onError={handleError} className="w-full">
        Your browser does not support the audio element.
      </audio>
      {duration !== null && (
        <p className="text-xs text-muted-foreground">
          Duration: {duration.toFixed(1)}s
        </p>
      )}
    </div>
  );
};

export default AudioPlayer;