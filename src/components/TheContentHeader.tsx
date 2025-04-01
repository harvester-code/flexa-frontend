import React from 'react';

interface ContentsHeaderProps {
  text: string;
}

export default function ContentsHeader({ text }: ContentsHeaderProps) {
  return (
    <div className="flex h-[100px] items-center border-b border-default-300">
      <h1>{text}</h1>
    </div>
  );
}
