import { useCallback } from "react";
import { FacilityWithSchedule, CategoryBadge } from "../schedule-editor/types";
import { getCategoryNameFromField, getCategoryFieldName } from "../schedule-editor/badgeMappings";

export function useScheduleInitialization() {
  // JSON 데이터를 그대로 UI에 매핑하는 단순한 로직
  const initializeDisabledCellsFromPeriods = useCallback(
    (
      facilities: FacilityWithSchedule[],
      timeSlots: string[],
      isPreviousDay: boolean,
      categories: Record<string, any>,
      currentDate: string,
      prevDayStr: string
    ): {
      disabledCells: Set<string>;
      badges: Record<string, CategoryBadge[]>;
    } => {
      const newDisabledCells = new Set<string>();
      const newBadges: Record<string, CategoryBadge[]> = {};

      facilities.forEach((facility, colIndex) => {
        if (!facility?.operating_schedule?.time_blocks) return;

        // JSON의 time_blocks를 그대로 처리
        facility.operating_schedule.time_blocks.forEach((block: any) => {
          if (!block.period) return;

          // period에서 시간만 추출 (YYYY-MM-DD HH:MM:SS 형식)
          const match = block.period.match(
            /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):\d{2}-(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):\d{2}/
          );

          if (!match) return;

          const [, startDate, startTime, endDate, endTime] = match;

          // timeSlots에서 인덱스 찾기 - 단순 매핑
          let startIdx = timeSlots.indexOf(startTime);
          let endIdx = timeSlots.indexOf(endTime);

          // 전날부터 시작하는 경우, 동일 시간이 두 번 나타날 수 있음
          if (isPreviousDay && timeSlots.indexOf("00:00") > 0) {
            const midnightIdx = timeSlots.indexOf("00:00");

            // 시작 시간이 중복되는 경우
            if (timeSlots.lastIndexOf(startTime) !== startIdx) {
              // 날짜로 구분
              startIdx = startDate === prevDayStr
                ? timeSlots.indexOf(startTime)  // 첫 번째 (전날)
                : timeSlots.lastIndexOf(startTime); // 두 번째 (당일)
            }

            // 끝 시간이 중복되는 경우
            if (timeSlots.lastIndexOf(endTime) !== endIdx) {
              // 날짜로 구분
              endIdx = endDate === prevDayStr
                ? timeSlots.indexOf(endTime)  // 첫 번째 (전날)
                : timeSlots.lastIndexOf(endTime); // 두 번째 (당일)
            }

            // 23:59는 해당 날짜의 끝을 의미
            if (endTime === "23:59") {
              endIdx = endDate === prevDayStr ? midnightIdx : timeSlots.length;
            }
          } else {
            // 23:59는 끝까지
            if (endTime === "23:59") {
              endIdx = timeSlots.length;
            }
          }

          // 00:00은 다음 슬롯을 의미
          if (endTime === "00:00" && endDate > startDate) {
            endIdx = timeSlots.indexOf("00:00");
            if (endIdx === -1) endIdx = timeSlots.length;
          }

          // 인덱스가 유효한 경우만 처리
          if (startIdx >= 0 && endIdx >= 0 && endIdx > startIdx) {
            // activate가 false면 비활성화
            if (block.activate === false) {
              for (let i = startIdx; i < endIdx; i++) {
                newDisabledCells.add(`${i}-${colIndex}`);
              }
            }

            // passenger_conditions가 있으면 배지 추가
            if (block.passenger_conditions?.length > 0) {
              const badges: CategoryBadge[] = block.passenger_conditions
                .map((condition: any) => {
                  const categoryName = getCategoryNameFromField(condition.field);
                  const categoryConfig = categories[categoryName];
                  if (!categoryName || !categoryConfig) return null;

                  return {
                    category: categoryName,
                    options: condition.values || [],
                    colorIndex: categoryConfig.colorIndex,
                  };
                })
                .filter(Boolean);

              // 해당 구간의 모든 셀에 배지 적용
              for (let i = startIdx; i < endIdx; i++) {
                const cellId = `${i}-${colIndex}`;
                newBadges[cellId] = badges;
              }
            }
          }
        });
      });

      return { disabledCells: newDisabledCells, badges: newBadges };
    },
    []
  );

  return {
    initializeDisabledCellsFromPeriods,
    getCategoryNameFromField,
    getCategoryFieldName,
  };
}