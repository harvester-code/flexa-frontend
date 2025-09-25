import { useCallback } from "react";
import { FacilityWithSchedule, CategoryBadge } from "../schedule-editor/types";
import { getCategoryNameFromField, getCategoryFieldName } from "../schedule-editor/badgeMappings";

// Safe period parsing function
const parsePeriodSafe = (period: string) => {
  try {
    // Try both formats: "2025-09-22 21:00 - 2025-09-22 21:30" and "2025-09-22 21:00:00-2025-09-22 21:30:00"
    let startPart, endPart;

    if (period.includes(" - ")) {
      // Original format with spaces around hyphen
      [startPart, endPart] = period.split(" - ");
    } else {
      // New format without spaces, need to find the date boundary
      // Format: "YYYY-MM-DD HH:MM:SS-YYYY-MM-DD HH:MM:SS"
      // Find the position of the second date (after time)
      const match = period.match(
        /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)-(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)$/
      );
      if (match) {
        startPart = match[1];
        endPart = match[2];
      } else {
        throw new Error("Invalid period format");
      }
    }

    const [startDate, startTimeRaw] = startPart.split(" ");
    const [endDate, endTimeRaw] = endPart.split(" ");

    // Convert HH:MM:SS to HH:MM format if needed
    const startTime = startTimeRaw.split(":").slice(0, 2).join(":");
    const endTime = endTimeRaw.split(":").slice(0, 2).join(":");

    return {
      valid: true,
      startDate,
      startTime,
      endDate,
      endTime,
    };
  } catch {
    return {
      valid: false,
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    };
  }
};

export function useScheduleInitialization() {
  // Period string to disabled cells converter function
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
        if (facility?.operating_schedule?.time_blocks) {
          const timeBlocks = facility.operating_schedule.time_blocks;

          // If no time_blocks, all cells are enabled (default)
          if (timeBlocks.length === 0) {
            return;
          }

          // Process each time_block - 단순화된 로직
          timeBlocks.forEach((block: any, blockIndex: number) => {
            if (block.period) {
              console.log(
                "Processing time_block",
                blockIndex,
                "for facility:",
                facility.id,
                "period:",
                block.period,
                "activate:",
                block.activate,
                "conditions:",
                block.passenger_conditions?.length || 0
              );

              // Safe period parsing
              const parsedPeriod = parsePeriodSafe(block.period);

              if (!parsedPeriod.valid) {
                console.error("Failed to parse period:", block.period);
                return;
              }

              const { startTime, endTime, startDate, endDate } = parsedPeriod;

              // Helper function to find closest time slot index
              const findClosestTimeSlotIndex = (targetTime: string, isEndTime: boolean = false): number => {
                const [targetHour, targetMin] = targetTime.split(":").map(Number);
                const targetMinutes = targetHour * 60 + targetMin;

                // First try exact match
                const exactIdx = timeSlots.indexOf(targetTime);
                if (exactIdx !== -1) return exactIdx;

                // Find closest slot
                let closestIdx = -1;
                let minDiff = Infinity;

                for (let i = 0; i < timeSlots.length; i++) {
                  const [slotHour, slotMin] = timeSlots[i].split(":").map(Number);
                  const slotMinutes = slotHour * 60 + slotMin;
                  const diff = Math.abs(slotMinutes - targetMinutes);

                  if (isEndTime) {
                    // For end time, prefer slots that come after the target
                    if (slotMinutes >= targetMinutes && diff < minDiff) {
                      minDiff = diff;
                      closestIdx = i;
                    }
                  } else {
                    // For start time, prefer slots that come at or before the target
                    if (slotMinutes <= targetMinutes) {
                      closestIdx = i;
                    } else if (closestIdx === -1) {
                      // If no slot before target, use the first slot after
                      closestIdx = i;
                      break;
                    }
                  }
                }

                // Fallback
                if (closestIdx === -1) {
                  closestIdx = isEndTime ? timeSlots.length : 0;
                }

                return closestIdx;
              };

              // Find start and end indices in timeSlots
              let startIdx = findClosestTimeSlotIndex(startTime, false);
              let endIdx: number;

              // Special handling for end time
              if (endTime === "00:00" && endDate > startDate) {
                // This spans to next day(s) 00:00
                // Check how many days ahead
                const start = new Date(startDate);
                const end = new Date(endDate);
                const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff >= 1) {
                  // Spans multiple days, include all time slots
                  endIdx = timeSlots.length;
                } else {
                  endIdx = findClosestTimeSlotIndex(endTime, true);
                }
              } else {
                endIdx = findClosestTimeSlotIndex(endTime, true);
              }

              console.log(
                `Time range: ${startTime}(${startIdx}) - ${endTime}(${endIdx})`,
                `Dates: ${startDate} to ${endDate}`
              );

              if (startIdx >= 0 && endIdx > startIdx) {
                // Apply activate state to all cells in this period
                for (let i = startIdx; i < endIdx; i++) {
                  const cellId = `${i}-${colIndex}`;

                  // 🎯 단순한 로직: activate가 false면 비활성화
                  if (block.activate === false) {
                    newDisabledCells.add(cellId);
                    console.log(`Disabled cell: ${cellId} (activate: false)`);
                  }
                }

                // 🎯 passenger_conditions → badges (activate와 독립적)
                if (
                  block.passenger_conditions &&
                  block.passenger_conditions.length > 0
                ) {
                  const badges: CategoryBadge[] = [];

                  block.passenger_conditions.forEach((condition: any) => {
                    const categoryName = getCategoryNameFromField(
                      condition.field
                    );
                    if (categoryName && categories[categoryName]) {
                      const categoryConfig = categories[categoryName];
                      badges.push({
                        category: categoryName,
                        options: condition.values || [],
                        colorIndex: categoryConfig.colorIndex,
                      });
                    }
                  });

                  if (badges.length > 0) {
                    console.log(
                      `Applying badges to range ${startIdx}-${endIdx}:`,
                      badges
                    );

                    // Apply badges to all cells in this period (activate 상태 무관)
                    for (let i = startIdx; i < endIdx; i++) {
                      const cellId = `${i}-${colIndex}`;

                      if (newBadges[cellId]) {
                        // Merge with existing badges without duplicates
                        const existingCategories = new Set(
                          newBadges[cellId].map((b) => b.category)
                        );
                        badges.forEach((badge) => {
                          if (!existingCategories.has(badge.category)) {
                            newBadges[cellId].push(badge);
                          }
                        });
                      } else {
                        newBadges[cellId] = [...badges];
                      }

                      console.log(
                        `Added badge to cell: ${cellId}`,
                        newBadges[cellId]
                      );
                    }
                  }
                }
              }
            }
          });
        }
      });

      console.log("Final result:", {
        disabledCells: Array.from(newDisabledCells),
        badgedCells: Object.keys(newBadges),
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
