import React from "react";
import { getBadgeColor } from "@/styles/colors";
import { ParquetMetadataItem, CategoryBadge, TimeBlock } from "./types";
import { getCategoryNameFromField, getCategoryIcon, getStorageFieldName, getCategoryColorIndex } from "./badgeMappings";
import { Users, MapPin } from "lucide-react";
import { LABELS } from "@/styles/columnMappings";

// 🎨 동적 카테고리 생성 함수 (SearchCriteriaSelector와 동일 로직)
export const createDynamicConditionCategories = (
  parquetMetadata: ParquetMetadataItem[],
  paxDemographics: Record<string, any>,
  flightAirlines?: Record<string, string> | null
) => {
  const categories: Record<
    string,
    {
      icon: React.ComponentType<any>;
      options: string[];
      colorIndex: number; // 색상 인덱스 사용
    }
  > = {};


  // 🎯 1단계: parquetMetadata 처리
  parquetMetadata.forEach((item) => {
    const categoryName = getCategoryNameFromField(item.column);

    // Skip if field is not mapped
    if (categoryName === item.column) {
      return;
    }

    const icon = getCategoryIcon(categoryName);

    if (categoryName) {
      let options = Object.keys(item.values);

      // ✈️ 항공사 카테고리의 경우 이름을 코드로 변환
      if (categoryName === "Airline" && flightAirlines) {
        // 항공사 이름을 코드로 매핑
        const nameToCodeMap = Object.fromEntries(
          Object.entries(flightAirlines).map(([code, name]) => [name, code])
        );

        options = options.map((airlineName) => {
          // 이름에서 코드로 변환, 매핑되지 않으면 원래 이름 유지
          return nameToCodeMap[airlineName] || airlineName;
        });
      }

      if (options.length > 0) {
        categories[categoryName] = {
          icon,
          options,
          colorIndex: getCategoryColorIndex(categoryName),
        };
      }
    }
  });

  // 🎯 2단계: paxDemographics 처리 (additionalMetadata와 동일)
  Object.entries(paxDemographics).forEach(([key, data]) => {
    if (data && data.available_values && data.available_values.length > 0) {
      let categoryName = "";
      let icon = Users;

      if (key === "nationality") {
        categoryName = "Nationality";
        icon = MapPin;
      } else if (key === "profile") {
        categoryName = "Passenger Type";
        icon = Users;
      }

      if (categoryName) {
        // paxDemographics가 우선순위를 가지도록 덮어쓰기
        categories[categoryName] = {
          icon,
          options: data.available_values,
          colorIndex: getCategoryColorIndex(categoryName),
        };
      }
    }
  });

  return categories;
};

// Deep equality 체크를 위한 헬퍼 함수
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

// 시간 문자열을 포맷팅하는 헬퍼 함수
export const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// 다음 시간 슬롯 계산 (timeUnit 추가)
export const getNextTimeSlot = (timeStr: string, timeUnit: number): string => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  let newMinutes = minutes + timeUnit;
  let newHours = hours;

  if (newMinutes >= 60) {
    newHours = newHours + Math.floor(newMinutes / 60);
    newMinutes = newMinutes % 60;
  }

  // 24:00을 넘어가면 24:00으로 제한
  if (newHours >= 24) {
    return "24:00";
  }

  return formatTime(newHours, newMinutes);
};

// Period 파싱을 위한 안전한 헬퍼 함수
export const parsePeriodSafe = (
  period: string
): {
  startDateTime: Date | null;
  endDateTime: Date | null;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  valid: boolean;
} => {
  try {
    const periodMatch = period.match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})-(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/
    );
    if (!periodMatch) {
      return {
        startDateTime: null,
        endDateTime: null,
        startTime: "",
        endTime: "",
        startDate: "",
        endDate: "",
        valid: false,
      };
    }

    const [, startDate, startTimeWithSec, endDate, endTimeWithSec] =
      periodMatch;
    const startTime = startTimeWithSec.substring(0, 5);
    const endTime = endTimeWithSec.substring(0, 5);

    return {
      startDateTime: new Date(`${startDate} ${startTimeWithSec}`),
      endDateTime: new Date(`${endDate} ${endTimeWithSec}`),
      startTime,
      endTime,
      startDate,
      endDate,
      valid: true,
    };
  } catch (error) {
    console.error("Period parsing error:", error, "for period:", period);
    return {
      startDateTime: null,
      endDateTime: null,
      startTime: "",
      endTime: "",
      startDate: "",
      endDate: "",
      valid: false,
    };
  }
};

// disabled cells와 뱃지를 기반으로 period를 계산하는 함수 (타입 안전성 강화)
const MS_PER_MINUTE = 60 * 1000;

type PassengerCondition = TimeBlock["passenger_conditions"][number];

type SlotState = {
  isActive: boolean;
  conditions: PassengerCondition[];
  conditionKey: string;
  processTime: number;
};

type SegmentState = SlotState & {
  startIdx: number;
  endIdx: number;
};

const formatDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const parseMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const calculatePeriodsFromDisabledCells = (
  facilityIndex: number,
  disabledCells: Set<string>,
  timeSlots: string[],
  existingTimeBlocks: TimeBlock[],
  cellBadges: Record<string, CategoryBadge[]>,
  cellProcessTimes: Record<string, number>,
  processTimeSeconds?: number,
  timeUnit: number = 10,
  date?: string,
  isPreviousDay?: boolean
): TimeBlock[] => {
  if (!timeSlots || timeSlots.length === 0) {
    return [];
  }

  const processTime =
    processTimeSeconds || existingTimeBlocks?.[0]?.process_time_seconds || 60;

  const currentDate = date || new Date().toISOString().split("T")[0];
  const baseDate = new Date(`${currentDate} 00:00:00`);

  let dayOffset = isPreviousDay ? -1 : 0;
  let previousMinutes = parseMinutes(timeSlots[0]);

  const slotStarts: Date[] = timeSlots.map((time, idx) => {
    const minutes = parseMinutes(time);

    if (idx > 0 && minutes < previousMinutes) {
      dayOffset += 1;
    }

    const start = new Date(baseDate);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

    previousMinutes = minutes;
    return start;
  });

  const slotEnds: Date[] = slotStarts.map((start, idx) => {
    if (idx < slotStarts.length - 1) {
      return new Date(slotStarts[idx + 1]);
    }

    const rawEnd = new Date(start.getTime() + timeUnit * MS_PER_MINUTE);
    if (rawEnd.getHours() === 0 && rawEnd.getMinutes() === 0 && rawEnd.getSeconds() === 0) {
      return new Date(rawEnd.getTime() - 1000);
    }
    return rawEnd;
  });

  const slotStates: SlotState[] = timeSlots.map((_, idx) => {
    const cellId = `${idx}-${facilityIndex}`;
    const isActive = !disabledCells.has(cellId);
    const badges = cellBadges[cellId] || [];
    const cellProcessTime = cellProcessTimes[cellId] || processTime;

    if (badges.length === 0) {
      return {
        isActive,
        conditions: [],
        conditionKey: "__all__",
        processTime: cellProcessTime,
      };
    }

    const conditions: PassengerCondition[] = badges
      .map((badge) => {
        const isProcessCategory = !Object.values(LABELS).includes(badge.category as any);

        if (isProcessCategory) {
          // 프로세스 이름을 lambda 함수 형식으로 변환
          const convertProcessNameToZoneField = (processName: string): string => {
            const normalized = processName
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "");
            if (!normalized.endsWith("_zone")) {
              return normalized + "_zone";
            }
            return normalized;
          };

          // Zone 값을 lambda 함수 형식으로 변환 (대문자)
          const convertZoneValueForLambda = (zoneValue: string): string => {
            return zoneValue.toUpperCase();
          };

          return {
            field: convertProcessNameToZoneField(badge.category),
            values: badge.options.map(convertZoneValueForLambda),
          };
        }

        const field = getStorageFieldName(badge.category);
        if (!field) {
          return null;
        }

        return {
          field,
          values: badge.options,
        };
      })
      .filter((condition): condition is PassengerCondition => Boolean(condition?.field));

    const conditionKey = JSON.stringify(conditions);

    return {
      isActive,
      conditions,
      conditionKey,
      processTime: cellProcessTime,
    };
  });

  const allActive = slotStates.every((state) => state.isActive);
  const firstConditionKey = slotStates[0]?.conditionKey ?? "__all__";
  const firstProcessTime = slotStates[0]?.processTime ?? processTime;
  const allSameConditions = slotStates.every(
    (state) => state.conditionKey === firstConditionKey && state.processTime === firstProcessTime
  );

  if (allActive && allSameConditions) {
    const start = slotStarts[0];
    const end = slotEnds[slotEnds.length - 1];

    return [
      {
        period: `${formatDateTime(start)}-${formatDateTime(end)}`,
        process_time_seconds: firstProcessTime,
        passenger_conditions: slotStates[0]?.conditions || [],
        activate: true,
      },
    ];
  }

  const periods: TimeBlock[] = [];
  let currentSegment: SegmentState | null = null;

  for (let idx = 0; idx < slotStates.length; idx += 1) {
    const state = slotStates[idx];

    if (
      !currentSegment ||
      currentSegment.isActive !== state.isActive ||
      currentSegment.conditionKey !== state.conditionKey ||
      currentSegment.processTime !== state.processTime
    ) {
      if (currentSegment) {
        const start = slotStarts[currentSegment.startIdx];
        const end = slotEnds[currentSegment.endIdx];

        periods.push({
          period: `${formatDateTime(start)}-${formatDateTime(end)}`,
          process_time_seconds: currentSegment.processTime,
          passenger_conditions: currentSegment.conditions,
          activate: currentSegment.isActive,
        });
      }

      currentSegment = {
        startIdx: idx,
        endIdx: idx,
        isActive: state.isActive,
        conditions: state.conditions,
        conditionKey: state.conditionKey,
        processTime: state.processTime,
      };
    } else {
      currentSegment.endIdx = idx;
    }
  }

  if (currentSegment) {
    const start = slotStarts[currentSegment.startIdx];
    const end = slotEnds[currentSegment.endIdx];

    periods.push({
      period: `${formatDateTime(start)}-${formatDateTime(end)}`,
      process_time_seconds: currentSegment.processTime,
      passenger_conditions: currentSegment.conditions,
      activate: currentSegment.isActive,
    });
  }

  if (periods.length === 0) {
    const start = slotStarts[0];
    const end = slotEnds[slotEnds.length - 1];

    return [
      {
        period: `${formatDateTime(start)}-${formatDateTime(end)}`,
        process_time_seconds: processTime,
        passenger_conditions: [],
        activate: true,
      },
    ];
  }

  return periods;
};
