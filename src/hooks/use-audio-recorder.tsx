import { useEffect, useRef, useState, useCallback } from 'react';

export type RecorderState = 'idle' | 'recording' | 'stopped' | 'error';

// Utility to get the getUserMedia function
function getGetUserMediaFunction(): ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null {
  // Try modern API
  if (window.navigator && window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia) {
    return window.navigator.mediaDevices.getUserMedia.bind(window.navigator.mediaDevices);
  }

  // Try legacy APIs
  const nav = window.navigator as unknown as Record<string, unknown>;
  type LegacyGUM = (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error?: (err: Error | DOMException) => void) => void;
  const legacyFn = (nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia) as LegacyGUM | undefined;

  if (legacyFn) {
    return (constraints: MediaStreamConstraints) =>
      new Promise((resolve, reject) => legacyFn.call(window.navigator, constraints, resolve, reject));
  }

  return null;
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const [state, setState] = useState<RecorderState>('idle');
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // cleanup object URL
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const start = useCallback(async () => {
    setError(null);
    try {
      console.debug('useAudioRecorder.start(): initializing...');

      // Get getUserMedia function
      const getUserMediaFn = getGetUserMediaFunction();

      if (!getUserMediaFn) {
        const msg =
          'Audio recording is not supported in this browser. ' +
          'Please use Chrome, Edge, Firefox, or Safari. ' +
          'Make sure you are accessing the app over HTTPS (or localhost).';
        console.error('✗ getUserMedia is not available:', msg);
        throw new Error(msg);
      }

      console.debug('✓ getUserMedia function available');
      console.debug('→ Requesting microphone access...');
      const stream = await getUserMediaFn({ audio: true });
      console.debug('✓ Microphone access granted');
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        const d = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : undefined;
        setDuration(d ?? null);
        setState('stopped');

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.onerror = (ev: Event) => {
        console.error('MediaRecorder error', ev);
        setError('Recording error');
        setState('error');
      };

      mr.start();
      setState('recording');
    } catch (err) {
      console.error('Failed to start recording', err);
      let message = 'Could not access microphone';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          message = 'Microphone permission denied. Please enable in browser settings.';
        } else if (err.name === 'NotFoundError') {
          message = 'No microphone device found.';
        } else {
          message = `Permission error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      console.debug('useAudioRecorder.start() error:', message);
      setError(message);
      setState('error');
    }
  }, []);

  const stop = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return null;

    try {
      mr.stop();
      // return blob for immediate use
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      return blob;
    } catch (err) {
      console.error('Failed to stop recorder', err);
      setError('Stop failed');
      setState('error');
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      try {
        mr.stop();
      } catch (e) {
        // ignore
      }
    }
    chunksRef.current = [];
    setState('idle');
    setAudioURL(null);
    setDuration(null);
  }, []);

  const getBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    return new Blob(chunksRef.current, { type: 'audio/webm' });
  }, []);

  return {
    state,
    audioURL,
    duration,
    error,
    start,
    stop,
    cancel,
    getBlob,
  };
}
