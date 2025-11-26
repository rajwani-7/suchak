import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Step1BasicInfoProps {
  name: string;
  avatar: string;
  onChange: (field: 'name' | 'avatar', value: string) => void;
  onNext: () => void;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ name, avatar, onChange, onNext }) => {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!name) {
      setError('Community name is required');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Community Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter community name"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Avatar URL</label>
        <Input
          type="text"
          value={avatar}
          onChange={(e) => onChange('avatar', e.target.value)}
          placeholder="Enter avatar image URL"
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Button onClick={handleNext}>Next</Button>
    </div>
  );
};

export default Step1BasicInfo;
