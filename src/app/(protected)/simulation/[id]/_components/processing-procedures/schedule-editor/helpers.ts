import React from "react";
import { Plane, Navigation, MapPin, Globe, Users } from "lucide-react";
import { getBadgeColor } from "@/styles/colors";
import { useSimulationStore } from "../../../_stores";
import { ParquetMetadataItem, CategoryBadge, TimeBlock } from "./types";

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

  let colorIndexCounter = 0; // 색상 인덱스 카운터

  // 🎯 1단계: parquetMetadata 처리
  parquetMetadata.forEach((item) => {
    let categoryName = "";
    let icon = Plane;

    switch (item.column) {
      case "operating_carrier_name":
      case "operating_carrier_iata":
        categoryName = "Airline";
        icon = Plane;
        break;
      case "aircraft_type":
        categoryName = "Aircraft Type";
        icon = Plane;
        break;
      case "flight_type":
        categoryName = "Flight Type";
        icon = Navigation;
        break;
      case "arrival_airport_iata":
        categoryName = "Arrival Airport";
        icon = MapPin;
        break;
      case "arrival_country":
        categoryName = "Arrival Country";
        icon = Globe;
        break;
      case "arrival_region":
        categoryName = "Arrival Region";
        icon = Globe;
        break;
      case "nationality":
        categoryName = "Nationality";
        icon = MapPin;
        break;
      case "profile":
        categoryName = "Passenger Type";
        icon = Users;
        break;
      default:
        // 기본 처리 (필요시 확장 가능)
        return;
    }

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
          colorIndex: colorIndexCounter++,
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
        // 기존 카테고리가 있으면 그 colorIndex를 유지, 없으면 새로 할당
        const existingColorIndex = categories[categoryName]?.colorIndex;
        categories[categoryName] = {
          icon,
          options: data.available_values,
          colorIndex:
            existingColorIndex !== undefined
              ? existingColorIndex
              : colorIndexCounter++,
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

  // category name을 field name으로 변환하는 헬퍼 함수 (내부 정의)
  const getCategoryFieldName = (category: string): string => {
    const categoryToFieldMap: Record<string, string> = {
      Airline: "operating_carrier_iata",
      "Aircraft Type": "aircraft_type",
      "Flight Type": "flight_type",
      "Arrival Airport": "arrival_airport_iata",
      "Arrival Country": "arrival_country",
      "Arrival Region": "arrival_region",
      Nationality: "nationality",
      "Passenger Type": "profile",
    };
    return categoryToFieldMap[category] || "";
  };

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
          period: `${startDate} ${firstTime}:00-${nextDayStr} 00:00:00`,
          process_time_seconds: processTime,
          passenger_conditions: [],
        },
      ];
    }

    // 기본값
    return [
      {
        period: `${currentDate} 00:00:00-${nextDayStr} 00:00:00`,
        process_time_seconds: processTime,
        passenger_conditions: firstConditions || [],
      },
    ];
  }

  const periods: any[] = [];
  let currentStart: string | null = null;
  let currentConditions: any[] | null = null;

  for (let i = 0; i < timeSlots.length; i++) {
    const cellId = `${i}-${facilityIndex}`;
    const isDisabled = disabledCells.has(cellId);
    const currentTime = timeSlots[i];
    const badges = cellBadges[cellId] || [];

    // 뱃지를 passenger_conditions 형식으로 변환
    const conditions = badges
      .map((badge) => ({
        field: getCategoryFieldName(badge.category),
        values: badge.options,
      }))
      .filter((c) => c.field);

    if (!isDisabled) {
      // 활성화된 셀
      if (currentStart === null) {
        // 새로운 활성 구간 시작
        currentStart = currentTime;
        currentConditions = conditions;
      } else {
        // 조건이 다르면 이전 구간을 종료하고 새 구간 시작 (최적화: 길이 먼저 비교)
        const conditionsChanged =
          currentConditions?.length !== conditions.length ||
          JSON.stringify(currentConditions) !== JSON.stringify(conditions);
        if (conditionsChanged) {
          // 이전 구간 저장
          const prevIndex = i - 1;
          const endTime = getNextTimeSlot(timeSlots[prevIndex], timeUnit);

          const startDate =
            isPreviousDay &&
            timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
              ? prevDayStr
              : currentDate;

          // 24:00은 다음날 00:00으로 처리
          let endDateTime;
          if (endTime === "24:00" || endTime === "00:00") {
            endDateTime = `${nextDayStr} 00:00:00`;
          } else {
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
          });

          // 새 구간 시작
          currentStart = currentTime;
          currentConditions = conditions;
        }
      }
      // 연속된 활성 셀이면 계속 진행
    } else {
      // 비활성화된 셀
      if (currentStart !== null) {
        // 이전 활성 구간을 저장
        const prevIndex = i - 1;
        const endTime = getNextTimeSlot(timeSlots[prevIndex], timeUnit);

        const startDate =
          isPreviousDay &&
          timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
            ? prevDayStr
            : currentDate;

        // 24:00은 다음날 00:00으로 처리
        let endDateTime;
        if (
          endTime === "24:00" ||
          (endTime === "00:00" && prevIndex === timeSlots.length - 1)
        ) {
          endDateTime = `${nextDayStr} 00:00:00`;
        } else {
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
        });
        currentStart = null;
        currentConditions = null;
      }
    }
  }

  // 마지막 활성 구간 처리
  if (currentStart !== null) {
    const lastIndex = timeSlots.length - 1;
    const endTime = getNextTimeSlot(timeSlots[lastIndex], timeUnit);

    const startDate =
      isPreviousDay &&
      timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
        ? prevDayStr
        : currentDate;

    // 마지막 시간이 23:30 등이면 다음날 00:00으로
    let endDateTime;
    if (
      endTime === "24:00" ||
      endTime === "00:00" ||
      lastIndex === timeSlots.length - 1
    ) {
      endDateTime = `${nextDayStr} 00:00:00`;
    } else {
      const endDate =
        isPreviousDay && lastIndex < timeSlots.indexOf("00:00")
          ? prevDayStr
          : currentDate;
      endDateTime = `${endDate} ${endTime}:00`;
    }

    periods.push({
      period: `${startDate} ${currentStart}:00-${endDateTime}`,
      process_time_seconds: processTime,
      passenger_conditions: currentConditions || [],
    });
  }

  // period가 하나도 없으면 (모두 비활성화) 빈 배열 반환 (운영 안함)
  // 기존에는 기본값을 반환했지만, 전체 비활성화는 운영 안함을 의미
  return periods;
};
