import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

interface KpiSelectorValue {
  type: 'mean' | 'topN';
  percentile?: number;
}

interface HomeKpiSelectorProps {
  value: KpiSelectorValue;
  onChange: (val: KpiSelectorValue) => void;
}

export const segBtn = (active: boolean) =>
  `h-9 px-4 py-1 rounded-md border font-semibold transition-colors duration-150 text-sm ` +
  (active
    ? 'bg-[#7f56d9] text-white border-[#7f56d9] shadow'
    : 'bg-white text-[#7f56d9] border-[#7f56d9] hover:bg-[#f3e8ff]');

export const badgeBtn = (active: boolean) =>
  `h-6 px-2 py-0.5 rounded-md border font-semibold transition-colors duration-150 text-xs cursor-default select-none ` +
  (active ? 'bg-[#7f56d9] text-white border-[#7f56d9] shadow' : 'bg-white text-[#7f56d9] border-[#7f56d9]');

export const badgeBtnSm = (active: boolean) =>
  `h-3.5 px-1 py-0 flex items-center justify-center rounded border font-semibold transition-colors duration-150 text-[9px] cursor-default select-none leading-none ` +
  (active ? 'bg-[#7f56d9] text-white border-[#7f56d9] shadow' : 'bg-white text-[#7f56d9] border-[#7f56d9]');

const HomeKpiSelector: React.FC<HomeKpiSelectorProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value.percentile?.toString() ?? '5');
  const [errorMessage, setErrorMessage] = useState('');

  // KPI 타입 변경
  const handleTypeChange = (type: 'mean' | 'topN') => {
    setErrorMessage('');
    if (type === 'mean') {
      onChange({ type });
    } else {
      // topN 선택 시 percentile 기본값 5
      onChange({ type: 'topN', percentile: Number(inputValue) || 5 });
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
    onChange({ type: 'topN', percentile: valueNum });
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
      <span className="ml-2 text-base font-medium text-gray-700">Select a KPI Value:</span>
      <button type="button" className={segBtn(value.type === 'mean')} onClick={() => handleTypeChange('mean')}>
        Mean
      </button>
      <button type="button" className={segBtn(value.type === 'topN')} onClick={() => handleTypeChange('topN')}>
        Top N%
      </button>
      {value.type === 'topN' && (
        <Popover open={!!errorMessage}>
          <PopoverTrigger asChild>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              placeholder="1-100"
              className={`h-9 w-16 rounded-md border px-1 text-center text-sm ${errorMessage ? 'border-red-500' : 'border-[#7f56d9]'}`}
              disabled={value.type !== 'topN'}
            />
          </PopoverTrigger>
          {errorMessage && (
            <PopoverContent
              side="right"
              align="center"
              sideOffset={30}
              className="flex w-auto min-w-0 max-w-xs items-center gap-2 rounded-md border-2 border-[#d92d20] bg-[#d92d20] px-3 py-2 text-xs font-bold text-white shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-white"
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
      {value.type === 'topN' && <span className="text-lg font-semibold">%</span>}
    </div>
  );
};

export default HomeKpiSelector;
