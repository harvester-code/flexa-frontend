import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-normal transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:!border-primary focus:!border-primary hover:border-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-muted [&[type=date]]:focus:!border-primary [&[type=datetime-local]]:focus:!border-primary [&[type=time]]:focus:!border-primary',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs font-normal',
        default: 'h-9 px-3 text-sm font-normal',
        lg: 'h-10 px-4 text-lg font-semibold',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // TheInput 호환성을 위한 추가 props
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, readOnly, disabled, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // readOnly나 disabled일 때만 onChange 무시
      if (readOnly || disabled) {
        return;
      }
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        readOnly={readOnly}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
