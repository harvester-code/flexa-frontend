import React from 'react';
import Image from 'next/image';
import { TooltipData } from '@/types/tooltip';
import { Tooltip as TooltipBase, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface TooltipProps extends TooltipData {
  className?: string;
}

function Tooltip({ title, text, className = '' }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipBase>
        <TooltipTrigger asChild>
          <Image className={className} width={16} height={16} src="/image/ico-help.svg" alt="tooltip" />
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          <React.Fragment>
            {title ? (
              <>
                <strong>{title}</strong>
                <br />
              </>
            ) : null}
            {text}
          </React.Fragment>
        </TooltipContent>
      </TooltipBase>
    </TooltipProvider>
  );
}

export default Tooltip;
