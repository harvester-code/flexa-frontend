import { useCallback } from "react";
import { FacilityWithSchedule, CategoryBadge } from "../schedule-editor/types";
import { getCategoryNameFromField, getCategoryFieldName, getCategoryColorIndex } from "../schedule-editor/badgeMappings";
import { getBadgeColor } from "@/styles/colors";
import { parsePeriodSafe } from "../schedule-editor/helpers";

export function useScheduleInitialization() {
  // JSON 데이터를 그대로 UI에 매핑하는 단순한 로직
  const initializeDisabledCellsFromPeriods = useCallback(
    (
      facilities: FacilityWithSchedule[],
      timeSlots: string[],
      isPreviousDay: boolean,
      currentDate: string,
      prevDayStr: string
    ): {
      disabledCells: Set<string>;
      badges: Record<string, CategoryBadge[]>;
      processTimes: Record<string, number>;
    } => {
      const newDisabledCells = new Set<string>();
      const newBadges: Record<string, CategoryBadge[]> = {};
      const newProcessTimes: Record<string, number> = {};

      const midnightIdx = timeSlots.indexOf("00:00");
      const slotDateTimes = timeSlots.map((time, idx) => {
        let dateForSlot = currentDate;

        if (isPreviousDay && midnightIdx >= 0 && idx < midnightIdx) {
          dateForSlot = prevDayStr;
        } else if (isPreviousDay && midnightIdx === -1) {
          // When passenger data spans previous day but 00:00 is missing,
          // treat leading slots as previous day by comparing with first slot time.
          const firstTime = timeSlots[0];
          if (firstTime && firstTime > time) {
            dateForSlot = prevDayStr;
          }
        }

        return new Date(`${dateForSlot} ${time}:00`);
      });

      facilities.forEach((facility, colIndex) => {
        if (!facility?.operating_schedule?.time_blocks) return;

        // JSON의 time_blocks를 그대로 처리
        facility.operating_schedule.time_blocks.forEach((block: any) => {
          if (!block.period) return;

          const parsed = parsePeriodSafe(block.period);

          if (!parsed.valid || !parsed.startDateTime || !parsed.endDateTime) {
            return;
          }

          const matchingSlots: number[] = [];

          slotDateTimes.forEach((slotDateTime, slotIndex) => {
            if (
              slotDateTime >= parsed.startDateTime! &&
              slotDateTime < parsed.endDateTime!
            ) {
              matchingSlots.push(slotIndex);
            }
          });

          if (matchingSlots.length === 0) {
            return;
          }

          if (block.activate === false) {
            matchingSlots.forEach((slotIndex) => {
              newDisabledCells.add(`${slotIndex}-${colIndex}`);
            });
          }

          // Restore process_time_seconds for each matching slot
          if (block.process_time_seconds !== undefined) {
            matchingSlots.forEach((slotIndex) => {
              const cellId = `${slotIndex}-${colIndex}`;
              newProcessTimes[cellId] = block.process_time_seconds;
            });
          }

          if (block.passenger_conditions?.length > 0) {
            const badges: CategoryBadge[] = block.passenger_conditions.map((condition: any) => {
              const categoryName = getCategoryNameFromField(condition.field);
              const colorIndex = getCategoryColorIndex(categoryName);
              const badgeColor = getBadgeColor(colorIndex);

              return {
                category: categoryName,
                field: condition.field,
                options: condition.values || [],
                colorIndex,
                style: badgeColor.style,
              };
            });

            matchingSlots.forEach((slotIndex) => {
              const cellId = `${slotIndex}-${colIndex}`;
              newBadges[cellId] = badges;
            });
          }
        });
      });

      return { disabledCells: newDisabledCells, badges: newBadges, processTimes: newProcessTimes };
    },
    []
  );

  return {
    initializeDisabledCellsFromPeriods,
    getCategoryNameFromField,
    getCategoryFieldName,
  };
}
