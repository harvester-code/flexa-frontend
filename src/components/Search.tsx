import React, { useState } from 'react';
import SearchIcon from '@/components/icons/search';

const SimSearch: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  const handleFocus = () => setIsActive(true);
  const handleBlur = () => setIsActive(false);

  return (
    <div className={`simSearch ${isActive ? 'active' : ''}`}>
      <input type="text" placeholder="Search" onFocus={handleFocus} onBlur={handleBlur} />
      <button>
        <SearchIcon />
      </button>
    </div>
  );
};

export default SimSearch;
