'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InteractivePercentageBarProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onTotalChange?: (total: number) => void;
  configType?: string;
  showValues?: boolean; // 값 표시 여부 (true: 숫자, false: "-")
}

// 예쁜 색깔 팔레트 (primary 색상 제외)
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

export default function InteractivePercentageBar({
  properties,
  values,
  onChange,
  onValidationChange,
  onTotalChange,
  configType,
  showValues = true, // 기본값은 true
}: InteractivePercentageBarProps) {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingValue, setEditingValue] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 비율을 백분율로 변환 (초기값은 균등분배)
  const percentages = properties.reduce(
    (acc, prop) => {
      acc[prop] = values[prop] || 100 / properties.length; // 균등분배 기본값
      return acc;
    },
    {} as Record<string, number>
  );

  // 총합 계산
  const totalPercentage = Object.values(percentages).reduce((sum, val) => sum + val, 0);

  // 정규화된 비율 계산 (총합이 100%가 되도록)
  const normalizedPercentages = properties.reduce(
    (acc, prop) => {
      acc[prop] = totalPercentage > 0 ? (percentages[prop] / totalPercentage) * 100 : 0;
      return acc;
    },
    {} as Record<string, number>
  );

  // Validation 상태 체크 및 부모에게 알림
  const isValid = Math.round(totalPercentage) === 100;

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(totalPercentage);
    }
  }, [totalPercentage, onTotalChange]);

  // 더블클릭으로 편집 시작
  const handleDoubleClick = (index: number, currentValue: number) => {
    if (!showValues) return; // 값 표시 안 할 때는 편집 불가
    setEditingIndex(index);
    setEditingValue(Math.round(currentValue).toString());
  };

  // 편집 완료 (사용자 입력을 그대로 적용)
  const handleEditComplete = () => {
    if (editingIndex === -1) return;

    const newPercentage = Math.max(0, parseFloat(editingValue) || 0);
    const property = properties[editingIndex];

    // 새로운 값 적용
    let newValues = { ...values };

    // 🎯 1개 항목일 때: 항상 100%
    if (properties.length === 1) {
      newValues[property] = 100;
    }
    // 🎯 2개 항목일 때: 자동 배정 (나머지 = 100 - 현재값)
    else if (properties.length === 2) {
      newValues[property] = Math.min(100, newPercentage); // 100% 초과 방지
      const otherProperty = properties.find((p) => p !== property);
      if (otherProperty) {
        newValues[otherProperty] = 100 - newValues[property];
      }
    }
    // 🎯 3개 이상일 때: 사용자 입력 그대로 적용
    else {
      newValues[property] = newPercentage;
    }

    onChange(newValues);
    setEditingIndex(-1);
    setEditingValue('');
  };

  // ESC 키로 편집 취소
  const handleEditCancel = () => {
    setEditingIndex(-1);
    setEditingValue('');
  };

  return (
    <div className="space-y-4">
      {/* 인터랙티브 바 */}
      <div className="relative">
        <div
          ref={barRef}
          className="border-default-200 bg-default-100 relative h-12 w-full overflow-hidden rounded-lg border-2 shadow-sm"
        >
          {/* 컬러 세그먼트들 */}
          {properties.map((property, index) => {
            const displayPercentage = percentages[property] || 0; // 실제 입력값
            const normalizedPercentage = normalizedPercentages[property] || 0; // 바 너비용
            const color = COLORS[index % COLORS.length];

            // 실제 표시될 너비 계산 (0%인 경우 최소 너비 보장)
            const actualWidth = Math.max(normalizedPercentage, displayPercentage === 0 ? 2 : 0);

            // leftPosition은 이전 항목들의 실제 너비를 고려해서 계산
            const leftPosition = properties.slice(0, index).reduce((sum, prop) => {
              const prevDisplayPercentage = percentages[prop] || 0;
              const prevNormalizedPercentage = normalizedPercentages[prop] || 0;
              const prevActualWidth = Math.max(prevNormalizedPercentage, prevDisplayPercentage === 0 ? 2 : 0);
              return sum + prevActualWidth;
            }, 0);

            return (
              <div
                key={property}
                className={`absolute top-0 flex h-full items-center justify-center transition-all duration-200 ease-out ${
                  showValues ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
                }`}
                style={{
                  left: `${leftPosition}%`,
                  width: `${actualWidth}%`,
                  backgroundColor: color,
                }}
                onDoubleClick={() => handleDoubleClick(index, displayPercentage)}
                title={showValues ? 'Double-click to edit' : 'Values disabled - enable in toggle above'}
              >
                {/* 편집 중이면 input 필드, 아니면 라벨 */}
                {editingIndex === index && showValues ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => {
                      // 숫자만 허용
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      setEditingValue(numericValue);
                    }}
                    onBlur={handleEditComplete}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditComplete();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    className="w-16 rounded border bg-white px-1 py-0.5 text-center text-xs font-medium text-gray-900"
                    autoFocus
                    min="0"
                    max="100"
                    step="1"
                  />
                ) : (
                  /* 라벨 표시 - 0%도 표시하되, 너비가 너무 좁으면 숨김 */
                  actualWidth > 3 && (
                    <div className="flex flex-col items-center text-xs font-medium text-white">
                      <div>{property}</div>
                      <div>{showValues ? `${Math.round(displayPercentage)}%` : '−'}</div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
