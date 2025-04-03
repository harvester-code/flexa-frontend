'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

// TheTimeSlider / TheTimeRangeSlider: https://github.com/shadcn-ui/ui/issues/885
const TheSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, form, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-400/30">
        <SliderPrimitive.Range className="absolute h-full" />
      </SliderPrimitive.Track>

      {value?.map((val, i) => (
        <React.Fragment key={i}>
          <SliderPrimitive.Thumb className="relative block h-8 w-4 transition-colors hover:cursor-pointer focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50">
            <div
              className="absolute inset-0"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0% 70%)' }}
            >
              <div className="h-full w-full bg-black"></div>

              <div
                className="absolute bottom-0.5 left-0.5 right-0.5 top-0.5 bg-white"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 98%, 0% 70%)' }}
              ></div>
            </div>

            <div
              className="absolute left-1/2 top-10 -translate-x-1/2 text-sm font-medium"
              style={{ clipPath: 'none' }}
            >
              <p>{form}</p>
            </div>
          </SliderPrimitive.Thumb>
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  );
});
TheSlider.displayName = SliderPrimitive.Root.displayName;

export default TheSlider;
