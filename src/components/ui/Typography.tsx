import { HTMLAttributes, forwardRef } from 'react';
import { VariantProps } from 'class-variance-authority';
import { typographyVariants } from '@/lib/typography';
import { cn } from '@/lib/utils';

// Typography 컴포넌트 Props
interface TypographyProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Typography 컴포넌트
 * shadcn/ui 방식의 통일된 텍스트 스타일 제공
 *
 * @example
 * <Typography variant="heading">페이지 제목</Typography>
 * <Typography variant="label">버튼 텍스트</Typography>
 * <Typography variant="body">일반 본문</Typography>
 * <Typography variant="caption">작은 정보</Typography>
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', as: Component = 'p', ...props }, ref) => {
    return <Component ref={ref} className={cn(typographyVariants({ variant }), className)} {...props} />;
  }
);

Typography.displayName = 'Typography';

// 편의를 위한 개별 컴포넌트들
export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  ({ className, as: Component = 'h2', ...props }, ref) => (
    <Component ref={ref} className={cn(typographyVariants({ variant: 'heading' }), className)} {...props} />
  )
);

export const Label = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  ({ className, as: Component = 'span', ...props }, ref) => (
    <Component ref={ref} className={cn(typographyVariants({ variant: 'label' }), className)} {...props} />
  )
);

export const Body = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ className, as: Component = 'p', ...props }, ref) => (
    <Component ref={ref} className={cn(typographyVariants({ variant: 'body' }), className)} {...props} />
  )
);

export const Caption = forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  ({ className, as: Component = 'span', ...props }, ref) => (
    <Component ref={ref} className={cn(typographyVariants({ variant: 'caption' }), className)} {...props} />
  )
);

Heading.displayName = 'Heading';
Label.displayName = 'Label';
Body.displayName = 'Body';
Caption.displayName = 'Caption';

