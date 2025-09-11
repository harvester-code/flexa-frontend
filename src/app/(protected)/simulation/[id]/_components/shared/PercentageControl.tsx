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
 * 🔧 개선된 변환 함수들 - 경계값 처리 및 중복 변환 방지
 */
export const convertToDecimal = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  // 항상 정수 백분율(0-100)을 소수점(0-1)으로 변환
  return Math.max(0, Math.min(1, value / 100));
};

export const convertToPercentage = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  // 🎯 수정: 값의 범위에 따라 적절한 변환
  // 0-1 사이: 소수 값 → 백분율로 변환 (0.5 → 50)
  // 1 초과: 이미 백분율 → 그대로 반환 (50 → 50)
  if (value <= 1) {
    return Math.round(Math.max(0, Math.min(100, value * 100)));
  } else {
    return Math.round(Math.max(0, Math.min(100, value)));
  }
};

/**
 * 🔧 개선된 validation 헬퍼 함수들 - 일관된 변환 로직 적용
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
 * 🎯 수정: 프론트엔드에서는 항상 정수 퍼센트로 저장하고 표시
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
