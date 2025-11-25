import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChat } from '@/context/ChatContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewGroupModal = ({ open, onOpenChange }: Props) => {
  const { contacts, createGroup } = useChat();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleCreate = () => {
    const memberIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (memberIds.length === 0) return;
    createGroup(name || `Group`, memberIds);
    setName('');
    setSelected({});
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:w-96 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>New group</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Group name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Select members</label>
            <div className="mt-2 space-y-2 max-h-48 overflow-auto">
              {contacts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-sidebar-hover">
                  <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggle(c.id)} />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{'Cancel'}</Button>
            <Button onClick={handleCreate}>{'Create Group'}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewGroupModal;
