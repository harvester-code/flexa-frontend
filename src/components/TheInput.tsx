import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps {
  id?: string;
  type: string;
  placeholder?: string;
  value: string;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const TheInput: React.FC<InputProps> = ({
  id,
  type,
  placeholder,
  value,
  className,
  readOnly,
  disabled,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
}) => {
  return (
    <input
      id={id}
      className={cn('w-full rounded-md border border-default-300 px-3.5 py-2.5 font-normal', className)}
      type={type}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      onBlur={onBlur}
      onChange={readOnly || disabled ? undefined : onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    />
  );
};

export default TheInput;
