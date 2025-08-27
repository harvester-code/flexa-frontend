'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from './Button';

export interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  pendingText?: string;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ className, variant, size = 'default', pendingText = 'Submitting...', children, ...props }, ref) => {
    const { pending } = useFormStatus();

    return (
      <Button
        ref={ref}
        type="submit"
        variant={variant}
        size={size}
        className={className}
        aria-disabled={pending}
        {...props}
      >
        {pending ? pendingText : children}
      </Button>
    );
  }
);
SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
