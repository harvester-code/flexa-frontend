'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const TheTimeRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [values, setValues] = React.useState([30, 60]); // 초기 값
  const trackRef = React.useRef<HTMLDivElement>(null);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      value={values}
      onValueChange={setValues}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trackRef}
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20"
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>

      {values.map((value, index) => (
        <React.Fragment key={index}>
          <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />

          <div
            className="absolute top-5 flex h-6 w-10 items-center justify-center rounded-md text-sm font-medium text-primary"
            style={{ left: `calc(${value}% - 17px)` }}
          >
            {value}
          </div>
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  );
});
TheTimeRangeSlider.displayName = SliderPrimitive.Root.displayName;

export default TheTimeRangeSlider;
