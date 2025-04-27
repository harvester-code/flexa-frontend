import React from 'react';

interface InputProps {
  id?: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  id,
  type,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onBlur,
  className,
  readOnly,
  disabled,
}) => {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={readOnly || disabled ? undefined : onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      readOnly={readOnly}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        border: '1px solid #D0D5DD',
        borderRadius: '8px',
        width: '100%',
      }}
      className={`${className} font-normal`}
    />
  );
};

export default Input;
