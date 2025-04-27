'use client';

import { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeAccordionProps {
  title: string;
  open?: boolean;
  children?: React.ReactNode;
}

function HomeAccordion({ title, open = true, children }: HomeAccordionProps) {
  const [isOpened, setIsOpened] = useState<boolean>(open);

  return (
    <div className="mt-12 flex flex-col">
      <div className="flex">
        <h3
          className="flex h-[50px] flex-grow cursor-pointer items-center justify-between rounded-md bg-default-100 px-5 text-2xl font-semibold text-default-900"
          onClick={() => setIsOpened(!isOpened)}
        >
          <span>{title}</span>
          <ChevronUp className={cn('transition-transform', isOpened ? '' : 'rotate-180')} />
        </h3>
      </div>

      <div className={cn('transition-all', isOpened ? '' : 'hidden')}>{children}</div>
    </div>
  );
}

export default HomeAccordion;
