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

  // FIXME: Tailwind css로 변경하기
  return (
    <div
      ref={selectBoxRef}
      className={cn(styles.selectBox, isActive && styles['active'], className, className && styles[className])}
      onClick={toggleActive}
    >
      <div className={cn(styles.selectLine)}>{selectedValue}</div>

      <div className={cn(styles.selectItem)}>
        <ul className={cn(styles.selectOptionCont)}>
          {options.map((option, index) => (
            <li className={cn(styles.selectOptionItem)} key={index} onClick={() => handleSelect(option)}>
              <button className={cn(styles.selectOptionBtn)}>{option}</button>
            </li>
          ))}
        </ul>
      </div>

      <button className={cn(styles.selectBtn)}>
        <FontAwesomeIcon className={cn(styles['nav-icon'])} size="sm" icon={faCaretDown} />
      </button>
    </div>
  );
};

export default SelectBox;
