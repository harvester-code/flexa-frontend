import { ParquetMetadataItem } from "@/types/parquet";

/**
 * "Category: value" 형식의 conditions 배열을 카테고리별로 그룹핑
 */
export function groupConditionsByCategory(
  conditions: string[]
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  conditions.forEach((condition) => {
    const parts = condition.split(": ");
    if (parts.length === 2) {
      const category = parts[0];
      const value = parts[1];

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(value);
    }
  });

  return groups;
}

/**
 * parquetMetadata 전체에서 중복 없는 고유 항공편 수 반환
 */
export function countUniqueFlightsFromParquet(
  parquetMetadata: ParquetMetadataItem[] | undefined
): number {
  if (!parquetMetadata || parquetMetadata.length === 0) return 0;

  const allFlights = new Set<string>();
  parquetMetadata.forEach((item) => {
    Object.values(item.values).forEach((valueData) => {
      valueData.flights.forEach((flight) => {
        allFlights.add(flight);
      });
    });
  });

  return allFlights.size;
}
