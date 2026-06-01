import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue && !isEditing) {
    setPrevValue(value);
    setInputValue(value.toString());
    setHasError(false);
  }

  const validateInput = (inputStr: string): boolean => {
    if (inputStr.trim() === '') return false;

    const num = parseFloat(inputStr);

    if (isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
      return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.trim() !== '' && !validateInput(newValue)) {
      setHasError(true);
    } else {
      setHasError(false);

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

  const calculateValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return value;

      const rect = sliderRef.current.getBoundingClientRect();
      const position = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, position / rect.width));
      const newValue = min + percentage * (max - min);

      return Math.round(newValue);
    },
    [max, min, value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      onChange(calculateValueFromPosition(e.clientX));
    },
    [calculateValueFromPosition, onChange]
  );

  const handleMouseUp = useCallback(function mouseUpHandler() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', mouseUpHandler);
  }, [handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    onChange(calculateValueFromPosition(e.clientX));
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div
            ref={sliderRef}
            className="relative h-6 cursor-pointer select-none overflow-hidden rounded-full bg-gray-200"
            onMouseDown={handleMouseDown}
          >
            <div
              className="pointer-events-none h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow-sm">{value}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleInputKeyDown}
            onClick={handleInputClick}
            className={`w-16 rounded border px-2 py-1 text-center text-sm [appearance:textfield] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
            }`}
          />
          <span className="text-sm font-semibold text-gray-900">%</span>
        </div>
      </div>

      {hasError && (
        <div className="text-right">
          <span className="text-xs text-red-600">0-100 정수만 입력 가능</span>
        </div>
      )}
    </div>
  );
};
