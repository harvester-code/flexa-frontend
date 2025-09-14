import React from 'react';
import { COMPONENT_TYPICAL_COLORS } from '@/styles/colors';

interface LoadFactorGaugeBarProps {
  property: string;
  value: number;
  index?: number;
}

// Use all colors from COMPONENT_TYPICAL_COLORS
const COLORS = COMPONENT_TYPICAL_COLORS;

export const LoadFactorGaugeBar: React.FC<LoadFactorGaugeBarProps> = ({ property, value, index = 0 }) => {
  const color = COLORS[index % COLORS.length];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{property}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="relative h-8 w-full overflow-hidden rounded-md bg-gray-100">
        <div
          className="flex h-full items-center justify-center text-xs font-semibold text-white transition-all duration-300"
          style={{
            width: `${Math.max(value, 5)}%`, // 최소 5% 너비로 텍스트가 보이게
            backgroundColor: color,
          }}
        >
          {value >= 20 && `${value}%`} {/* 너비가 충분할 때만 텍스트 표시 */}
        </div>
      </div>
    </div>
  );
};
