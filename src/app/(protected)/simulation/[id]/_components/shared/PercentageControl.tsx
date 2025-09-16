'use client';

import React, { useCallback, useMemo } from 'react';
import InteractivePercentageBar from './InteractivePercentageBar';

interface PercentageInteractiveBarProps {
  properties: string[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  onValidationChange?: (isValid: boolean) => void;
  onTotalChange?: (total: number) => void;
  configType?: string;
  showValues?: boolean;
}

// 변환 함수 제거 - 더 이상 소수점 변환을 하지 않음
// 모든 값은 정수 퍼센트(0-100)로 저장 및 표시

/**
 * Validation 헬퍼 함수들 - 정수 퍼센트 값을 그대로 검증
 */
export const isValidDistribution = (values: Record<string, number>) => {
  const total = Object.values(values || {}).reduce((sum, value) => {
    // 🎯 수정: 값을 그대로 사용 - 변환하지 않음
    return sum + (value || 0);
  }, 0);
  return Math.abs(total - 100) < 0.1; // 소수점 오차 고려
};

export const getDistributionTotal = (values: Record<string, number>) => {
  return Object.values(values || {}).reduce((sum, value) => {
    // 🎯 수정: 값을 그대로 사용 - 변환하지 않음
    return sum + (value || 0);
  }, 0);
};

/**
 * InteractivePercentageBar의 래퍼 컴포넌트
 * 정수 퍼센트(0-100)를 그대로 저장하고 표시
 */
export default function PercentageInteractiveBar({
  values,
  onChange,
  onValidationChange,
  onTotalChange,
  ...props
}: PercentageInteractiveBarProps) {
  // 값을 그대로 사용 - 변환하지 않음
  const displayValues = useMemo(() => {
    return values || {};
  }, [values]);

  // UI 입력을 그대로 전달 - 변환하지 않음
  const handleChange = useCallback(
    (newValues: Record<string, number>) => {
      onChange(newValues);
    },
    [onChange]
  );

  // ✅ Validation 콜백도 변환해서 전달
  const handleValidationChange = useCallback(
    (isValid: boolean) => {
      onValidationChange?.(isValid);
    },
    [onValidationChange]
  );

  const handleTotalChange = useCallback(
    (total: number) => {
      onTotalChange?.(total);
    },
    [onTotalChange]
  );

  return (
    <InteractivePercentageBar
      values={displayValues}
      onChange={handleChange}
      onValidationChange={handleValidationChange}
      onTotalChange={handleTotalChange}
      {...props}
    />
  );
}
