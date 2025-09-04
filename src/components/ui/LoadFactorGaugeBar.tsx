import React from 'react';

interface LoadFactorGaugeBarProps {
  property: string;
  value: number;
  index?: number;
}

// 색상 배열 - 기존 PassengerConfigTab과 동일
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

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
