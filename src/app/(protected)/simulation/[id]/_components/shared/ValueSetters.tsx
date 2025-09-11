import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LoadFactorSlider } from '@/components/ui/LoadFactorSlider';
import PercentageInteractiveBar from './PercentageControl';

// Plotly를 동적으로 로드 (SSR 문제 방지)
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-48 items-center justify-center text-gray-500">Loading chart...</div>,
});

// Load Factor용 값 설정 컴포넌트
interface LoadFactorValueSetterProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}

export const LoadFactorValueSetter: React.FC<LoadFactorValueSetterProps> = ({ properties, values, onChange }) => {
  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <div key={property} className="space-y-2">
          <div className="max-w-md">
            <LoadFactorSlider
              value={Math.round((values[property] || 0) * 100)} // 0.0-1.0 → 0-100% 변환
              onChange={(value) => {
                onChange({
                  ...values,
                  [property]: value / 100, // 0-100% → 0.0-1.0 변환
                });
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Nationality/Profile용 값 설정 컴포넌트
interface DistributionValueSetterProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  onValidationChange: (isValid: boolean) => void;
  onTotalChange: (total: number) => void;
  configType: string;
}

export const DistributionValueSetter: React.FC<DistributionValueSetterProps> = ({
  properties,
  values,
  onChange,
  onValidationChange,
  onTotalChange,
  configType,
}) => {
  return (
    <PercentageInteractiveBar
      properties={properties}
      values={values}
      onChange={onChange}
      onValidationChange={onValidationChange}
      onTotalChange={onTotalChange}
      configType={configType}
    />
  );
};

// Show-up-time용 값 설정 컴포넌트
interface ShowUpTimeValueSetterProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  defaultValues?: { mean?: number; std?: number }; // 기본값 전달용
}

export const ShowUpTimeValueSetter: React.FC<ShowUpTimeValueSetterProps> = ({
  properties,
  values,
  onChange,
  defaultValues,
}) => {
  const getDisplayName = (property: string): string => {
    switch (property) {
      case 'mean':
        return 'Mean';
      case 'std':
        return 'Standard Deviation';
      default:
        return property.charAt(0).toUpperCase() + property.slice(1);
    }
  };

  const getPlaceholder = (property: string): string => {
    if (defaultValues && defaultValues[property as keyof typeof defaultValues]) {
      return defaultValues[property as keyof typeof defaultValues]!.toString();
    }
    return property === 'mean' ? '120' : '30';
  };

  const getUnits = (property: string): string => {
    return property === 'mean' ? 'minutes' : '';
  };

  // 정규분포 곡선 데이터 생성
  const plotData = useMemo(() => {
    const meanNum = values.mean || defaultValues?.mean || 120;
    const stdNum = values.std || defaultValues?.std || 30;

    if (isNaN(meanNum) || isNaN(stdNum) || stdNum <= 0) {
      return { x: [], y: [] };
    }

    // 정규분포 범위: 평균 ± 4 표준편차
    const rangeStart = Math.max(0, meanNum - 4 * stdNum);
    const rangeEnd = meanNum + 4 * stdNum;
    const steps = 200;
    const stepSize = (rangeEnd - rangeStart) / steps;

    const x: number[] = [];
    const y: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const xVal = rangeStart + i * stepSize;
      // 정규분포 확률밀도함수
      const yVal = (1 / (stdNum * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xVal - meanNum) / stdNum, 2));
      x.push(xVal);
      y.push(yVal);
    }

    return { x, y };
  }, [values.mean, values.std, defaultValues]);

  const hasValidValues = (values.mean && values.std) || (defaultValues?.mean && defaultValues?.std);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {properties.map((property) => (
          <div key={property} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {getDisplayName(property)}
              {property === 'mean' && <span className="text-gray-500"> (minutes)</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={values[property] || ''}
                placeholder={getPlaceholder(property)}
                onClick={(e) => {
                  // 클릭하면 전체 선택
                  (e.target as HTMLInputElement).select();
                }}
                onChange={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  // 숫자와 소수점만 허용
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value) || 0;
                    onChange({
                      ...values,
                      [property]: numValue,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  // 숫자, 백스페이스, 삭제, 탭, 엔터, 소수점, 방향키만 허용
                  if (
                    !/[0-9]/.test(e.key) &&
                    !['Backspace', 'Delete', 'Tab', 'Enter', '.', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {getUnits(property) && (
                <span className="absolute right-3 top-1.5 text-sm text-gray-500">{getUnits(property)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
