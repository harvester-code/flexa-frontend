"use client";

import React, { useEffect, useRef, useState } from "react";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";

interface InteractivePercentageBarProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onTotalChange?: (total: number) => void;
  configType?: string;
  showValues?: boolean; // 값 표시 여부 (true: 숫자, false: "-")
}

// Use all colors from COMPONENT_TYPICAL_COLORS
const COLORS = COMPONENT_TYPICAL_COLORS;

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
  const [editingValue, setEditingValue] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력값 그대로 사용 (초기값은 균등분배)
  const percentages = properties.reduce(
    (acc, prop) => {
      // 🎯 입력값 그대로 사용 - 변환하지 않음
      acc[prop] = values[prop] ?? 100 / properties.length; // 균등분배 기본값
      return acc;
    },
    {} as Record<string, number>
  );

  // 총합 계산
  const totalPercentage = Object.values(percentages).reduce(
    (sum, val) => sum + val,
    0
  );

  // 🔄 수정: 5% 이하 항목들이 실제 5% 폭을 차지한다고 가정한 정규화
  const normalizedPercentages = properties.reduce(
    (acc, prop) => {
      const displayPercentage = percentages[prop] || 0;

      // 5% 이하면 실제 표시폭 5%로 고정
      if (displayPercentage <= 5) {
        acc[prop] = 5;
      } else {
        // 6% 이상인 항목들만 비례배분 계산
        const smallItemsCount = properties.filter(
          (p) => (percentages[p] || 0) <= 5
        ).length;
        const reservedWidth = smallItemsCount * 5; // 5% 이하 항목들이 차지할 총 폭
        const availableWidth = Math.max(0, 100 - reservedWidth); // 나머지 사용 가능한 폭

        // 6% 이상인 항목들의 총 비율
        const largeItemsTotal = properties
          .filter((p) => (percentages[p] || 0) > 5)
          .reduce((sum, p) => sum + (percentages[p] || 0), 0);

        // 사용 가능한 폭 내에서 비례배분
        acc[prop] =
          largeItemsTotal > 0
            ? (displayPercentage / largeItemsTotal) * availableWidth
            : 0;
      }

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

  // 싱글 클릭으로 편집 시작
  const handleClick = (index: number, currentValue: number) => {
    if (!showValues) return; // 값 표시 안 할 때는 편집 불가
    setEditingIndex(index);
    setEditingValue(Math.round(currentValue).toString());
  };

  // 편집 완료 (사용자 입력을 그대로 적용)
  const handleEditComplete = () => {
    if (editingIndex === -1) return;

    const newPercentage = Math.max(0, parseFloat(editingValue) || 0);
    const property = properties[editingIndex];

    // 새로운 값 적용 - 입력값 그대로 저장
    const newValues = { ...values };

    // 🎯 1개 항목일 때: 항상 100
    if (properties.length === 1) {
      newValues[property] = 100; // 100 그대로
    }
    // 🎯 2개 항목일 때: 자동 배정 (나머지 = 100 - 현재값)
    else if (properties.length === 2) {
      const clampedPercentage = Math.min(100, newPercentage); // 100% 초과 방지
      newValues[property] = clampedPercentage; // 입력값 그대로
      const otherProperty = properties.find((p) => p !== property);
      if (otherProperty) {
        newValues[otherProperty] = 100 - clampedPercentage; // 나머지도 그대로
      }
    }
    // 🎯 3개 이상일 때: 사용자 입력 그대로 적용
    else {
      newValues[property] = newPercentage; // 입력값 그대로
    }

    onChange(newValues);
    setEditingIndex(-1);
    setEditingValue("");
  };

  // ESC 키로 편집 취소
  const handleEditCancel = () => {
    setEditingIndex(-1);
    setEditingValue("");
  };

  // 🆕 normalizedPercentages에서 이미 5% 이하는 5%로, 6% 이상은 비례배분으로 올바르게 계산됨

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

            // 실제 표시될 너비 (normalizedPercentages에서 이미 올바르게 계산됨)
            const actualWidth = normalizedPercentage;

            // leftPosition은 이전 항목들의 실제 너비를 고려해서 계산
            const leftPosition = properties
              .slice(0, index)
              .reduce((sum, prop) => {
                const prevNormalizedPercentage =
                  normalizedPercentages[prop] || 0;
                return sum + prevNormalizedPercentage;
              }, 0);

            return (
              <div
                key={property}
                className={`absolute top-0 flex h-full items-center justify-center transition-all duration-200 ease-out ${
                  showValues
                    ? "cursor-pointer hover:brightness-110"
                    : "cursor-default"
                }`}
                style={{
                  left: `${leftPosition}%`,
                  width: `${actualWidth}%`,
                  backgroundColor: color,
                }}
                onClick={() => handleClick(index, displayPercentage)}
                title={
                  showValues
                    ? "Click to edit"
                    : "Values disabled - enable in toggle above"
                }
              >
                {/* 편집 중이면 input 필드, 아니면 라벨 */}
                {editingIndex === index && showValues ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => {
                      // 숫자만 허용
                      const numericValue = (
                        e.target as HTMLInputElement
                      ).value.replace(/[^0-9]/g, "");
                      setEditingValue(numericValue);
                    }}
                    onBlur={handleEditComplete}
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditComplete();
                      if (e.key === "Escape") handleEditCancel();
                    }}
                    className="w-16 rounded border bg-white px-1 py-0.5 text-center text-xs font-medium text-gray-900"
                    autoFocus
                    min="0"
                    max="100"
                    step="1"
                  />
                ) : (
                  /* 라벨 표시 - 최소폭이 있으면 항상 표시 (0%도 포함) */
                  actualWidth >= 3 && (
                    <div className="flex flex-col items-center text-white">
                      <div className="text-xs font-normal opacity-80 scale-90 leading-tight">
                        {property}
                      </div>
                      <div className="font-bold leading-tight -mt-0.5">
                        {showValues ? `${Math.round(displayPercentage)}%` : "−"}
                      </div>
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
