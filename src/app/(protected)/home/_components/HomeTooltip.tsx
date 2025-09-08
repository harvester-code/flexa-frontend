import React, { ReactNode, useRef, useState } from 'react';

export default function HomeTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const iconRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    setShow(true);
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8, // 8px right margin
      });
    }
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      ref={iconRef}
    >
      {children}
      {show && (
        <span
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: 'translateY(-50%)', // vertically centered
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
