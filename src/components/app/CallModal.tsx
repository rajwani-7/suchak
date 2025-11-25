import React from 'react';
import { Button } from '@/components/ui/button';

interface CallModalProps {
  open: boolean;
  type: 'voice' | 'video' | null;
  onClose: () => void;
  onAccept?: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ open, type, onClose, onAccept }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold">{type === 'video' ? 'Video call' : 'Voice call'}</h3>
        <p className="text-sm text-muted-foreground mt-2">This is a placeholder for the call flow. Integrate WebRTC to make real calls.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onAccept?.(); onClose(); }} className="bg-green-600 hover:bg-green-700">Start</Button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
