import React from 'react';

interface ContentsHeaderProps {
  text: string;
}

export default function ContentsHeader({ text }: ContentsHeaderProps) {
  return (
    <div className="contentsHeader">
      <h1>{text}</h1>
    </div>
  );
}
