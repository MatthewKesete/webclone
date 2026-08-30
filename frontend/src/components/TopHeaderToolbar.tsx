import React, { useState } from 'react';
import { Lock, Search } from 'lucide-react';

interface TopHeaderToolbarProps {
  onSearch?: (text: string, column: string) => void;
}

export const TopHeaderToolbar: React.FC<TopHeaderToolbarProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [locked, setLocked] = useState<boolean>(true);

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (onSearch) onSearch(val, selectedColumn);
  };

  return (
    <header className="w-full bg-[#181818] border-b border-[#2e2e2e] px-6 py-2 flex items-center justify-end gap-3 select-none">
      {/* Red-bordered Lock Button */}
      <button
        onClick={() => setLocked(!locked)}
        className="p-1 bg-[#181818] border border-rose-600 rounded text-rose-500 hover:bg-rose-950/40 transition"
        title={locked ? 'System Locked' : 'System Unlocked'}
      >
        <Lock className="h-4 w-4" />
      </button>

      {/* Field Dropdown Selector */}
      <select
        value={selectedColumn}
        onChange={e => {
          setSelectedColumn(e.target.value);
          if (onSearch) onSearch(searchText, e.target.value);
        }}
        className="bg-[#242424] border border-[#3f3f46] text-white text-xs px-2 py-1 rounded w-36 focus:outline-none focus:border-zinc-300"
      >
        <option value="">All Fields</option>
        <option value="SName">Student Name</option>
        <option value="FileCode">File Code</option>
        <option value="StudentASCNo">ASC Number</option>
        <option value="PhoneNumber">Phone Number</option>
        <option value="Department">Department</option>
      </select>

      {/* Enter Text to Search Input */}
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Enter text to search..."
          value={searchText}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full bg-[#242424] border border-[#3f3f46] text-white text-xs pl-3 pr-8 py-1 rounded placeholder-zinc-500 focus:outline-none focus:border-zinc-300"
        />
        <Search className="absolute right-2.5 top-1.5 h-3.5 w-3.5 text-zinc-400" />
      </div>
    </header>
  );
};
