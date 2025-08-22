import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // 기존 CSS 클래스들과 매칭되는 variants 추가
        'btn-default': 'border border-default-200 bg-white text-default-700 hover:bg-default-50',
        'btn-primary': 'bg-gradient-to-b from-[#9e77ed] to-[#7f56d9] text-white shadow-sm hover:opacity-90',
        'btn-gradient': 'bg-[var(--bg-gradient)] text-white hover:bg-[var(--brand)] transition-colors',
        'btn-secondary': 'bg-default-900 text-white',
        'btn-tertiary': 'border border-accent-600 bg-white text-accent-600 min-w-25 px-5 shadow-sm hover:bg-accent-50',
        'btn-red-line': 'border border-red-500 bg-white text-red-500 min-w-25 px-5 shadow-sm',
        'btn-green-line': 'border border-green-500 bg-white text-green-500 min-w-25 px-5 shadow-sm',
        'btn-delete': 'bg-red-100 border border-red-500 text-red-500 px-4 rounded-full h-8 hover:opacity-80',
        'btn-link': 'inline-flex items-center gap-2.5 text-sm font-semibold underline hover:text-[var(--brand)]',
        'btn-brand': 'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition-colors',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        // 기존 CSS 클래스들과 매칭되는 sizes 추가
        'btn-sm': 'h-9 px-3.5 gap-1.5 rounded-lg bg-white font-semibold',
        'btn-md': 'h-10 px-3.5 min-w-24 gap-1.5 rounded-lg bg-white text-sm font-semibold shadow-sm',
        'btn-lg': 'h-11 w-full px-3.5 gap-1.5 font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

interface ButtonGroupProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactElement<ButtonProps>[];
}

const ButtonGroup = ({ className, orientation = 'horizontal', children }: ButtonGroupProps) => {
  const totalButtons = React.Children.count(children);
  const isHorizontal = orientation === 'horizontal';
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'flex',
        {
          'flex-col': isVertical,
          'w-fit': isVertical,
        },
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        const isFirst = index === 0;
        const isLast = index === totalButtons - 1;

        return React.cloneElement(child, {
          className: cn(
            {
              'rounded-l-none': isHorizontal && !isFirst,
              'rounded-r-none': isHorizontal && !isLast,
              'border-l-0': isHorizontal && !isFirst,

              'rounded-t-none': isVertical && !isFirst,
              'rounded-b-none': isVertical && !isLast,
              'border-t-0': isVertical && !isFirst,
            },
            child.props.className
          ),
        });
      })}
    </div>
  );
};

export { Button, ButtonGroup, buttonVariants };
