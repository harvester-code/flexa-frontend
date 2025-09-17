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
            className="relative h-6 cursor-pointer select-none overflow-hidden rounded-full bg-gray-200"
            onMouseDown={handleMouseDown}
          >
            {/* Progress Fill */}
            <div
              className="pointer-events-none h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
            />

            {/* Value Display on Track */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow-sm">{value}%</span>
            </div>
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
            className={`w-16 rounded border px-2 py-1 text-center text-sm [appearance:textfield] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
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
