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

/**
 * Load Factor와 동일한 변환 함수들
 */
export const convertToDecimal = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return value / 100; // 정수 백분율을 소수점으로
};

export const convertToPercentage = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  // 소수점 값(≤1)이면 *100, 정수 값(>1)이면 그대로 사용
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
};

/**
 * validation을 위한 헬퍼 함수들 - 호환성 유지 (소수점/정수 자동 감지)
 */
export const isValidDistribution = (values: Record<string, number>) => {
  const total = Object.values(values || {}).reduce((sum, value) => {
    // 소수점 값(≤1)이면 백분율로 변환, 정수 값(>1)이면 그대로 사용
    const convertedValue = typeof value === 'number' && value <= 1 ? value * 100 : value;
    return sum + convertedValue;
  }, 0);
  return Math.abs(total - 100) < 0.1; // 소수점 오차 고려
};

export const getDistributionTotal = (values: Record<string, number>) => {
  return Object.values(values || {}).reduce((sum, value) => {
    // 소수점 값(≤1)이면 백분율로 변환, 정수 값(>1)이면 그대로 사용
    const convertedValue = typeof value === 'number' && value <= 1 ? value * 100 : value;
    return sum + convertedValue;
  }, 0);
};

/**
 * InteractivePercentageBar의 래퍼 컴포넌트
 * 🎯 Load Factor와 동일한 변환 패턴: zustand↔UI 자동 변환
 */
export default function PercentageInteractiveBar({
  values,
  onChange,
  onValidationChange,
  onTotalChange,
  ...props
}: PercentageInteractiveBarProps) {
  // zustand 값을 UI 표시용으로 변환 (소수점 → 정수 백분율)
  const displayValues = useMemo(() => {
    if (!values) return {};

    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        convertToPercentage(value), // 소수점이면 *100, 정수면 그대로
      ])
    );
  }, [values]);

  // UI 입력을 zustand 저장용으로 변환 (정수 백분율 → 소수점)
  const handleChange = useCallback(
    (newValues: Record<string, number>) => {
      const convertedValues = Object.fromEntries(
        Object.entries(newValues).map(([key, value]) => [
          key,
          convertToDecimal(value), // 정수 → 소수점
        ])
      );
      onChange(convertedValues);
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
