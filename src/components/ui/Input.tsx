import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-9 border border-input bg-transparent px-3 py-1 text-base shadow-sm md:text-sm',
        custom: 'border border-default-300 px-3.5 py-2.5 font-normal',
      },
      inputSize: {
        default: 'h-9',
        sm: 'h-8',
        lg: 'h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  // TheInput 호환성을 위한 추가 props
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, readOnly, disabled, onChange, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        readOnly={readOnly}
        disabled={disabled}
        // TheInput 로직: readOnly나 disabled일 때 onChange 무시
        onChange={readOnly || disabled ? undefined : onChange}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
