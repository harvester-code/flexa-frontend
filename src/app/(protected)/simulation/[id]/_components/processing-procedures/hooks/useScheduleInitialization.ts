import { useCallback } from "react";
import { FacilityWithSchedule, CategoryBadge } from "../schedule-editor/types";

// Helper function moved from main component
const getCategoryNameFromField = (field: string): string => {
  const fieldToCategoryMap: Record<string, string> = {
    operating_carrier_name: "Airline",
    operating_carrier_iata: "Airline",
    aircraft_type: "Aircraft Type",
    flight_type: "Flight Type",
    arrival_airport_iata: "Arrival Airport",
    departure_airport_iata: "Departure Airport",
    gate_number: "Gate",
    terminal: "Terminal",
    day_of_week: "Day of Week",
    hour_of_day: "Hour of Day",
    passenger_class: "Passenger Class",
    transit_type: "Transit Type",
    passenger_nationality: "Nationality",
    group_size_category: "Group Size",
  };
  return fieldToCategoryMap[field] || field;
};

// Helper function for getting category field name
const getCategoryFieldName = (categoryName: string): string => {
  const categoryToFieldMap: Record<string, string> = {
    Airline: "operating_carrier_name",
    "Aircraft Type": "aircraft_type",
    "Flight Type": "flight_type",
    "Arrival Airport": "arrival_airport_iata",
    "Departure Airport": "departure_airport_iata",
    Gate: "gate_number",
    Terminal: "terminal",
    "Day of Week": "day_of_week",
    "Hour of Day": "hour_of_day",
    "Passenger Class": "passenger_class",
    "Transit Type": "transit_type",
    Nationality: "passenger_nationality",
    "Group Size": "group_size_category",
  };
  return categoryToFieldMap[categoryName] || categoryName;
};

