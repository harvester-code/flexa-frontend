import React from 'react';

interface InputProps {
  id?: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
