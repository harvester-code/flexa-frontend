"use client";

import { getColumnLabel, getColumnName } from "@/styles/columnMappings";

interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices?: number[];
    }
  >;
}

export interface FlightRuleLike {
  id: string;
  conditions: string[];
  originalConditions?: Record<string, string[]>;
  flightCount?: number;
}

// 주어진 apiField/value가 parquetMetadata에 존재하는 컬럼 키로 매칭되도록 보정
export const resolveColumnKey = (
  parquetMetadata: ParquetMetadataItem[] | undefined,
  apiField: string,
  value: string
): string => {
  if (!parquetMetadata || parquetMetadata.length === 0) return apiField;

  // 1) 동일 컬럼이 존재하고 값이 있으면 그대로 사용
  const direct = parquetMetadata.find(
    (item) => item.column === apiField && item.values?.[value]
  );
  if (direct) return apiField;

  // 2) 같은 라벨을 가진 컬럼 중 값이 존재하는 첫 번째 컬럼을 사용 (예: iata <-> name)
  const label = getColumnLabel(apiField);
  const fallback = parquetMetadata.find(
    (item) => getColumnLabel(item.column) === label && item.values?.[value]
  );
  if (fallback) return fallback.column;

  // 3) 값이 존재하는 아무 컬럼이나 찾아서 사용 (최후 fallback)
  const anyMatch = parquetMetadata.find((item) => item.values?.[value]);
  if (anyMatch) return anyMatch.column;

  // 4) 없으면 원래 키 유지
  return apiField;
};

// rule의 conditions/originalConditions를 columnKey -> values[] 형태로 변환
export const buildConditionMap = (
  rule: FlightRuleLike,
  parquetMetadata: ParquetMetadataItem[] | undefined
): Record<string, string[]> => {
  const conditionMap: Record<string, string[]> = {};

  if (rule.originalConditions && typeof rule.originalConditions === "object") {
    Object.entries(rule.originalConditions).forEach(([apiField, values]) => {
      if (!Array.isArray(values)) return;
      values.forEach((value) => {
        const columnKey = resolveColumnKey(parquetMetadata, apiField, value);
        if (!conditionMap[columnKey]) conditionMap[columnKey] = [];
        if (!conditionMap[columnKey].includes(value)) {
          conditionMap[columnKey].push(value);
        }
      });
    });
    return conditionMap;
  }

  // conditions: ["Label: value", ...]
  rule.conditions.forEach((condition) => {
    const parts = condition.split(": ");
    if (parts.length === 2) {
      const displayLabel = parts[0];
      const value = parts[1];
      const rawColumnKey = getColumnName(displayLabel);
      const columnKey = resolveColumnKey(parquetMetadata, rawColumnKey, value);

      if (!conditionMap[columnKey]) conditionMap[columnKey] = [];
      if (!conditionMap[columnKey].includes(value)) {
        conditionMap[columnKey].push(value);
      }
    }
  });

  return conditionMap;
};

// 조건 맵과 parquetMetadata로 매칭되는 항공편 Set 계산 (없으면 null 반환)
export const getMatchingFlightsByConditionMap = (
  conditionMap: Record<string, string[]>,
  parquetMetadata: ParquetMetadataItem[] | undefined
): Set<string> | null => {
  if (!parquetMetadata || parquetMetadata.length === 0) return null;

  const setsByColumn: Array<Set<string>> = [];

  Object.entries(conditionMap).forEach(([columnKey, values]) => {
    // 동일 컬럼 또는 동일 라벨을 가진 컬럼을 우선 찾음
    const columnData =
      parquetMetadata.find((item) => item.column === columnKey) ||
      parquetMetadata.find(
        (item) => getColumnLabel(item.column) === getColumnLabel(columnKey)
      );

    if (!columnData) return;

    const flightsInColumn = new Set<string>();
    values.forEach((value) => {
      const flightsForValue = columnData.values?.[value]?.flights;
      if (flightsForValue) {
        flightsForValue.forEach((flight) => flightsInColumn.add(flight));
      }
    });

    if (flightsInColumn.size > 0) {
      setsByColumn.push(flightsInColumn);
    }
  });

  if (setsByColumn.length === 0) return null;
  if (setsByColumn.length === 1) return setsByColumn[0];

  // AND 조건: 컬럼별 세트의 교집합
  let intersection = setsByColumn[0];
  for (let i = 1; i < setsByColumn.length; i++) {
    intersection = new Set(
      [...intersection].filter((flight) => setsByColumn[i].has(flight))
    );
  }
  return intersection;
};

// 규칙별 flights 매칭 + 순차 소비 계산
export const allocateFlightsSequential = (
  rules: FlightRuleLike[],
  parquetMetadata: ParquetMetadataItem[] | undefined,
  totalFlights: number
): {
  actualCounts: Record<string, number>;
  limitedCounts: Record<string, number>;
  usedFlights: number;
  remainingFlights: number;
} => {
  const actualCounts: Record<string, number> = {};
  const limitedCounts: Record<string, number> = {};
  const usedFlights = new Set<string>();
  let totalUsedFallback = 0; // fallback 시 사용

  rules.forEach((rule) => {
    const conditionMap = buildConditionMap(rule, parquetMetadata);
    const matchingFlights = getMatchingFlightsByConditionMap(
      conditionMap,
      parquetMetadata
    );

    let actual = 0;
    let limited = 0;

    if (matchingFlights) {
      const available = [...matchingFlights].filter(
        (flight) => !usedFlights.has(flight)
      );
      actual = available.length;
      limited = matchingFlights.size - available.length;
      available.forEach((flight) => usedFlights.add(flight));
    } else {
      // 메타데이터가 없으면 보수적으로 순차 차감
      const remainingTotal = Math.max(0, totalFlights - totalUsedFallback);
      const requested = rule.flightCount ?? 0;
      actual = Math.max(0, Math.min(requested, remainingTotal));
      totalUsedFallback += actual;
    }

    actualCounts[rule.id] = actual;
    limitedCounts[rule.id] = limited;
  });

  const usedFlightsCount =
    usedFlights.size > 0 ? usedFlights.size : totalUsedFallback;
  const remainingFlights = Math.max(0, totalFlights - usedFlightsCount);

  return {
    actualCounts,
    limitedCounts,
    usedFlights: usedFlightsCount,
    remainingFlights,
  };
};
