import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChat } from '@/context/ChatContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewContactModal = ({ open, onOpenChange }: Props) => {
  const { addContact } = useChat();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    addContact({ name: name.trim(), phone: phone.trim() });
    setName('');
    setPhone('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:w-96 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>New contact</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{'Cancel'}</Button>
            <Button onClick={handleSave}>{'Save'}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewContactModal;
