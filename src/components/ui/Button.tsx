import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none disabled:bg-muted disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // 주요 액션
        primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        // 보조 액션
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        // 삭제/위험
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',

        // 브랜드 색상 (연한 primary)
        brand:
          'border border-primary bg-background text-primary shadow-sm hover:bg-primary/10 hover:text-primary disabled:border-muted',
        // 테두리만
        outline:
          'border border-input bg-background text-accent-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:border-muted',
        // 배경 없음
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // 링크 스타일
        link: 'text-primary underline-offset-4 hover:underline disabled:no-underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs font-normal',
        default: 'h-9 px-4 py-2',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
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
