'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface HomeAccordionProps {
  title: string;
  icon?: React.ReactNode;
  open?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function HomeAccordion({ title, icon, open = true, className, children }: HomeAccordionProps) {
  const [isOpened, setIsOpened] = useState<boolean>(open);

  return (
    <div className={cn('mt-6 flex flex-col', className)}>
      <div
        className="cursor-pointer rounded-lg bg-gray-100 p-4 transition-colors hover:bg-gray-200"
        onClick={() => setIsOpened(!isOpened)}
        aria-expanded={isOpened}
        aria-controls={`accordion-content-${title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpened(!isOpened);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="rounded-lg bg-primary/15 p-2">{icon}</div>}
            <div className="text-xl font-semibold text-default-900">{title}</div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isOpened ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>
      </div>

      <div
        id={`accordion-content-${title}`}
        className={cn(
          'transition-all duration-200 ease-in-out',
          isOpened ? 'mt-4 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default HomeAccordion;
