import React, { useEffect, useRef, useState } from 'react';

interface LoadFactorSliderProps {
  value: number;
  onChange: (value: number) => void;
  onEnterSave?: () => void;
  min?: number;
  max?: number;
  step?: number;
}

export const LoadFactorSlider: React.FC<LoadFactorSliderProps> = ({
  value,
  onChange,
  onEnterSave,
  min = 0,
  max = 100,
  step = 0.1,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [hasError, setHasError] = useState<boolean>(false);

  // value prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(value.toString());
    setHasError(false);
  }, [value]);

  const validateInput = (inputStr: string): boolean => {
    // 빈 문자열은 허용하지 않음
    if (inputStr.trim() === '') return false;

    const num = parseFloat(inputStr);

    // NaN이거나 정수가 아니거나 범위를 벗어나면 false
    if (isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 실시간 유효성 검사
    if (newValue.trim() !== '' && !validateInput(newValue)) {
      setHasError(true);
    } else {
      setHasError(false);

      // 유효한 값이면 바로 적용
      if (validateInput(newValue)) {
        onChange(parseInt(newValue));
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (validateInput(inputValue)) {
        onChange(parseInt(inputValue));
        setHasError(false);
        // Save 버튼 효과 실행
        if (onEnterSave) {
          onEnterSave();
        }
      } else {
        setHasError(true);
      }
    }
  };

  const handleInputClick = () => {
    inputRef.current?.select();
  };

  const calculateValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return value;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, position / rect.width));
    const newValue = min + percentage * (max - min);

    return Math.round(newValue); // 정수로 반올림
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);

    // 전역 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="space-y-2">
      {/* 게이지바와 입력 필드를 한 줄로 배치 */}
      <div className="flex items-center gap-3">
        {/* Custom Slider */}
        <div className="relative flex-1">
          {/* Slider Track */}
          <div
            ref={sliderRef}
            className="relative h-7 cursor-pointer select-none rounded-full bg-transparent"
            onMouseDown={handleMouseDown}
          >
            {(() => {
              const range = Math.max(max - min, 1);
              const clampedValue = Math.min(max, Math.max(min, value));
              const percentage = ((clampedValue - min) / range) * 100;

              return (
                <>
                  {/* Track base */}
                  <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />

                  {/* Progress Fill */}
                  <div
                    className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />

                  {/* Outline */}
                  <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full border border-primary/10" />

                  {/* Value bubble */}
                  <div
                    className="pointer-events-none absolute -top-9 flex flex-col items-center"
                    style={{ left: `calc(${Math.min(100, Math.max(0, percentage))}% - 22px)` }}
                  >
                    <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                      {clampedValue}%
                    </span>
                    <span className="mt-1 block h-2 w-2 rotate-45 rounded-sm bg-primary" />
                  </div>

                  {/* Thumb */}
                  <div
                    className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-border bg-background shadow-sm"
                    style={{ left: `calc(${Math.min(100, Math.max(0, percentage))}% - 10px)` }}
                  />
                </>
              );
            })()}
          </div>
        </div>

        {/* Input Field */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onClick={handleInputClick}
            className={`w-16 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm font-semibold text-foreground shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              hasError
                ? 'border-destructive/40 bg-destructive/10 focus:ring-destructive'
                : 'focus:ring-primary'
            }`}
          />
          <span className="text-sm font-semibold text-gray-900">%</span>
        </div>
      </div>

      {/* 에러 메시지 */}
      {hasError && (
        <div className="text-right">
          <span className="text-xs text-red-600">0-100 정수만 입력 가능</span>
        </div>
      )}
    </div>
  );
};
