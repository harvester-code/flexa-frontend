import React, { useEffect, useRef, useState } from 'react';

interface IntegerNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onEnterSave?: () => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

export const IntegerNumberInput: React.FC<IntegerNumberInputProps> = ({
  value,
  onChange,
  onEnterSave,
  placeholder,
  unit = '',
  min = 0,
  max = 999999,
  className = '',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [hasError, setHasError] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // value prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(value.toString());
    setHasError(false);
  }, [value]);

  const validateInput = (inputStr: string): boolean => {
    // 빈 문자열은 허용하지 않음
    if (inputStr.trim() === '') return false;

    const num = parseInt(inputStr);

    // NaN이거나 정수가 아니거나 범위를 벗어나면 false
    if (isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // 숫자만 허용 (음수 기호는 min이 0 미만일 때만)
    const allowNegative = min < 0;
    const regex = allowNegative ? /^-?\d*$/ : /^\d*$/;

    if (regex.test(newValue)) {
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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // 포커스를 잃을 때 validation 체크
    if (inputValue.trim() === '' || !validateInput(inputValue)) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  };

  const showPlaceholder = !isFocused && (inputValue === '' || inputValue === '0');
  const displayValue = showPlaceholder ? '' : inputValue;
  const placeholderText = placeholder || (unit ? `0 ${unit}` : '0');

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholderText}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onClick={handleInputClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full rounded border px-3 py-2 pr-16 text-sm [appearance:textfield] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
          } ${className}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">{unit}</span>
        )}
      </div>

      {/* 에러 메시지 */}
      {hasError && (
        <div className="text-right">
          <span className="text-xs text-red-600">
            Enter a valid integer between {min} and {max}
          </span>
        </div>
      )}
    </div>
  );
};
