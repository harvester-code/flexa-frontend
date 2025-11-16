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
  /** ASCII-only 입력을 강제할 때 사용 (한글 등 비-ASCII 제거) */
  asciiOnly?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size,
      readOnly,
      disabled,
      onChange,
      asciiOnly = true,
      ...props
    },
    ref
  ) => {
    const sanitizeAscii = React.useCallback((value: string) => {
      return asciiOnly ? value.replace(/[^\x00-\x7F]/g, '') : value;
    }, [asciiOnly]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // readOnly나 disabled일 때만 onChange 무시
      if (readOnly || disabled) {
        return;
      }

      if (asciiOnly) {
        const sanitized = sanitizeAscii(e.target.value);
        if (sanitized !== e.target.value) {
          e.target.value = sanitized;
        }
      }

      onChange?.(e);
    };

    const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
      if (!asciiOnly) return;
      const data = (e as unknown as InputEvent).data ?? '';
      if (typeof data === 'string' && /[^\x00-\x7F]/.test(data)) {
        e.preventDefault();
      }
      props.onBeforeInput?.(e as any);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (!asciiOnly) {
        props.onPaste?.(e);
        return;
      }
      const pasted = e.clipboardData.getData('text');
      const sanitized = sanitizeAscii(pasted);
      if (sanitized !== pasted) {
        e.preventDefault();
        const target = e.target as HTMLInputElement;
        const { selectionStart, selectionEnd, value } = target;
        const start = selectionStart ?? value.length;
        const end = selectionEnd ?? value.length;
        const nextValue = value.slice(0, start) + sanitized + value.slice(end);
        target.value = nextValue;
        // 수동으로 change 이벤트 트리거
        const event = new Event('input', { bubbles: true });
        target.dispatchEvent(event);
      }
      props.onPaste?.(e);
    };

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        readOnly={readOnly}
        disabled={disabled}
        onChange={handleChange}
        onBeforeInput={handleBeforeInput}
        onPaste={handlePaste}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
