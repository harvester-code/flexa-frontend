import React from 'react';

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

const Input: React.FC<InputProps> = ({
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
      className={`${className} font-normal`}
      type={type}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      onBlur={onBlur}
      onChange={readOnly || disabled ? undefined : onChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      style={{
        padding: '10px 14px',
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
        width: '100%',
      }}
    />
  );
};

export default Input;
