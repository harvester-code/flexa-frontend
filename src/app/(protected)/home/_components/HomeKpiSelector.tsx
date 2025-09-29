import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

interface KpiSelectorValue {
  type: 'mean' | 'top';
  percentile?: number;
}

interface HomeKpiSelectorProps {
  value: KpiSelectorValue;
  onChange: (val: KpiSelectorValue) => void;
}

const HomeKpiSelector: React.FC<HomeKpiSelectorProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value.percentile?.toString() ?? '5');
  const [errorMessage, setErrorMessage] = useState('');

  // KPI 타입 변경
  const handleTypeChange = (type: 'mean' | 'top') => {
    setErrorMessage('');
    if (type === 'mean') {
      onChange({ type });
    } else {
      // top 선택 시 percentile 기본값 5
      onChange({ type: 'top', percentile: Number(inputValue) || 5 });
    }
  };

  // 입력값 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setErrorMessage('');
  };

  // 엔터 입력 또는 포커스 아웃 시 검증
  const commitPercentile = () => {
    const valueNum = Number(inputValue);
    if (!Number.isInteger(valueNum) || valueNum < 1 || valueNum > 100) {
      setErrorMessage('Please enter an integer between 1 and 100.');
      return;
    }
    setErrorMessage('');
    onChange({ type: 'top', percentile: valueNum });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPercentile();
    }
  };

  const handleInputBlur = () => {
    commitPercentile();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-default-900">Select a KPI Value:</span>
      <Button
        type="button"
        variant={value.type === 'mean' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => handleTypeChange('mean')}
      >
        Mean
      </Button>
      <Button
        type="button"
        variant={value.type === 'top' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => handleTypeChange('top')}
      >
        Top N%
      </Button>
      {value.type === 'top' && (
        <Popover open={!!errorMessage}>
          <PopoverTrigger asChild>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              placeholder="1-100"
              className={`h-9 w-16 rounded-md border px-1 text-center text-sm font-normal ${
                errorMessage ? 'border-destructive' : 'border-primary'
              }`}
              disabled={value.type !== 'top'}
            />
          </PopoverTrigger>
          {errorMessage && (
            <PopoverContent
              side="right"
              align="center"
              sideOffset={30}
              className="flex w-auto min-w-0 max-w-xs items-center gap-2 rounded-md border-2 border-destructive bg-destructive px-3 py-2 text-xs font-normal text-destructive-foreground shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {errorMessage}
            </PopoverContent>
          )}
        </Popover>
      )}
      {value.type === 'top' && <span className="ml-0.5 text-lg font-semibold text-default-900">%</span>}
    </div>
  );
};

export default HomeKpiSelector;
