import React from 'react';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ToggleButtonGroupProps<T = any> {
  /** 옵션 배열 */
  options: T[];

  /** 선택된 값 (단일 선택용) */
  selectedValue?: any;

  /** 선택된 값들 (다중 선택용) */
  selectedValues?: any[];

  /** 선택 시 호출되는 함수 */
  onSelect: (value: T, index: number) => void;

  /** 라벨을 추출하는 함수 */
  labelExtractor: (option: T, index: number) => string;

  /** 키를 추출하는 함수 (기본: index) */
  keyExtractor?: (option: T, index: number) => string | number;

  /** 선택 상태를 판단하는 함수 (커스텀 로직용) */
  isSelected?: (option: T, index: number) => boolean;

  /** 아이콘을 렌더링하는 함수 (옵션) */
  renderIcon?: (option: T, index: number, isSelected: boolean) => React.ReactNode;

  /** 추가 클래스명 */
  className?: string;

  /** 각 버튼에 추가할 클래스명 */
  buttonClassName?: string;
}

const SELECTED_STYLE = 'bg-muted font-semibold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]';

export default function ToggleButtonGroup<T = any>({
  options,
  selectedValue,
  selectedValues,
  onSelect,
  labelExtractor,
  keyExtractor,
  isSelected,
  renderIcon,
  className,
  buttonClassName,
}: ToggleButtonGroupProps<T>) {
  const getIsSelected = (option: T, index: number): boolean => {
    if (isSelected) {
      return isSelected(option, index);
    }

    if (selectedValues) {
      return selectedValues.includes(index); // 다중 선택 (HourlyTrends 방식)
    }

    if (selectedValue !== undefined) {
      return selectedValue === (option as any)?.value; // 단일 선택
    }

    return false;
  };

  const getKey = (option: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(option, index);
    }
    return (option as any)?.value || index;
  };

  return (
    <ButtonGroup className={className}>
      {options.map((option, index) => {
        const selected = getIsSelected(option, index);

        return (
          <Button
            key={getKey(option, index)}
            variant="outline"
            className={cn(buttonClassName, selected ? SELECTED_STYLE : '')}
            onClick={() => onSelect(option, index)}
          >
            {renderIcon?.(option, index, selected)}
            {labelExtractor(option, index)}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}

export type { ToggleButtonGroupProps };
