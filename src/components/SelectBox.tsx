'use client';

import React, { useEffect, useRef, useState } from 'react';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';
import styles from './SelectBox.module.css';

interface SelectBoxProps {
  className?: string;
  options: any[];
  selectedOption?: any;
  onSelectedOption?: (value: any) => void;
}

const SelectBox: React.FC<SelectBoxProps> = ({ options, className, selectedOption, onSelectedOption }) => {
  const [isActive, setIsActive] = useState(false);
  const selectBoxRef = useRef<HTMLDivElement | null>(null);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const handleSelect = (value: any) => {
    if (onSelectedOption) onSelectedOption(value);
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

  // FIXME: 컴포넌트 개선하기
  // FIXME: Tailwind css로 변경하기
  return (
    <div
      ref={selectBoxRef}
      className={cn(styles.selectBox, isActive && styles['active'], className, className && styles[className])}
      onClick={toggleActive}
    >
      <div className={cn(styles.selectLine)}>
        {typeof selectedOption == 'string' ? selectedOption : selectedOption?.label}
      </div>

      <div className={cn(styles.selectItem)}>
        <ul className={cn(styles.selectOptionCont)}>
          {options?.map((option, index) => (
            <li className={cn(styles.selectOptionItem)} key={index} onClick={() => handleSelect(option)}>
              <button className={cn(styles.selectOptionBtn)}>
                {typeof option == 'string' ? option : option.label}
              </button>
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
