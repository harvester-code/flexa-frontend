'use client';

import React, { useEffect, useRef, useState } from 'react';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SelectBoxProps {
  options: string[];
  className?: string;
  defaultValue?: string;
}

const SelectBox: React.FC<SelectBoxProps> = ({ options, className, defaultValue }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue || options[0] || '');
  const selectBoxRef = useRef<HTMLDivElement | null>(null);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setIsActive(false);
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
      <div className="select-line">{selectedValue}</div>
      <div className="select-item">
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <button onClick={() => handleSelect(option)}>{option}</button>
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

export default SelectBox;
