'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [values, setValues] = React.useState([50]); // 초기 값

  const convertScaledValue = (value: number) => {
    const totalMinutes = (value / 100) * (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      value={values}
      onValueChange={setValues}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-400/30">
        <SliderPrimitive.Range className="absolute h-full" />
      </SliderPrimitive.Track>

      {values.map((value, index) => (
        <React.Fragment key={index}>
          <SliderPrimitive.Thumb
            className="block h-8 w-4 rounded-t-sm bg-black transition-colors disabled:pointer-events-none disabled:opacity-50"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0% 70%)' }}
          >
            <span
              className="absolute left-0.5 top-0.5 -z-10 block h-7 w-3 rounded-t-[2px] bg-white"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 98%, 0% 70%)' }}
            ></span>
          </SliderPrimitive.Thumb>

          <div
            className="absolute top-6 h-6 w-10 text-sm font-medium"
            style={{ left: `calc(${value}% - 18px)` }}
          >
            <p className="min-w-10">{convertScaledValue(value)}</p>
          </div>
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
