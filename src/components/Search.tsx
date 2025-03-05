import React, { useState } from 'react';
import SearchIcon from '@/components/Icons/Search';

interface ISearchProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function Search({ value, onChangeText }: ISearchProps) {
  const [isActive, setIsActive] = useState(false);

  const handleFocus = () => setIsActive(true);
  const handleBlur = () => setIsActive(false);

  return (
    <div className={`simSearch ${isActive ? 'active' : ''}`}>
      <input
        type="text"
        placeholder="Search"
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
      />
      <button>
        <SearchIcon />
      </button>
    </div>
  );
}
