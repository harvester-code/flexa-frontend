import React from "react";
import { getBadgeColor } from "@/styles/colors";
import { useSimulationStore } from "../../../_stores";
import { ParquetMetadataItem, CategoryBadge, TimeBlock } from "./types";
import { getCategoryNameFromField, getCategoryIcon, getStorageFieldName, getCategoryColorIndex } from "./badgeMappings";
import { Users, MapPin } from "lucide-react";
import { LABELS } from "@/styles/columnMappings";

// 프로세스 이름을 lambda 함수 형식으로 변환하는 함수
// 예: "Check In" -> "check_in_zone", "A" -> "a_zone"
export const convertProcessNameToZoneField = (processName: string): string => {
  return processName
    .toLowerCase() // 소문자 변환
    .replace(/[^a-z0-9]/g, "_") // 영문, 숫자 외 모든 문자를 언더스코어로
    .replace(/_+/g, "_") // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, "") // 앞뒤 언더스코어 제거
    + "_zone"; // _zone 추가
};

// Zone 값을 lambda 함수 형식으로 변환하는 함수
// Lambda는 대문자로 Zone을 처리하므로 대문자로 변환
// 예: "a1" -> "A1", "dg1" -> "DG1"
export const convertZoneValueForLambda = (zoneValue: string): string => {
  return zoneValue.toUpperCase();
};

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
export const calculatePeriodsFromDisabledCells = (
  facilityIndex: number,
  disabledCells: Set<string>,
  timeSlots: string[],
  existingTimeBlocks: TimeBlock[],
  cellBadges: Record<string, CategoryBadge[]>,
  processTimeSeconds?: number, // 프로세스의 process_time_seconds 값
  timeUnit: number = 10, // time unit (기본값 10분)
  date?: string, // 날짜 (YYYY-MM-DD 형식)
  isPreviousDay?: boolean // 전날부터 시작하는지 여부
): TimeBlock[] => {
  // 프로세스의 process_time_seconds 우선, 기존 값 fallback, 마지막으로 60 기본값
  const processTime =
    processTimeSeconds || existingTimeBlocks?.[0]?.process_time_seconds || 60;

  // Use the centralized function for category to field conversion

  // 모든 셀이 활성화되어 있는지 확인
  const isAllActive = timeSlots.every(
    (_, i) => !disabledCells.has(`${i}-${facilityIndex}`)
  );

  // 모든 셀이 같은 조건(또는 조건 없음)을 가지고 있는지 확인
  let allSameConditions = true;
  let firstConditions: any = null;
  for (let i = 0; i < timeSlots.length; i++) {
    const cellId = `${i}-${facilityIndex}`;

    if (i === 0) {
      firstConditions = [];
    } else {
      allSameConditions = false;
      break;
    }
  }

  // 날짜 가져오기 (전달되지 않으면 store에서 가져옴)
  const currentDate =
    date ||
    useSimulationStore.getState().context.date ||
    new Date().toISOString().split("T")[0];
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split("T")[0];
  const prevDay = new Date(currentDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const prevDayStr = prevDay.toISOString().split("T")[0];

  // 모든 셀이 활성화되어 있고 조건이 동일한 경우
  if (isAllActive && allSameConditions) {
    // passenger chart 데이터가 있으면 그에 맞춰 설정
    const chartResult = useSimulationStore.getState().passenger.chartResult;
    if (
      chartResult?.chart_x_data &&
      chartResult.chart_x_data.length > 0 &&
      isPreviousDay
    ) {
      // 전날부터 시작하는 경우 (D-1)
      const firstTime = timeSlots[0]; // 예: "20:30"
      const lastTime = timeSlots[timeSlots.length - 1];

      // 전날 시작 시간 처리
      const startDate =
        timeSlots.indexOf("00:00") > 0 ? prevDayStr : currentDate;

      return [
        {
          period: `${startDate} ${firstTime}:00-${currentDate} 23:59:59`,
          process_time_seconds: processTime,
          passenger_conditions: [],
          activate: true,
        },
      ];
    }

    // 기본값 - Use 23:59:59 instead of next day 00:00:00
    return [
      {
        period: `${currentDate} 00:00:00-${currentDate} 23:59:59`,
        process_time_seconds: processTime,
        passenger_conditions: firstConditions || [],
        activate: true,
      },
    ];
  }

  const periods: any[] = [];
  let currentStart: string | null = null;
  let currentStartIndex: number = -1;  // 현재 구간의 시작 인덱스 추적
  let currentConditions: any[] | null = null;
  let currentIsActive: boolean | null = null;

  for (let i = 0; i < timeSlots.length; i++) {
    const cellId = `${i}-${facilityIndex}`;
    const isDisabled = disabledCells.has(cellId);
    const currentTime = timeSlots[i];
    const badges = cellBadges[cellId] || [];

    // 뱃지를 passenger_conditions 형식으로 변환
    // Use getStorageFieldName for storage format (e.g., Airline -> operating_carrier_iata)
    const conditions = badges
      .map((badge) => {
        // Check if this is a process category (not in predefined categories)
        const isProcessCategory = !Object.values(LABELS).includes(badge.category as any);

        if (isProcessCategory) {
          // Process names need special handling: convert to zone field format
          // e.g., "A" -> "a_zone", "Check In" -> "check_in_zone"
          // Zone values must be uppercase for Lambda (e.g., "a1" -> "A1")
          return {
            field: convertProcessNameToZoneField(badge.category),
            values: badge.options.map(convertZoneValueForLambda),
          };
        } else {
          // Regular categories use standard storage field mapping
          return {
            field: getStorageFieldName(badge.category),
            values: badge.options,
          };
        }
      })
      .filter((c) => c.field);

    // 현재 셀의 activate 상태
    const isActive = !isDisabled;

    // 새로운 구간을 시작해야 하는지 확인 (activate 상태 변경 또는 조건 변경)
    const needNewPeriod = currentStart === null ||
                         currentIsActive !== isActive ||
                         JSON.stringify(currentConditions) !== JSON.stringify(conditions);

    if (needNewPeriod && currentStart !== null) {
      // 이전 구간 저장
      const prevIndex = i - 1;
      const endTime = getNextTimeSlot(timeSlots[prevIndex], timeUnit);

      // 현재 구간의 시작 날짜 계산
      let startDate = currentDate;
      if (isPreviousDay) {
        const midnightIdx = timeSlots.indexOf("00:00");

        // 00:00이 있고, currentStartIndex가 00:00 이전에 있으면 전날
        if (midnightIdx > 0 && currentStartIndex < midnightIdx) {
          startDate = prevDayStr;
        }
      }

      let endDateTime;

      // 현재 블록이 마지막이 아니면, 다음 블록의 시작 시간을 종료 시간으로 사용
      if (i < timeSlots.length) {
        const nextBlockTime = timeSlots[i];

        // 다음 블록이 00:00이고 현재가 전날이면
        if (nextBlockTime === "00:00" && isPreviousDay && prevIndex < timeSlots.indexOf("00:00")) {
          endDateTime = `${currentDate} 00:00:00`;
        }
        // 일반적인 경우 - 다음 블록의 시작 시간 사용
        else {
          const nextBlockDate =
            isPreviousDay && i < timeSlots.indexOf("00:00")
              ? prevDayStr
              : currentDate;
          endDateTime = `${nextBlockDate} ${nextBlockTime}:00`;
        }
      }
      // 마지막 블록이거나 24:00인 경우
      else if (endTime === "24:00" || (endTime === "00:00" && prevIndex === timeSlots.length - 1)) {
        endDateTime = `${currentDate} 23:59:59`;
      }
      else {
        const endDate =
          isPreviousDay && prevIndex < timeSlots.indexOf("00:00")
            ? prevDayStr
            : currentDate;
        endDateTime = `${endDate} ${endTime}:00`;
      }

      periods.push({
        period: `${startDate} ${currentStart}:00-${endDateTime}`,
        process_time_seconds: processTime,
        passenger_conditions: currentConditions || [],
        activate: currentIsActive !== null ? currentIsActive : true,  // null인 경우 기본값 true
      });
    }

    if (needNewPeriod) {
      // 새 구간 시작
      currentStart = currentTime;
      currentStartIndex = i;  // 시작 인덱스 저장
      currentConditions = conditions;
      currentIsActive = isActive;
    }
  }

  // 마지막 구간 처리
  if (currentStart !== null) {
    const lastIndex = timeSlots.length - 1;
    const endTime = getNextTimeSlot(timeSlots[lastIndex], timeUnit);

    // 현재 구간의 시작 날짜 계산
    let startDate = currentDate;
    if (isPreviousDay) {
      const midnightIdx = timeSlots.indexOf("00:00");

      // 00:00이 있고, currentStartIndex가 00:00 이전에 있으면 전날
      if (midnightIdx > 0 && currentStartIndex < midnightIdx) {
        startDate = prevDayStr;
      }
    }

    // 마지막 구간의 종료 시간 처리
    let endDateTime;

    // 마지막 슬롯이고 endTime이 24:00 또는 00:00인 경우만 23:59:59 사용
    if (endTime === "24:00" || (endTime === "00:00" && lastIndex === timeSlots.length - 1)) {
      endDateTime = `${currentDate} 23:59:59`;
    } else {
      // 날짜 경계를 정확히 처리
      let endDate = currentDate;

      // 전날부터 시작하는 경우
      if (isPreviousDay) {
        const midnightIdx = timeSlots.indexOf("00:00");
        // 현재 구간이 전날에 있고, 종료 시간도 자정 전이면 전날로
        if (midnightIdx > 0 && currentStartIndex < midnightIdx && lastIndex < midnightIdx) {
          endDate = prevDayStr;
        }
        // 종료 시간이 00:00이면 현재 날짜의 00:00
        else if (endTime === "00:00") {
          endDate = currentDate;
        }
      }

      endDateTime = `${endDate} ${endTime}:00`;
    }

    periods.push({
      period: `${startDate} ${currentStart}:00-${endDateTime}`,
      process_time_seconds: processTime,
      passenger_conditions: currentConditions || [],
      activate: currentIsActive !== null ? currentIsActive : true,  // null인 경우 기본값 true
    });
  }

  // periods가 비어있는 경우 기본값 반환 (모든 셀이 활성화)
  if (periods.length === 0) {
    return [
      {
        period: `${currentDate} 00:00:00-${currentDate} 23:59:59`,
        process_time_seconds: processTime,
        passenger_conditions: [],
        activate: true,
      },
    ];
  }

  return periods;
};
