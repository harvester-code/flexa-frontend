import React from 'react';
import { LoadFactorSlider } from '@/components/ui/LoadFactorSlider';

// Color palette identical to other components
const COLORS = [
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5A2B', // Brown
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#64748B', // Slate
];

interface RuleValueDisplayProps {
  configType: string;
  ruleValue: any;
  properties: string[];
  isReadOnly?: boolean;
}

// 각 타입별 값 표시 컴포넌트들
const DistributionDisplay: React.FC<{ values: Record<string, number>; properties: string[] }> = ({
  values,
  properties,
}) => {
  const total = Object.values(values).reduce((sum, val) => sum + val, 0);

  if (properties.length === 0 || total === 0) {
    return (
      <div className="flex h-12 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
        No data
      </div>
    );
  }

  return (
    <div className="flex h-12 w-full overflow-hidden rounded bg-gray-100">
      {properties.map((property, index) => {
        const percentage = values[property] || 0;
        const width = total > 0 ? (percentage / total) * 100 : 0;
        const color = COLORS[index % COLORS.length];

        return (
          <div
            key={property}
            className="relative flex flex-col items-center justify-center text-xs font-medium text-white"
            style={{
              width: `${width}%`,
              backgroundColor: color,
            }}
            title={`${property}: ${percentage}%`}
          >
            <div className="text-center leading-tight">
              <div className="font-semibold">{property}</div>
              <div>{percentage}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LoadFactorDisplay: React.FC<{ value: number; isReadOnly?: boolean }> = ({ value, isReadOnly = true }) => {
  const displayValue = Math.round(value * 100); // 0.0-1.0 → 0-100%

  // Read-only 상태에서도 게이지바 형태로 표시 (Nationality처럼)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Load Factor</span>
        <span className="font-semibold text-gray-900">{displayValue}%</span>
      </div>
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="flex h-full items-center justify-center rounded-full bg-primary text-xs font-semibold text-white transition-all duration-300"
          style={{
            width: `${Math.max(displayValue, 8)}%`, // 최소 8%는 보이도록
          }}
        >
          {displayValue >= 15 && `${displayValue}%`}
        </div>
      </div>
    </div>
  );
};

const ShowUpTimeDisplay: React.FC<{ values: Record<string, number> }> = ({ values }) => {
  return (
    <div className="space-y-2 rounded-md bg-gray-50 p-3">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium capitalize text-gray-700">{key}:</span>
          <span className="text-sm font-semibold text-gray-900">
            {value} {key === 'mean' ? 'minutes' : key === 'std' ? 'std' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export const RuleValueDisplay: React.FC<RuleValueDisplayProps> = ({
  configType,
  ruleValue,
  properties,
  isReadOnly = true,
}) => {
  if (!ruleValue) {
    return <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">No data</div>;
  }

  switch (configType) {
    case 'nationality':
    case 'profile': {
      // 소수점 → 퍼센트 변환
      const percentageValues: Record<string, number> = {};
      Object.entries(ruleValue).forEach(([key, value]: [string, any]) => {
        percentageValues[key] = Math.round((value || 0) * 100);
      });

      return (
        <DistributionDisplay
          values={percentageValues}
          properties={properties.length > 0 ? properties : Object.keys(percentageValues)}
        />
      );
    }

    case 'load_factor': {
      return <LoadFactorDisplay value={ruleValue.load_factor || 0} isReadOnly={isReadOnly} />;
    }

    case 'pax_arrival_patterns': {
      return <ShowUpTimeDisplay values={ruleValue} />;
    }

    default:
      return (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">Unknown configuration type: {configType}</div>
      );
  }
};