// Badge color configuration
const getBadgeColor = (
  colorIndex: number
): { style: string; hex: string } => {
  const colors = [
    { style: "bg-orange-200 text-orange-900", hex: "#fed7aa" },
    { style: "bg-yellow-200 text-yellow-900", hex: "#fef08a" },
    { style: "bg-lime-200 text-lime-900", hex: "#d9f99d" },
    { style: "bg-green-200 text-green-900", hex: "#bbf7d0" },
    { style: "bg-teal-200 text-teal-900", hex: "#99f6e4" },
    { style: "bg-blue-200 text-blue-900", hex: "#bfdbfe" },
    { style: "bg-purple-200 text-purple-900", hex: "#e9d5ff" },
    { style: "bg-pink-200 text-pink-900", hex: "#fbcfe8" },
    { style: "bg-rose-200 text-rose-900", hex: "#fecdd3" },
    { style: "bg-amber-200 text-amber-900", hex: "#fde68a" },
    { style: "bg-emerald-200 text-emerald-900", hex: "#a7f3d0" },
    { style: "bg-cyan-200 text-cyan-900", hex: "#a5f3fc" },
    { style: "bg-indigo-200 text-indigo-900", hex: "#c7d2fe" },
    { style: "bg-fuchsia-200 text-fuchsia-900", hex: "#f5d0fe" },
    { style: "bg-gray-200 text-gray-900", hex: "#e5e7eb" },
    { style: "bg-slate-200 text-slate-900", hex: "#e2e8f0" },
  ];
  return colors[colorIndex % colors.length];
};

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
      const match = period.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)-(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)$/);
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
    return { valid: false, startDate: "", startTime: "", endDate: "", endTime: "" };
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
      console.log("initializeDisabledCellsFromPeriods called with:", {
        facilitiesCount: facilities.length,
        timeSlotsCount: timeSlots.length,
        isPreviousDay,
        currentDate,
        prevDayStr,
        firstFacility: facilities[0],
      });

      const newDisabledCells = new Set<string>();
      const newBadges: Record<string, CategoryBadge[]> = {};
      const date = currentDate;

      facilities.forEach((facility, colIndex) => {
        if (facility?.operating_schedule?.time_blocks) {
          const timeBlocks = facility.operating_schedule.time_blocks;

          // If no time_blocks, all cells are enabled (default)
          if (timeBlocks.length === 0) {
            return;
          }

          // Track activated time slots
          const activatedSlots = new Set<number>();

          // Process each time_block
          timeBlocks.forEach((block: any, blockIndex: number) => {
            if (block.period) {
              console.log(
                "Processing time_block",
                blockIndex,
                "for facility:",
                facility.id,
                "period:",
                block.period,
                "has conditions:",
                block.passenger_conditions?.length > 0
              );

              // Safe period parsing
              const parsedPeriod = parsePeriodSafe(block.period);

              if (!parsedPeriod.valid) {
                console.error("Failed to parse period:", block.period);
                // Fallback to full activation to preserve data
                for (let i = 0; i < timeSlots.length; i++) {
                  activatedSlots.add(i);
                }
                return;
              }

              const { startDate, startTime, endDate, endTime } = parsedPeriod;

              console.log("Parsed period:", {
                startDate,
                startTime,
                endDate,
                endTime,
                currentDate: date,
                isPreviousDay,
              });

              // Handle multi-day periods
              const nextDayStr = new Date(new Date(date).getTime() + 86400000)
                .toISOString()
                .split("T")[0];

              // Check if period includes current display date range
              const periodStartDate = new Date(startDate);
              const periodEndDate = new Date(endDate);
              const currentDateObj = new Date(date);
              const prevDateObj = new Date(prevDayStr);

              console.log("Date range check:", {
                periodStart: periodStartDate,
                periodEnd: periodEndDate,
                currentDate: currentDateObj,
                prevDate: prevDateObj,
                isPreviousDay,
              });

              // Check if period covers entire time range (2+ days)
              const isFullPeriod =
                periodStartDate <= prevDateObj &&
                periodEndDate >= currentDateObj;

              if (isFullPeriod) {
                // Activate all time slots
                console.log(
                  "Full period detected - activating all cells for facility:",
                  facility.id
                );
                for (let i = 0; i < timeSlots.length; i++) {
                  activatedSlots.add(i);
                }
              } else {
                // Handle partial period
                if (isPreviousDay) {
                  // With D-1 display
                  if (startDate <= prevDayStr && endDate >= prevDayStr) {
                    // Include previous day
                    const startIdx =
                      startDate === prevDayStr
                        ? timeSlots.indexOf(startTime)
                        : 0;
                    const endIdx =
                      endDate === prevDayStr
                        ? timeSlots.indexOf(endTime)
                        : timeSlots.indexOf("00:00");

                    if (startIdx !== -1) {
                      for (
                        let i = startIdx;
                        i < timeSlots.length && (endIdx === -1 || i < endIdx);
                        i++
                      ) {
                        if (timeSlots[i] === "00:00") break;
                        activatedSlots.add(i);
                      }
                    }
                  }

                  // Process current day
                  if (startDate <= date && endDate >= date) {
                    const zeroIdx = timeSlots.indexOf("00:00");
                    if (zeroIdx !== -1) {
                      const startIdx =
                        startDate === date
                          ? timeSlots.indexOf(startTime)
                          : zeroIdx;
                      const endIdx =
                        endDate === date
                          ? timeSlots.indexOf(endTime)
                          : timeSlots.length;

                      for (let i = startIdx; i < endIdx; i++) {
                        activatedSlots.add(i);
                      }
                    }
                  }
                } else {
                  // Without D-1 display
                  if (startDate <= date && endDate >= date) {
                    const startIdx =
                      startDate === date ? timeSlots.indexOf(startTime) : 0;
                    const endIdx =
                      endDate === date
                        ? timeSlots.indexOf(endTime)
                        : timeSlots.length;

                    if (startIdx !== -1) {
                      for (let i = startIdx; i < endIdx; i++) {
                        activatedSlots.add(i);
                      }
                    }
                  }
                }
              }

              // Apply badges if passenger_conditions exist
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
                    "Applying badges for period:",
                    block.period,
                    "from",
                    startTime,
                    "to",
                    endTime
                  );

                  // Apply badges to all cells in this period
                  const startIdx = timeSlots.indexOf(startTime);
                  let endIdx = timeSlots.indexOf(endTime);

                  // Calculate exact index if endTime doesn't match exactly
                  if (endIdx === -1 || endIdx <= startIdx) {
                    const [endHour, endMin] = endTime.split(":").map(Number);
                    const timeUnit = timeSlots[1]
                      ? (parseInt(timeSlots[1].split(":")[1]) -
                          parseInt(timeSlots[0].split(":")[1]) +
                          60) %
                          60 || 30
                      : 30;

                    // Calculate previous time slot
                    let prevMin = endMin - timeUnit;
                    let prevHour = endHour;
                    if (prevMin < 0) {
                      prevMin += 60;
                      prevHour -= 1;
                    }

                    const prevEndTime = `${String(prevHour).padStart(2, "0")}:${String(prevMin).padStart(2, "0")}`;
                    endIdx = timeSlots.indexOf(prevEndTime) + 1;

                    // If still not found, find closest index
                    if (endIdx === 0) {
                      for (let i = timeSlots.length - 1; i >= startIdx; i--) {
                        const slotTime = timeSlots[i];
                        if (slotTime <= endTime) {
                          endIdx = i + 1;
                          break;
                        }
                      }
                    }
                  }

                  console.log(
                    "Badge application range:",
                    startIdx,
                    "to",
                    endIdx,
                    "for facility column:",
                    colIndex
                  );

                  if (startIdx !== -1 && endIdx > startIdx) {
                    for (let i = startIdx; i < endIdx; i++) {
                      const cellId = `${i}-${colIndex}`;
                      // Only add badges to activated cells (exclude disabled cells)
                      if (
                        activatedSlots.has(i) &&
                        !newDisabledCells.has(cellId)
                      ) {
                        // Merge with existing badges or add new ones
                        if (newBadges[cellId]) {
                          // Merge without duplicates
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
                          "Added/updated badge for cell:",
                          cellId,
                          "badges:",
                          newBadges[cellId]
                        );
                      }
                    }
                  }
                }
              }
            }
          });

          // After processing all time_blocks, disable non-activated slots
          for (let rowIndex = 0; rowIndex < timeSlots.length; rowIndex++) {
            if (!activatedSlots.has(rowIndex)) {
              const cellId = `${rowIndex}-${colIndex}`;
              newDisabledCells.add(cellId);
            }
          }
        }
      });

      return { disabledCells: newDisabledCells, badges: newBadges };
    },
    []
  );

  return {
    initializeDisabledCellsFromPeriods,
    getCategoryNameFromField,
    getCategoryFieldName,
    getBadgeColor,
  };
}