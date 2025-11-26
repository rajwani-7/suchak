import React from 'react';
import { Button } from '@/components/ui/button';

interface Step3SummaryProps {
  name: string;
  avatar: string;
  members: string[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const Step3Summary: React.FC<Step3SummaryProps> = ({
  name,
  avatar,
  members,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Summary</h3>
      <div className="mb-4">
        <strong>Name:</strong> {name}
      </div>
      <div className="mb-4">
        <strong>Avatar URL:</strong> {avatar || 'None'}
      </div>
      <div className="mb-4">
        <strong>Members:</strong>
        <ul className="list-disc list-inside">
          {members.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting || !name}>
          {isSubmitting ? 'Creating...' : 'Create Community'}
        </Button>
      </div>
    </div>
  );
};

export default Step3Summary;
