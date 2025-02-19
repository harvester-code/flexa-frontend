import React from 'react';

interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  textSub?: string;
}

export default function Button({
  text,
  onClick,
  disabled,
  className,
  icon,
  iconRight,
  textSub,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} flex items-center justify-center whitespace-nowrap rounded-md`}
    >
      {icon && <span className="mr-[2px] flex items-center justify-center">{icon}</span>}
      {text}
      {textSub && <span className="ml-[2px] text-default-500">{textSub}</span>}
      {iconRight && <span className="ml-[2px] flex items-center justify-center">{iconRight}</span>}
    </button>
  );
}
