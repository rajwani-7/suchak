import React, { useState } from 'react';

const EMOJIS = [
  '😀','😁','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😋','😜','🤪','😎','🤩','🥳','🤔',
  '😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🤯','😳','🥺','😭','😤','😡','🤬','👍','👎','👌','🙏',
  '👏','🙌','💪','🤝','🤞','💖','💔','❤️','🔥','✨','🎉','🎶','💯','✔️','❌','🕊️','☮️','🎧','📎','📷'
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, className = '' }) => {
  const [query, setQuery] = useState('');
  const filtered = EMOJIS.filter((e) => {
    if (!query) return true;
    // simple search by Unicode shortname not implemented; match by codepoint presence
    return e.includes(query);
  });

  return (
    <div className={`bg-card border border-border rounded-lg p-2 w-56 ${className}`}>
      <div className="mb-2">
        <input
          placeholder="Search emoji"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-2 py-1 rounded bg-secondary border-none text-sm"
        />
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-auto">
        {filtered.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="p-1 text-lg hover:bg-accent rounded"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
