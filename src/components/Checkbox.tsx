import React from 'react';

interface CheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

export default function Checkbox({ id, label, checked, onChange, className, disabled = false }: CheckboxProps) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <label htmlFor={id} className={`${className}`}>
        {label}
      </label>
    </div>
  );
}
