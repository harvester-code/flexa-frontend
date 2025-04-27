'use client';

import { type ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  className?: string;
};

export function SubmitButton({ children, className, pendingText = 'Submitting...', ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button className={cn('btn-lg btn-gradient', className)} type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
