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

