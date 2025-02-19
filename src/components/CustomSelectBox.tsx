'use client';

import React, { useEffect, useRef, useState } from 'react';
import { faCaretDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface CustomSelectBoxProps {
  className?: string;
  options: string[];
}

const CustomSelectBox: React.FC<CustomSelectBoxProps> = ({ className, options }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const selectBoxRef = useRef<HTMLDivElement>(null);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const handleSelectItem = (item: string) => {
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
    }
    setIsActive(false);
  };

  const handleRemoveItem = (item: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedItems(selectedItems.filter((selectedItem) => selectedItem !== item));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectBoxRef.current && !selectBoxRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={selectBoxRef}
      className={`select-box ${isActive ? 'active' : ''} ${className || ''}`}
      onClick={toggleActive}
    >
      <div className="select-line">
        <ul className="btn-list">
          {selectedItems.map((item, index) => (
            <li key={index}>
              <button onClick={(event) => handleRemoveItem(item, event)}>
                <span className="selected">{item}</span>
                <FontAwesomeIcon className="nav-icon text-default-400" size="sm" icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="select-item">
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <button onClick={() => handleSelectItem(option)}>{option}</button>
            </li>
          ))}
        </ul>
      </div>
      <button className="select-btn">
        <FontAwesomeIcon className="nav-icon" size="sm" icon={faCaretDown} />
      </button>
    </div>
  );
};

export default CustomSelectBox;
