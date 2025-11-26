import React, { useState } from 'react';
import Step1BasicInfo from './Step1BasicInfo';
import Step2AddMembers from './Step2AddMembers';
import Step3Summary from './Step3Summary';
import { useCommunities } from '@/context/CommunitiesContext';
import { createCommunity } from '@/services/communityService';
import { Community } from '@/types/community';
import { useToast } from '@/components/ui/use-toast';

const CreateCommunity = ({ onClose }: { onClose: () => void }) => {
  const { dispatch } = useCommunities();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [members, setMembers] = useState<string[]>([]); // member ids or emails
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleAddMember = (member: string) => {
    setMembers((prev) => [...prev, member]);
  };

  const handleRemoveMember = (member: string) => {
    setMembers((prev) => prev.filter((m) => m !== member));
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Community name is required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const newCommunity: Community = {
      id: (Math.random() * 1000000).toFixed(0),
      name,
      avatar,
      members: members.length,
      lastActivity: new Date().toISOString(),
      // Add other fields as needed
    };
    try {
      await createCommunity(newCommunity);
      dispatch({ type: 'ADD_COMMUNITY', payload: newCommunity });
      toast({ title: 'Community created successfully' });
      onClose();
    } catch (error) {
      toast({ title: 'Failed to create community', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleFieldChange = (field: 'name' | 'avatar', value: string) => {
    if (field === 'name') setName(value);
    else if (field === 'avatar') setAvatar(value);
  };

  return (
    <div className="w-full max-w-md bg-white rounded shadow p-4">
      {step === 1 && (
        <Step1BasicInfo name={name} avatar={avatar} onChange={handleFieldChange} onNext={handleNext} />
      )}
      {step === 2 && (
        <Step2AddMembers
          members={members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <Step3Summary
          name={name}
          avatar={avatar}
          members={members}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default CreateCommunity;
