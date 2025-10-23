import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export type SpinnerProps = React.ComponentProps<typeof Loader2>;

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn('animate-spin text-primary', className)}
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden={props['aria-label'] ? undefined : true}
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
