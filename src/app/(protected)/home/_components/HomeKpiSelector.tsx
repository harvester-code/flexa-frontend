import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface KpiSelectorValue {
  type: 'mean' | 'top';
  percentile?: number;
}

interface HomeKpiSelectorProps {
  value: KpiSelectorValue;
  onChange: (val: KpiSelectorValue) => void;
}

const PRESET_PERCENTILES = [1, 5, 10, 20, 50];

const HomeKpiSelector: React.FC<HomeKpiSelectorProps> = ({ value, onChange }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleMeanClick = () => {
    onChange({ type: 'mean' });
    setIsCustomMode(false);
  };

  const handlePresetClick = (percentile: number) => {
    onChange({ type: 'top', percentile });
    setIsCustomMode(false);
  };

  const handleCustomClick = () => {
    setIsCustomMode(true);
    setCustomInput(value.percentile?.toString() || '');
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // 빈 문자열은 허용 (삭제 가능하도록)
    if (val === '') {
      setCustomInput('');
      return;
    }

    // 숫자만 허용
    const num = Number(val);
    if (isNaN(num)) {
      return;
    }

    // 1-100 범위만 허용
    if (num >= 1 && num <= 100) {
      setCustomInput(val);
    }
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitCustomValue();
    } else if (e.key === 'Escape') {
      setIsCustomMode(false);
    }
  };

  const commitCustomValue = () => {
    const num = Number(customInput);
    // 유효한 정수이고 범위 내에 있을 때만 적용
    if (Number.isInteger(num) && num >= 1 && num <= 100) {
      onChange({ type: 'top', percentile: num });
      setIsCustomMode(false);
    } else if (customInput === '') {
      // 빈 값이면 그냥 닫기
      setIsCustomMode(false);
    }
  };

  const handleCustomInputBlur = () => {
    commitCustomValue();
  };

  const getTopLabel = () => {
    if (value.type === 'top' && value.percentile) {
      return `Top ${value.percentile}%`;
    }
    return 'Top N%';
  };

  return (
    <div className="flex items-center gap-1">
      {/* Mean Button */}
      <Button
        type="button"
        variant={value.type === 'mean' ? 'primary' : 'outline'}
        size="sm"
        onClick={handleMeanClick}
        className={cn(
          'rounded-r-none',
          value.type === 'mean' ? 'z-10' : ''
        )}
      >
        Mean
      </Button>

      {/* Top N% Dropdown Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={value.type === 'top' ? 'primary' : 'outline'}
            size="sm"
            className={cn(
              'rounded-l-none border-l-0',
              value.type === 'top' ? 'z-10' : ''
            )}
          >
            {getTopLabel()}
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {PRESET_PERCENTILES.map((percentile) => (
            <DropdownMenuItem
              key={percentile}
              onClick={() => handlePresetClick(percentile)}
              className={cn(
                'cursor-pointer',
                value.type === 'top' && value.percentile === percentile
                  ? 'bg-primary/10 font-medium text-primary'
                  : ''
              )}
            >
              Top {percentile}%
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {!isCustomMode ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleCustomClick();
              }}
              className="cursor-pointer font-medium"
            >
              Custom...
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={customInput}
                onChange={handleCustomInputChange}
                onKeyDown={handleCustomInputKeyDown}
                onBlur={handleCustomInputBlur}
                placeholder="1-100"
                className="h-8 w-full text-sm"
                autoFocus
              />
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HomeKpiSelector;
