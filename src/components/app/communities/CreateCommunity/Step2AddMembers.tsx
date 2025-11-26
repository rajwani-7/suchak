import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Step2AddMembersProps {
  members: string[];
  onAddMember: (member: string) => void;
  onRemoveMember: (member: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2AddMembers: React.FC<Step2AddMembersProps> = ({
  members,
  onAddMember,
  onRemoveMember,
  onNext,
  onBack,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const email = inputValue.trim();
    if (!email) {
      setError('Please enter a valid email or user ID');
      return;
    }
    if (members.includes(email)) {
      setError('Member already added');
      return;
    }
    setError('');
    onAddMember(email);
    setInputValue('');
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Add Members</h3>
      <div className="flex mb-4 gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter email or user ID"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <ul className="mb-4 max-h-40 overflow-auto border border-border rounded p-2">
        {members.map((member) => (
          <li key={member} className="flex justify-between items-center mb-1">
            <span>{member}</span>
            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => onRemoveMember(member)}
              aria-label="Remove member"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={members.length === 0}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default Step2AddMembers;
