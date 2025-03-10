'use client';

import React, { useEffect, useRef, useState } from 'react';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';
import styles from './SelectBox.module.css';

interface SelectBoxProps {
  options: string[];
  className?: string;
  defaultValue?: string;
}

// FIXME: className 적용방법 개선하기
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
      className={cn(styles['select-box'], className && styles[className], isActive && styles['active'])}
      onClick={toggleActive}
    >
      <div className={cn(styles['select-line'])}>{selectedValue}</div>

      <div className={cn(styles['select-item'])}>
        <ul>
          {options.map((option, index) => (
            <li key={index}>
              <button onClick={() => handleSelect(option)}>{option}</button>
            </li>
          ))}
        </ul>
      </div>

      <button className={cn(styles['select-btn'])}>
        <FontAwesomeIcon className={cn(styles['nav-icon'])} size="sm" icon={faCaretDown} />
      </button>
    </div>
  );
};

export default SelectBox;
