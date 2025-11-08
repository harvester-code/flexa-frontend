/**
 * Facility ID 생성 및 정규화 헬퍼 함수
 */

/**
 * 제로 패딩이 적용된 시설 ID를 생성합니다.
 * @param zoneName - Zone 이름 (예: 'A', 'B')
 * @param index - 시설 인덱스 (1부터 시작)
 * @param maxCount - 해당 Zone의 최대 시설 개수
 * @returns 제로 패딩이 적용된 ID (예: 'A_01', 'A_001')
 * 
 * @example
 * generateFacilityId('A', 1, 28) → 'A_01'
 * generateFacilityId('A', 1, 100) → 'A_001'
 * generateFacilityId('B', 15, 28) → 'B_15'
 */
export function generateFacilityId(
  zoneName: string,
  index: number,
  maxCount: number
): string {
  const digits = maxCount.toString().length; // 28 → 2자리, 100 → 3자리
  const paddedIndex = index.toString().padStart(digits, '0');
  return `${zoneName}_${paddedIndex}`;
}

/**
 * 기존 시설 ID를 새로운 포맷으로 정규화합니다.
 * 기존 'A_1' 형식을 'A_01' 형식으로 변환합니다.
 * @param oldId - 기존 ID (예: 'A_1', 'A_01')
 * @param maxCount - 해당 Zone의 최대 시설 개수
 * @returns 정규화된 ID
 * 
 * @example
 * normalizeFacilityId('A_1', 28) → 'A_01'
 * normalizeFacilityId('A_01', 28) → 'A_01' (이미 변환됨)
 * normalizeFacilityId('B_5', 100) → 'B_005'
 */
export function normalizeFacilityId(
  oldId: string,
  maxCount: number
): string {
  const match = oldId.match(/^([A-Z_]+)_(\d+)$/);
  if (!match) return oldId;

  const [, zoneName, index] = match;
  return generateFacilityId(zoneName, parseInt(index), maxCount);
}

/**
 * Zone 이름에서 숫자를 제외한 실제 이름을 추출합니다.
 * @param zoneKey - Zone 키 (예: 'A', 'exit_1')
 * @returns Zone 이름
 */
export function extractZoneName(zoneKey: string): string {
  // Zone 이름에서 숫자 제거
  return zoneKey.replace(/_\d+$/, '');
}

/**
 * Process Flow 데이터를 로드할 때 시설 ID를 새로운 포맷으로 마이그레이션합니다.
 * 기존 'A_1' 형식을 'A_01' 형식으로 변환하여 호환성을 유지합니다.
 * @param processFlow - Process Flow 배열
 * @returns 마이그레이션된 Process Flow
 * 
 * @example
 * // 기존: A_1, A_2, ..., A_28
 * // 변환: A_01, A_02, ..., A_28
 */
export function migrateProcessFlowFacilityIds(processFlow: any[]): any[] {
  if (!Array.isArray(processFlow)) return processFlow;

  return processFlow.map((process) => {
    if (!process.zones || typeof process.zones !== 'object') {
      return process;
    }

    const updatedZones = { ...process.zones };

    Object.entries(updatedZones).forEach(([zoneName, zone]: [string, any]) => {
      if (!zone?.facilities || !Array.isArray(zone.facilities)) {
        return;
      }

      const maxCount = zone.facilities.length;
      const digits = maxCount.toString().length;

      // 각 시설의 ID를 제로 패딩으로 변환
      zone.facilities = zone.facilities.map((facility: any, idx: number) => {
        // 기존 ID에서 숫자 추출 (순서 보존)
        const match = facility.id.match(/^([A-Z_]+)_(\d+)$/);
        if (match) {
          const [, zonePrefix, oldIndex] = match;
          const paddedIndex = oldIndex.padStart(digits, '0');
          return {
            ...facility,
            id: `${zonePrefix}_${paddedIndex}`,
          };
        }
        
        // 매칭이 안되면 인덱스 기반으로 생성 (폴백)
        const paddedIndex = (idx + 1).toString().padStart(digits, '0');
        return {
          ...facility,
          id: `${zoneName}_${paddedIndex}`,
        };
      });
    });

    return { ...process, zones: updatedZones };
  });
}

