"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCellSelection } from "./hooks/useCellSelection";
import { useUndoHistory, HistoryAction } from "./hooks/useUndoHistory";
import { useThrottle } from "./hooks/useThrottle";
import { useDebounce } from "./hooks/useDebounce";
import { ScheduleContextMenu } from "./ScheduleContextMenu";
import { Clock, Expand, Globe, MapPin, Navigation, Plane, Users } from "lucide-react";
import { ProcessStep } from "@/types/simulationTypes";
import { Button } from "@/components/ui/Button";
import { useSimulationStore } from "../../_stores";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn, formatProcessName } from "@/lib/utils";
import { getBadgeColor } from "@/styles/colors";


// Parquet Metadata 타입 정의 (SearchCriteriaSelector와 동일)
interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

interface OperatingScheduleEditorProps {
  processFlow: ProcessStep[];
  parquetMetadata?: ParquetMetadataItem[]; // 🆕 동적 데이터 추가
  paxDemographics?: Record<string, any>; // 🆕 승객 정보 추가
}

// 뱃지 타입 정의
interface BadgeCondition {
  id: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

// 카테고리별 뱃지 타입 정의
interface CategoryBadge {
  category: string;
  options: string[];
  colorIndex: number;  // 색상 인덱스 추가
  style?: React.CSSProperties;  // 인라인 스타일 추가
}

// 🎨 동적 카테고리 생성 함수 (SearchCriteriaSelector와 동일 로직)
const createDynamicConditionCategories = (
  parquetMetadata: ParquetMetadataItem[],
  paxDemographics: Record<string, any>,
  flightAirlines?: Record<string, string> | null
) => {
  const categories: Record<
    string,
    {
      icon: React.ComponentType<any>;
      options: string[];
      colorIndex: number;  // 색상 인덱스 사용
    }
  > = {};

  let colorIndexCounter = 0;  // 색상 인덱스 카운터

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
      case "arrival_city":
        categoryName = "Arrival City";
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
          colorIndex: existingColorIndex !== undefined ? existingColorIndex : colorIndexCounter++,
        };
      }
    }
  });

  return categories;
};

// 상수들

// ROW_HEIGHT와 VIEWPORT_HEIGHT 상수들
const ROW_HEIGHT = 60; // 각 행의 높이 (픽셀)
const VIEWPORT_HEIGHT = 500; // 보이는 영역 높이 (기본값)
const BUFFER_SIZE = 3; // 앞뒤로 추가 렌더링할 행 수 (부드러운 스크롤)

// 시간 문자열을 포맷팅하는 헬퍼 함수
const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// 다음 시간 슬롯 계산 (timeUnit 추가)
const getNextTimeSlot = (timeStr: string, timeUnit: number): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let newMinutes = minutes + timeUnit;
  let newHours = hours;

  if (newMinutes >= 60) {
    newHours = newHours + Math.floor(newMinutes / 60);
    newMinutes = newMinutes % 60;
  }

  // 24:00을 넘어가면 24:00으로 제한
  if (newHours >= 24) {
    return '24:00';
  }

  return formatTime(newHours, newMinutes);
};


// disabled cells와 뱃지를 기반으로 period를 계산하는 함수
const calculatePeriodsFromDisabledCells = (
  facilityIndex: number,
  disabledCells: Set<string>,
  timeSlots: string[],
  existingTimeBlocks: any[],
  cellBadges: Record<string, CategoryBadge[]>,
  processTimeSeconds?: number, // 프로세스의 process_time_seconds 값
  timeUnit: number = 10, // time unit (기본값 10분)
  date?: string, // 날짜 (YYYY-MM-DD 형식)
  isPreviousDay?: boolean // 전날부터 시작하는지 여부
): any[] => {
  // 프로세스의 process_time_seconds 우선, 기존 값 fallback, 마지막으로 60 기본값
  const processTime = processTimeSeconds || existingTimeBlocks?.[0]?.process_time_seconds || 60;

  // category name을 field name으로 변환하는 헬퍼 함수 (내부 정의)
  const getCategoryFieldName = (category: string): string => {
    const categoryToFieldMap: Record<string, string> = {
      'Airline': 'operating_carrier_iata',
      'Aircraft Type': 'aircraft_type',
      'Flight Type': 'flight_type',
      'Arrival Airport': 'arrival_airport_iata',
      'Arrival City': 'arrival_city',
      'Arrival Country': 'arrival_country',
      'Arrival Region': 'arrival_region',
      'Nationality': 'nationality',
      'Passenger Type': 'profile'
    };
    return categoryToFieldMap[category] || '';
  };

  // 모든 셀이 활성화되어 있는지 확인
  const isAllActive = timeSlots.every((_, i) => !disabledCells.has(`${i}-${facilityIndex}`));

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
  const currentDate = date || useSimulationStore.getState().context.date || new Date().toISOString().split('T')[0];
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split('T')[0];
  const prevDay = new Date(currentDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const prevDayStr = prevDay.toISOString().split('T')[0];

  // 모든 셀이 활성화되어 있고 조건이 동일한 경우
  if (isAllActive && allSameConditions) {
    // passenger chart 데이터가 있으면 그에 맞춰 설정
    const chartResult = useSimulationStore.getState().passenger.chartResult;
    if (chartResult?.chart_x_data && chartResult.chart_x_data.length > 0 && isPreviousDay) {
      // 전날부터 시작하는 경우 (D-1)
      const firstTime = timeSlots[0]; // 예: "20:30"
      const lastTime = timeSlots[timeSlots.length - 1];

      // 전날 시작 시간 처리
      const startDate = timeSlots.indexOf("00:00") > 0 ? prevDayStr : currentDate;

      return [{
        period: `${startDate} ${firstTime}:00-${nextDayStr} 00:00:00`,
        process_time_seconds: processTime,
        passenger_conditions: []
      }];
    }

    // 기본값
    return [{
      period: `${currentDate} 00:00:00-${nextDayStr} 00:00:00`,
      process_time_seconds: processTime,
      passenger_conditions: firstConditions || []
    }];
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
    const conditions = badges.map(badge => ({
      field: getCategoryFieldName(badge.category),
      values: badge.options
    })).filter(c => c.field);

    if (!isDisabled) {
      // 활성화된 셀
      if (currentStart === null) {
        // 새로운 활성 구간 시작
        currentStart = currentTime;
        currentConditions = conditions;
      } else {
        // 조건이 다르면 이전 구간을 종료하고 새 구간 시작 (최적화: 길이 먼저 비교)
        const conditionsChanged = currentConditions?.length !== conditions.length ||
          JSON.stringify(currentConditions) !== JSON.stringify(conditions);
        if (conditionsChanged) {
          // 이전 구간 저장
          const prevIndex = i - 1;
          const endTime = getNextTimeSlot(timeSlots[prevIndex], timeUnit);

          const startDate = isPreviousDay && timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
            ? prevDayStr
            : currentDate;

          // 24:00은 다음날 00:00으로 처리
          let endDateTime;
          if (endTime === "24:00" || endTime === "00:00") {
            endDateTime = `${nextDayStr} 00:00:00`;
          } else {
            const endDate = isPreviousDay && prevIndex < timeSlots.indexOf("00:00")
              ? prevDayStr
              : currentDate;
            endDateTime = `${endDate} ${endTime}:00`;
          }

          periods.push({
            period: `${startDate} ${currentStart}:00-${endDateTime}`,
            process_time_seconds: processTime,
            passenger_conditions: currentConditions || []
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

        const startDate = isPreviousDay && timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
          ? prevDayStr
          : currentDate;

        // 24:00은 다음날 00:00으로 처리
        let endDateTime;
        if (endTime === "24:00" || (endTime === "00:00" && prevIndex === timeSlots.length - 1)) {
          endDateTime = `${nextDayStr} 00:00:00`;
        } else {
          const endDate = isPreviousDay && prevIndex < timeSlots.indexOf("00:00")
            ? prevDayStr
            : currentDate;
          endDateTime = `${endDate} ${endTime}:00`;
        }

        periods.push({
          period: `${startDate} ${currentStart}:00-${endDateTime}`,
          process_time_seconds: processTime,
          passenger_conditions: currentConditions || []
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

    const startDate = isPreviousDay && timeSlots.indexOf(currentStart) < timeSlots.indexOf("00:00")
      ? prevDayStr
      : currentDate;

    // 마지막 시간이 23:30 등이면 다음날 00:00으로
    let endDateTime;
    if (endTime === "24:00" || endTime === "00:00" || lastIndex === timeSlots.length - 1) {
      endDateTime = `${nextDayStr} 00:00:00`;
    } else {
      const endDate = isPreviousDay && lastIndex < timeSlots.indexOf("00:00")
        ? prevDayStr
        : currentDate;
      endDateTime = `${endDate} ${endTime}:00`;
    }

    periods.push({
      period: `${startDate} ${currentStart}:00-${endDateTime}`,
      process_time_seconds: processTime,
      passenger_conditions: currentConditions || []
    });
  }
  
  // period가 하나도 없으면 (모두 비활성화) 빈 배열 반환 (운영 안함)
  // 기존에는 기본값을 반환했지만, 전체 비활성화는 운영 안함을 의미
  return periods;
};

// 핸들러 그룹화
interface TableHandlers {
  timeHeader: {
    onClick: (e: React.MouseEvent) => void;
    onRightClick: (e: React.MouseEvent) => void;
  };
  column: {
    onMouseDown: (colIndex: number, e: React.MouseEvent) => void;
    onMouseEnter: (colIndex: number, e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, colIndex: number) => void;
  };
  row: {
    onMouseDown: (rowIndex: number, e: React.MouseEvent) => void;
    onMouseEnter: (rowIndex: number, e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, rowIndex: number) => void;
  };
  cell: {
    onMouseDown: (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => void;
    onMouseEnter: (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, cellId: string) => void;
  };
  onRemoveCategoryBadge: (cellId: string, category: string) => void;
}

// 가상화 설정
interface VirtualScrollConfig {
  visibleTimeSlots: string[];
  startIndex: number;
  totalHeight: number;
  offsetY: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

// 엑셀 테이블 컴포넌트 분리
interface ExcelTableProps {
  selectedZone: string;
  currentFacilities: any[];
  timeSlots: string[];
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>;
  copiedCells?: Set<string>; // Cells that are currently copied
  isFullScreen?: boolean;
  virtualScroll: VirtualScrollConfig;
  handlers: TableHandlers;
  isPreviousDay?: boolean;
}

const ExcelTable: React.FC<ExcelTableProps> = React.memo(
  ({
    selectedZone,
    currentFacilities,
    timeSlots,
    selectedCells,
    cellBadges,
    disabledCells,
    copiedCells = new Set(),
    isFullScreen = false,
    virtualScroll,
    handlers,
    isPreviousDay = false,
  }) => {
    const {
      visibleTimeSlots = timeSlots,
      startIndex = 0,
      totalHeight = 0,
      offsetY = 0,
      onScroll,
    } = virtualScroll;

    // 선택된 행과 열 계산
    const selectedRowsAndCols = useMemo(() => {
      const selectedRows = new Set<number>();
      const selectedCols = new Set<number>();
      
      selectedCells.forEach(cellId => {
        const [rowStr, colStr] = cellId.split('-');
        const rowIndex = parseInt(rowStr, 10);
        const colIndex = parseInt(colStr, 10);
        
        // 전체 행이 선택되었는지 확인
        let isFullRowSelected = true;
        for (let col = 0; col < currentFacilities.length; col++) {
          if (!selectedCells.has(`${rowIndex}-${col}`)) {
            isFullRowSelected = false;
            break;
          }
        }
        if (isFullRowSelected) selectedRows.add(rowIndex);
        
        // 전체 열이 선택되었는지 확인
        let isFullColSelected = true;
        for (let row = 0; row < timeSlots.length; row++) {
          if (!selectedCells.has(`${row}-${colIndex}`)) {
            isFullColSelected = false;
            break;
          }
        }
        if (isFullColSelected) selectedCols.add(colIndex);
      });
      
      return { selectedRows, selectedCols };
    }, [selectedCells, currentFacilities.length, timeSlots.length]);
    // 🖼️ cellId 파싱 캐시 (성능 최적화)
    const parseCellId = useMemo(() => {
      const cache = new Map<string, [number, number]>();
      return (cellId: string): [number, number] => {
        if (!cache.has(cellId)) {
          const [rowStr, colStr] = cellId.split("-");
          cache.set(cellId, [parseInt(rowStr, 10), parseInt(colStr, 10)]);
        }
        return cache.get(cellId)!;
      };
    }, []);

    // 🖼️ 선택된 셀의 boxShadow 스타일 계산 (기본 border와 충돌하지 않음)
    const getSelectionStyles = useMemo(() => {
      const styleMap = new Map<string, { boxShadow?: string }>();

      // 선택된 영역의 경계를 찾아서 boxShadow로 표시
      selectedCells.forEach((cellId) => {
        const [rowIndex, colIndex] = parseCellId(cellId);

        // 경계 확인
        const topCellId = `${rowIndex - 1}-${colIndex}`;
        const bottomCellId = `${rowIndex + 1}-${colIndex}`;
        const leftCellId = `${rowIndex}-${colIndex - 1}`;
        const rightCellId = `${rowIndex}-${colIndex + 1}`;

        const isTopBorder = !selectedCells.has(topCellId);
        const isBottomBorder = !selectedCells.has(bottomCellId);
        const isLeftBorder = !selectedCells.has(leftCellId);
        const isRightBorder = !selectedCells.has(rightCellId);

        // 각 방향별로 boxShadow 추가 - 복사한 셀이 있을 때는 선택 표시 숨김
        const shadows: string[] = [];
        // Only show selection if no cells are being shown as copied
        if (isTopBorder) shadows.push("inset 0 2px 0 0 #8b5cf6");
        if (isBottomBorder) shadows.push("inset 0 -2px 0 0 #8b5cf6");
        if (isLeftBorder) shadows.push("inset 2px 0 0 0 #8b5cf6");
        if (isRightBorder) shadows.push("inset -2px 0 0 0 #8b5cf6");

        if (shadows.length > 0) {
          styleMap.set(cellId, {
            boxShadow: shadows.join(", "),
          });
        }
      });

      return (rowIndex: number, colIndex: number) => {
        const cellId = `${rowIndex}-${colIndex}`;
        return styleMap.get(cellId) || {};
      };
    }, [selectedCells, parseCellId]);

    // Check if cell should show copy border overlay
    const getCopyBorderInfo = useCallback((rowIndex: number, colIndex: number) => {
      if (copiedCells.size === 0) return null;

      const cellId = `${rowIndex}-${colIndex}`;
      if (!copiedCells.has(cellId)) return null;

      // Find bounds of copied region
      let minRow = Infinity, maxRow = -Infinity;
      let minCol = Infinity, maxCol = -Infinity;

      Array.from(copiedCells).forEach((id) => {
        const [r, c] = (id as string).split('-').map(Number);
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      });

      // Check if cell is on the edge
      return {
        hasTop: rowIndex === minRow,
        hasBottom: rowIndex === maxRow,
        hasLeft: colIndex === minCol,
        hasRight: colIndex === maxCol
      };
    }, [copiedCells]);

    if (!selectedZone || currentFacilities.length === 0) {
      if (selectedZone) {
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No facilities configured for this zone
          </div>
        );
      } else {
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Select a process and zone to configure operating schedule
          </div>
        );
      }
    }

    return (
      <div
        className={`rounded-lg border overflow-auto`}
        onScroll={onScroll}
        style={
          isFullScreen
            ? { height: "100%", minHeight: "100%" }
            : { height: 500, maxHeight: "70vh" }
        }
      >
        {/* 🚀 가상화 스크롤 컨테이너 */}
        <div className="relative" style={{ height: "auto" }}>
          <table className="w-full table-auto text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-muted z-50">
              <tr className="bg-muted">
                <th
                  className="w-20 cursor-pointer select-none border border-gray-200 p-2 text-center transition-colors hover:bg-primary/10 overflow-hidden bg-purple-50 whitespace-nowrap text-ellipsis sticky top-0 font-semibold"
                  onClick={handlers.timeHeader.onClick}
                  onContextMenu={(e) => {
                    // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                    } else {
                      handlers.timeHeader.onRightClick(e);
                    }
                  }}
                  title="Click to select all cells. Right-click to apply badges to all cells."
                >
                  Time
                </th>
                {currentFacilities.map((facility, colIndex) => (
                  <th
                    key={facility.id}
                    className={`cursor-pointer select-none border border-gray-200 p-2 text-center transition-colors hover:bg-primary/10 sticky top-0 ${
                      selectedRowsAndCols.selectedCols.has(colIndex) 
                        ? 'bg-primary/20' 
                        : 'bg-muted'
                    }`}
                    onMouseDown={(e) => {
                      // 우클릭이 아닐 때만 드래그 처리
                      if (e.button !== 2) {
                        handlers.column.onMouseDown(colIndex, e)
                      }
                    }}
                    onMouseEnter={(e) => {
                      // 우클릭 드래그가 아닐 때만 처리
                      if (e.buttons !== 2) {
                        handlers.column.onMouseEnter(colIndex, e)
                      }
                    }}
                    onMouseUp={(e) => {
                      // 우클릭이 아닐 때만 처리
                      if (e.button !== 2) {
                        handlers.column.onMouseUp()
                      }
                    }}
                    onContextMenu={(e) => {
                      // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                      } else {
                        handlers.column.onRightClick(e, colIndex);
                      }
                    }}
                    title={`Click or drag to select columns: ${facility.id}. Right-click to apply badges to entire column.`}
                  >
                    {facility.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTimeSlots.map((timeSlot, visibleRowIndex) => {
                const rowIndex = startIndex + visibleRowIndex;
                return (
                  <tr key={rowIndex} className="h-15">
                    <td
                      className={`w-20 cursor-pointer select-none border border-gray-200 p-1 text-center text-xs font-medium bg-purple-50 text-gray-700 transition-colors hover:bg-purple-100 overflow-hidden whitespace-nowrap text-ellipsis ${
                        selectedRowsAndCols.selectedRows.has(rowIndex)
                          ? 'bg-primary/20'
                          : ''
                      }`}
                      onMouseDown={(e) => {
                        // 우클릭이 아닐 때만 드래그 처리
                        if (e.button !== 2) {
                          handlers.row.onMouseDown(rowIndex, e)
                        }
                      }}
                      onMouseEnter={(e) => {
                        // 우클릭 드래그가 아닐 때만 처리
                        if (e.buttons !== 2) {
                          handlers.row.onMouseEnter(rowIndex, e)
                        }
                      }}
                      onMouseUp={(e) => {
                        // 우클릭이 아닐 때만 처리
                        if (e.button !== 2) {
                          handlers.row.onMouseUp()
                        }
                      }}
                      onContextMenu={(e) => {
                        // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                        } else {
                          handlers.row.onRightClick(e, rowIndex);
                        }
                      }}
                      title={`Click or drag to select rows: ${timeSlot}. Right-click to apply badges to entire row.`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isPreviousDay && rowIndex < timeSlots.findIndex(t => t === "00:00") && (
                          <span className="px-1 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-800 rounded">
                            D-1
                          </span>
                        )}
                        <span>{timeSlot}</span>
                      </div>
                    </td>
                    {currentFacilities.map((facility, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const isSelected = selectedCells.has(cellId);
                      const isDisabled = disabledCells.has(cellId);
                      const isCopied = copiedCells.has(cellId);
                      const badges = cellBadges[cellId] || [];
                      const selectionStyles = getSelectionStyles(
                        rowIndex,
                        colIndex
                      );
                      const copyBorderInfo = getCopyBorderInfo(rowIndex, colIndex);

                      return (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "cursor-pointer select-none p-1 border border-gray-200 relative",
                            isDisabled && "bg-gray-100"
                          )}
                          style={selectionStyles}
                          onMouseDown={(e) => {
                            // 우클릭이 아닐 때만 드래그 처리
                            if (e.button !== 2) {
                              handlers.cell.onMouseDown(
                                cellId,
                                rowIndex,
                                colIndex,
                                e
                              );
                            }
                          }}
                          onMouseEnter={(e) =>
                            handlers.cell.onMouseEnter(
                              cellId,
                              rowIndex,
                              colIndex,
                              e
                            )
                          }
                          onMouseUp={handlers.cell.onMouseUp}
                          onContextMenu={(e) => {
                            // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault();
                            } else {
                              handlers.cell.onRightClick(e, cellId);
                            }
                          }}
                        >
                          <div className="flex h-8 flex-col items-center justify-center space-y-1">
                            <div className="flex items-center space-x-1">
                              {/* 카테고리 뱃지들 - 뱃지가 없으면 자동으로 All 표시 */}
                              {badges.length > 0 ? (
                                badges.map((categoryBadge, badgeIndex) => {
                                  const badgeStyle = categoryBadge.style || getBadgeColor(categoryBadge.colorIndex).style;
                                  return (
                                    <span
                                      key={`${categoryBadge.category}-${badgeIndex}`}
                                      className={cn(
                                        "select-none rounded border px-1 text-[9px] font-medium leading-tight",
                                        isDisabled && "line-through decoration-2"
                                      )}
                                      style={isDisabled ? {
                                        backgroundColor: '#d1d5db',
                                        color: '#4b5563',
                                        borderColor: '#9ca3af'
                                      } : badgeStyle}
                                      title={`${categoryBadge.category}: ${categoryBadge.options.join("|")}`}
                                    >
                                      {categoryBadge.options
                                        .map((option) => option.slice(0, 3))
                                        .join("|")}
                                    </span>
                                  );
                                })
                              ) : (
                                <span
                                  className={cn(
                                    isDisabled
                                      ? "bg-gray-300 text-gray-600 border-gray-400"
                                      : "bg-primary/10 text-primary border-primary/20",
                                    "select-none rounded border px-1 text-[9px] font-medium leading-tight",
                                    isDisabled && "line-through decoration-2"
                                  )}
                                  title="All"
                                >
                                  All
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Copy border overlay */}
                          {copyBorderInfo && (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                top: '2px',
                                left: '2px',
                                right: '2px',
                                bottom: '2px',
                                borderTop: copyBorderInfo.hasTop ? '2px dashed #8b5cf6' : 'none',
                                borderBottom: copyBorderInfo.hasBottom ? '2px dashed #8b5cf6' : 'none',
                                borderLeft: copyBorderInfo.hasLeft ? '2px dashed #8b5cf6' : 'none',
                                borderRight: copyBorderInfo.hasRight ? '2px dashed #8b5cf6' : 'none',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

// React.memo displayName 설정
ExcelTable.displayName = "ExcelTable";

export default function OperatingScheduleEditor({
  processFlow,
  parquetMetadata = [],
  paxDemographics = {},
}: OperatingScheduleEditorProps) {
  // ✈️ 항공사 매핑 데이터 가져오기
  const flightAirlines = useSimulationStore((s) => s.flight.airlines);

  // 🚀 동적 카테고리 생성 (SearchCriteriaSelector와 동일한 데이터 기반)
  const CONDITION_CATEGORIES = useMemo(() => {
    return createDynamicConditionCategories(
      parquetMetadata,
      paxDemographics,
      flightAirlines
    );
  }, [parquetMetadata, paxDemographics, flightAirlines]);

  // 기본 탭 상태
  const [selectedProcessIndex, setSelectedProcessIndex] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>("");

  // 전체화면 상태
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Time Unit 상태 (기본값 30분)
  const [timeUnitInput, setTimeUnitInput] = useState<string>('30');
  const [appliedTimeUnit, setAppliedTimeUnit] = useState<number>(30);
  const [pendingTimeUnit, setPendingTimeUnit] = useState<number | null>(null);
  const [showTimeUnitConfirm, setShowTimeUnitConfirm] = useState(false);

  // 뱃지 상태 관리 - Zone별로 저장하여 탭 전환 시에도 유지
  const [allZoneBadges, setAllZoneBadges] = useState<Record<string, Record<string, CategoryBadge[]>>>({});

  // 비활성화된 셀 상태 관리 - Zone별로 저장하여 탭 전환 시에도 유지
  const [allZoneDisabledCells, setAllZoneDisabledCells] = useState<Record<string, Set<string>>>({});

  // 현재 Zone의 키
  const zoneKey = `${selectedProcessIndex}-${selectedZone}`;

  // 현재 Zone의 뱃지 가져오기
  const cellBadges = allZoneBadges[zoneKey] || {};

  // 현재 Zone의 비활성화된 셀 가져오기
  const disabledCells = allZoneDisabledCells[zoneKey] || new Set<string>();

  // 현재 Zone의 뱃지 업데이트 함수
  const setCellBadges = useCallback((updater: any) => {
    setAllZoneBadges(prev => ({
      ...prev,
      [zoneKey]: typeof updater === 'function' ? updater(prev[zoneKey] || {}) : updater
    }));
  }, [zoneKey]);

  // 현재 Zone의 비활성화된 셀 업데이트 함수
  const setDisabledCells = useCallback((updater: any) => {
    setAllZoneDisabledCells(prev => ({
      ...prev,
      [zoneKey]: typeof updater === 'function' ? updater(prev[zoneKey] || new Set<string>()) : updater
    }));
  }, [zoneKey]);

  // 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    cellId: string;
    targetCells: string[];
    x: number;
    y: number;
  }>({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });

  // Copy/Paste state management
  const [copiedData, setCopiedData] = useState<{
    cells: Array<{ row: number; col: number; badges: CategoryBadge[]; disabled: boolean }>;
    shape: { rows: number; cols: number };
    startCell: { row: number; col: number };
  } | null>(null);

  // State to control marching ants visibility
  const [showMarchingAnts, setShowMarchingAnts] = useState(false);

  // Computed set of copied cells for visualization
  const copiedCells = useMemo(() => {
    if (!copiedData || !showMarchingAnts) return new Set<string>();
    return new Set(copiedData.cells.map(cell => `${cell.row}-${cell.col}`));
  }, [copiedData, showMarchingAnts]);

  // Warning dialog for size mismatch
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [pendingPasteData, setPendingPasteData] = useState<{
    targetCells: Set<string>;
    copiedData: any;
  } | null>(null);



  // 초기 로드 상태 추적 - processIndex와 zone별로 추적
  const [initializedKeys, setInitializedKeys] = useState<Set<string>>(new Set());

  // period 문자열을 disabled cells로 변환하는 함수 (최적화)
  const initializeDisabledCellsFromPeriods = useCallback((
    facilities: any[],
    timeSlots: string[],
    isPreviousDay: boolean,
    categories: any,
    currentDate: string,
    prevDayStr: string
  ) => {
    console.log('initializeDisabledCellsFromPeriods called with:', {
      facilitiesCount: facilities.length,
      timeSlotsCount: timeSlots.length,
      isPreviousDay,
      currentDate,
      prevDayStr,
      firstFacility: facilities[0]
    });

    const newDisabledCells = new Set<string>();
    const newBadges: Record<string, CategoryBadge[]> = {};
    const date = currentDate;

    facilities.forEach((facility, colIndex) => {
      if (facility?.operating_schedule?.time_blocks) {
        const timeBlocks = facility.operating_schedule.time_blocks;

        // time_blocks가 없으면 모든 셀 활성화 (기본값)
        if (timeBlocks.length === 0) {
          // 아무것도 하지 않음 - 모든 셀이 활성화된 상태
          return;
        }

        // 활성화된 시간대를 추적
        const activatedSlots = new Set<number>();

        // 각 time_block에 대해 활성화된 슬롯 마킹
        timeBlocks.forEach((block: any, blockIndex: number) => {
          if (block.period) {
            console.log('Processing time_block', blockIndex, 'for facility:', facility.id,
                       'period:', block.period,
                       'has conditions:', block.passenger_conditions?.length > 0);
            // period 파싱: "2025-09-20 20:30:00-2025-09-21 01:30:00"
            // 정규식으로 더 정확하게 파싱
            const periodMatch = block.period.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})-(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/);

            if (!periodMatch) {
              console.warn('Invalid period format:', block.period);
              return;
            }

            const [, startDate, startTimeWithSec, endDate, endTimeWithSec] = periodMatch;

            // 시간 부분 추출 (안전하게)
            const startTime = startTimeWithSec ? startTimeWithSec.substring(0, 5) : "00:00"; // "HH:MM"
            const endTime = endTimeWithSec ? endTimeWithSec.substring(0, 5) : "00:00";

            console.log('Parsed period:', {
              startDate,
              startTime,
              endDate,
              endTime,
              currentDate: date,
              isPreviousDay
            });

            // 여러 날에 걸친 period 처리
            const nextDayStr = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];

            // Period가 현재 표시 날짜 범위에 포함되는지 확인
            const periodStartDate = new Date(startDate);
            const periodEndDate = new Date(endDate);
            const currentDateObj = new Date(date);
            const prevDateObj = new Date(prevDayStr);

            console.log('Date range check:', {
              periodStart: periodStartDate,
              periodEnd: periodEndDate,
              currentDate: currentDateObj,
              prevDate: prevDateObj,
              isPreviousDay
            });

            // Period가 전체 시간대를 포함하는지 확인 (2일 이상 걸쳐진 period)
            const isFullPeriod = periodStartDate <= prevDateObj && periodEndDate >= currentDateObj;

            if (isFullPeriod) {
              // 전체 시간대 활성화
              console.log('Full period detected - activating all cells for facility:', facility.id);
              for (let i = 0; i < timeSlots.length; i++) {
                activatedSlots.add(i);
              }
            } else {
              // 부분적인 period 처리
              if (isPreviousDay) {
                // D-1 표시가 있을 때
                if (startDate <= prevDayStr && endDate >= prevDayStr) {
                  // 전날 포함
                  const startIdx = startDate === prevDayStr ? timeSlots.indexOf(startTime) : 0;
                  const endIdx = endDate === prevDayStr ? timeSlots.indexOf(endTime) : timeSlots.indexOf("00:00");

                  if (startIdx !== -1) {
                    for (let i = startIdx; i < timeSlots.length && (endIdx === -1 || i < endIdx); i++) {
                      if (timeSlots[i] === "00:00") break;
                      activatedSlots.add(i);
                    }
                  }
                }

                // 당일 처리
                if (startDate <= date && endDate >= date) {
                  const zeroIdx = timeSlots.indexOf("00:00");
                  if (zeroIdx !== -1) {
                    const startIdx = startDate === date ? timeSlots.indexOf(startTime) : zeroIdx;
                    const endIdx = endDate === date ? timeSlots.indexOf(endTime) : timeSlots.length;

                    for (let i = startIdx; i < endIdx; i++) {
                      activatedSlots.add(i);
                    }
                  }
                }
              } else {
                // D-1 표시가 없을 때
                if (startDate <= date && endDate >= date) {
                  const startIdx = startDate === date ? timeSlots.indexOf(startTime) : 0;
                  const endIdx = endDate === date ? timeSlots.indexOf(endTime) : timeSlots.length;

                  if (startIdx !== -1) {
                    for (let i = startIdx; i < endIdx; i++) {
                      activatedSlots.add(i);
                    }
                  }
                }
              }
            }

            // passenger_conditions가 있으면 해당 period의 모든 활성 셀에 뱃지 설정
            if (block.passenger_conditions && block.passenger_conditions.length > 0) {
              const badges: CategoryBadge[] = [];
              block.passenger_conditions.forEach((condition: any) => {
                const categoryName = getCategoryNameFromField(condition.field);
                if (categoryName && categories[categoryName]) {
                  const categoryConfig = categories[categoryName];
                  const badgeColor = getBadgeColor(categoryConfig.colorIndex);
                  badges.push({
                    category: categoryName,
                    options: condition.values || [],
                    colorIndex: categoryConfig.colorIndex,
                    style: badgeColor.style
                  });
                }
              });

              if (badges.length > 0) {
                console.log('Applying badges for period:', block.period, 'from', startTime, 'to', endTime);

                // 해당 period에 속하는 모든 셀에 뱃지 적용
                const startIdx = timeSlots.indexOf(startTime);
                let endIdx = timeSlots.indexOf(endTime);

                // endTime이 정확히 일치하지 않으면 직전 인덱스 사용
                if (endIdx === -1 || endIdx <= startIdx) {
                  // endTime에서 30분을 뺀 시간 찾기 (21:30 -> 21:00)
                  const [endHour, endMin] = endTime.split(':').map(Number);
                  const prevEndTime = `${String(endMin === 0 ? endHour - 1 : endHour).padStart(2, '0')}:${endMin === 0 ? '30' : '00'}`;
                  endIdx = timeSlots.indexOf(prevEndTime) + 1;
                }

                console.log('Badge application range:', startIdx, 'to', endIdx, 'for facility column:', colIndex);

                if (startIdx !== -1 && endIdx > startIdx) {
                  for (let i = startIdx; i < endIdx; i++) {
                    const cellId = `${i}-${colIndex}`;
                    if (!newDisabledCells.has(cellId)) {
                      // 해당 period 내의 모든 활성 셀에 뱃지 추가
                      newBadges[cellId] = badges;
                      console.log('Added badge to cell:', cellId);
                    }
                  }
                }
              }
            }
          }
        });

        // time_blocks 처리가 끝난 후, 활성화되지 않은 슬롯만 비활성화
        for (let rowIndex = 0; rowIndex < timeSlots.length; rowIndex++) {
          if (!activatedSlots.has(rowIndex)) {
            const cellId = `${rowIndex}-${colIndex}`;
            newDisabledCells.add(cellId);
          }
        }
      }
    });

    return { disabledCells: newDisabledCells, badges: newBadges };
  }, []);

  // field name을 category name으로 변환하는 헬퍼 함수
  const getCategoryNameFromField = (field: string): string => {
    const fieldToCategoryMap: Record<string, string> = {
      'operating_carrier_name': 'Airline',
      'operating_carrier_iata': 'Airline',
      'aircraft_type': 'Aircraft Type',
      'flight_type': 'Flight Type',
      'arrival_airport_iata': 'Arrival Airport',
      'arrival_city': 'Arrival City',
      'arrival_country': 'Arrival Country',
      'arrival_region': 'Arrival Region',
      'nationality': 'Nationality',
      'profile': 'Passenger Type'
    };
    return fieldToCategoryMap[field] || '';
  };

  // category name을 field name으로 변환하는 헬퍼 함수
  const getCategoryFieldName = (category: string): string => {
    const categoryToFieldMap: Record<string, string> = {
      'Airline': 'operating_carrier_iata',
      'Aircraft Type': 'aircraft_type',
      'Flight Type': 'flight_type',
      'Arrival Airport': 'arrival_airport_iata',
      'Arrival City': 'arrival_city',
      'Arrival Country': 'arrival_country',
      'Arrival Region': 'arrival_region',
      'Nationality': 'nationality',
      'Passenger Type': 'profile'
    };
    return categoryToFieldMap[category] || '';
  };


  // 🔄 실행 취소/재실행 히스토리 관리
  const undoHistory = useUndoHistory({
    maxHistorySize: 100,
    onUndo: (action: HistoryAction) => {
      // Undo 액션 처리는 handleUndo에서 수행
    },
    onRedo: (action: HistoryAction) => {
      // Redo 액션 처리는 handleRedo에서 수행
    },
  });

  // passenger chartResult 가져오기
  const chartResult = useSimulationStore((s) => s.passenger.chartResult);
  const contextDate = useSimulationStore((s) => s.context.date);

  // 시간 슬롯 생성 (chartResult가 있으면 그 범위로, 없으면 기본값)
  const { timeSlots, isPreviousDay } = useMemo(() => {
    const slots: string[] = [];
    const unitMinutes = Math.max(1, Math.min(60, appliedTimeUnit)); // 1분 ~ 60분 사이로 제한
    let isPrev = false;

    // chartResult가 있고 chart_x_data가 있으면 그 범위로 생성
    if (chartResult?.chart_x_data && chartResult.chart_x_data.length > 0) {
      // 최초 여객이 있는 시간 찾기
      const chartData = chartResult.chart_y_data;
      let totalPassengersByTime: number[] = new Array(chartResult.chart_x_data.length).fill(0);

      if (chartData) {
        Object.values(chartData).forEach((airlines: any[]) => {
          airlines.forEach((airline) => {
            if (airline.y && Array.isArray(airline.y)) {
              airline.y.forEach((count: number, idx: number) => {
                totalPassengersByTime[idx] += count;
              });
            }
          });
        });
      }

      // 최초/최종 여객 시간 찾기
      const firstPassengerIndex = totalPassengersByTime.findIndex(count => count > 0);
      const lastPassengerIndex = totalPassengersByTime.findLastIndex(count => count > 0);

      if (firstPassengerIndex !== -1 && lastPassengerIndex !== -1) {
        // 시작 시간 30분 단위 내림
        const startDateTime = chartResult.chart_x_data[firstPassengerIndex];
        const [startDate, startTime] = startDateTime.split(' ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const roundedStartMinute = Math.floor(startMinute / 30) * 30;
        const roundedStartHour = startHour;

        // 종료 시간 처리
        const endDateTime = chartResult.chart_x_data[Math.min(lastPassengerIndex + 1, chartResult.chart_x_data.length - 1)];
        const [endDate, endTime] = endDateTime.split(' ');
        const [endHour] = endTime.split(':').map(Number);

        // 시작이 전날인지 확인
        const currentDate = contextDate || new Date().toISOString().split('T')[0];
        isPrev = startDate < currentDate;

        // 전날 시간부터 시작하는 경우
        if (isPrev) {
          // 전날 시간 추가
          for (let hour = roundedStartHour; hour < 24; hour++) {
            const minuteStart = hour === roundedStartHour ? roundedStartMinute : 0;
            for (let minute = minuteStart; minute < 60; minute += unitMinutes) {
              const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
              slots.push(timeStr);
            }
          }
        }

        // 당일 시간 추가
        const maxHour = Math.min(24, endHour + 1);
        const startHourForToday = isPrev ? 0 : roundedStartHour;
        const startMinuteForToday = isPrev ? 0 : roundedStartMinute;

        for (let hour = startHourForToday; hour < maxHour; hour++) {
          const minuteStart = hour === startHourForToday && !isPrev ? startMinuteForToday : 0;
          for (let minute = minuteStart; minute < 60; minute += unitMinutes) {
            const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            slots.push(timeStr);
          }
        }

        return { timeSlots: slots, isPreviousDay: isPrev };
      }
    }

    // 기본값: 00:00부터 24:00까지
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += unitMinutes) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return { timeSlots: slots, isPreviousDay: false };
  }, [appliedTimeUnit, chartResult, contextDate]);

  // 🛡️ 안전성 강화: 현재 선택된 존의 시설들
  const currentFacilities = useMemo(() => {
    // 배열 범위 검사 추가
    if (
      !processFlow ||
      processFlow.length === 0 ||
      selectedProcessIndex < 0 ||
      selectedProcessIndex >= processFlow.length
    ) {
      return [];
    }

    const currentProcess = processFlow[selectedProcessIndex];
    if (!currentProcess || !selectedZone || !currentProcess.zones) {
      return [];
    }

    const zone = currentProcess.zones[selectedZone];
    return zone?.facilities || [];
  }, [processFlow, selectedProcessIndex, selectedZone]);

  // 셀 선택 커스텀 훅 사용
  const cellSelection = useCellSelection({
    timeSlotCount: timeSlots.length,
    facilityCount: currentFacilities.length,
  });

  const {
    selectedCells,
    displaySelectedCells,
    dragState,
    shiftSelectStart,
    lastSelectedRow,
    lastSelectedCol,
    setSelectedCells,
    setTempSelectedCells,
    setDragState,
    setShiftSelectStart,
    setLastSelectedRow,
    setLastSelectedCol,
    generateCellRange,
    generateRowCells,
    generateColumnCells,
    generateAllCells,
    generateRowRange,
    generateColumnRange,
    toggleCellIds,
    createDragState,
    finalizeDrag,
    clearSelection,
  } = cellSelection;

  // 빈 스크롤 핸들러 (가상화 비활성화로 더 이상 필요 없음)
  const handleScroll = useCallback(() => {
    // 가상화가 비활성화되었으므로 아무것도 하지 않음
  }, []);

  // 🗂️ 카테고리 그룹 정의
  const getCategoryGroups = useCallback(() => {
    const groups: Array<{
      title: string;
      categories: string[];
      categoryConfigs?: Record<string, any>;
    }> = [];

    // 🔄 Process 그룹 (후속 프로세스에서만 표시)
    if (selectedProcessIndex > 0 && processFlow && processFlow.length > 0) {
      const processCategories: Record<string, any> = {};

      // 현재 프로세스보다 앞선 모든 프로세스들
      for (let i = 0; i < selectedProcessIndex; i++) {
        const process = processFlow[i];
        if (process && process.zones) {
          const processName = formatProcessName(process.name);
          const zoneNames = Object.keys(process.zones);

          if (zoneNames.length > 0) {
            processCategories[processName] = {
              icon: Navigation,
              options: zoneNames,
              bgColor: "bg-amber-50",
              textColor: "text-amber-700",
              borderColor: "border-amber-200",
            };
          }
        }
      }

      if (Object.keys(processCategories).length > 0) {
        groups.push({
          title: "Process",
          categories: Object.keys(processCategories),
          categoryConfigs: processCategories,
        });
      }
    }

    const flightCategories = ["Airline", "Aircraft Type", "Flight Type"];
    const arrivalCategories = [
      "Arrival Airport",
      "Arrival City",
      "Arrival Country",
      "Arrival Region",
    ];
    const passengerCategories = ["Nationality", "Passenger Type"];

    const standardGroups = [
      {
        title: "Flight",
        categories: flightCategories.filter((cat) => CONDITION_CATEGORIES[cat]),
      },
      {
        title: "Arrival",
        categories: arrivalCategories.filter(
          (cat) => CONDITION_CATEGORIES[cat]
        ),
      },
      {
        title: "Passenger",
        categories: passengerCategories.filter(
          (cat) => CONDITION_CATEGORIES[cat]
        ),
      },
    ];

    // 표준 그룹 추가
    groups.push(...standardGroups);

    // 빈 그룹 제거
    return groups.filter((group) => group.categories.length > 0);
  }, [CONDITION_CATEGORIES, selectedProcessIndex, processFlow]);

  // 🎯 키보드 포커스 관리용 ref (이제 직접 상태 사용으로 성능 문제 해결)
  const containerRef = useRef<HTMLDivElement>(null);

  // 🚀 가상화 계산 (Virtual Scrolling) - 모든 모드에서 가상화 비활성화
  const virtualScrollConfig = useMemo(() => {
    const totalRows = timeSlots.length;
    
    // 모든 모드에서 가상화 비활성화하고 모든 시간 슬롯 표시 (헤더 고정을 위해)
    return {
      startIndex: 0,
      endIndex: totalRows,
      visibleTimeSlots: timeSlots,
      totalHeight: totalRows * ROW_HEIGHT,
      offsetY: 0,
      onScroll: handleScroll,
    };
  }, [timeSlots, handleScroll]);

  // 🔍 Process 카테고리 config 가져오기 헬퍼
  const getProcessCategoryConfig = useCallback(
    (category: string) => {
      if (selectedProcessIndex > 0 && processFlow && processFlow.length > 0) {
        let processColorIndex = Object.keys(CONDITION_CATEGORIES).length; // Process는 다른 카테고리 뒤에 위치
        for (let i = 0; i < selectedProcessIndex; i++) {
          const process = processFlow[i];
          if (process && process.zones) {
            const processName = formatProcessName(process.name);
            if (processName === category) {
              return {
                icon: Navigation,
                options: Object.keys(process.zones),
                colorIndex: processColorIndex + i,  // Process에 따라 다른 색상 인덱스
              };
            }
          }
        }
      }
      return null;
    },
    [selectedProcessIndex, processFlow, CONDITION_CATEGORIES]
  );

  // 실행 취소 처리
  const handleUndo = useCallback(() => {
    const action = undoHistory.undo();
    if (!action) return;

    if (action.type === 'toggleDisabled') {
      // disabledCells 상태 복원
      setDisabledCells(prev => {
        const newSet = new Set(prev);
        action.cellIds.forEach(cellId => {
          const previousState = action.previousStates.get(cellId);
          if (previousState) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    } else if (action.type === 'setBadges') {
      // cellBadges 상태 복원
      setCellBadges(prev => {
        const updated = { ...prev };
        action.cellIds.forEach(cellId => {
          const previousBadges = action.previousBadges.get(cellId);
          if (previousBadges) {
            updated[cellId] = previousBadges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
    } else if (action.type === 'paste') {
      // Restore previous state for paste operation
      setCellBadges(prev => {
        const updated = { ...prev };
        action.targetCells.forEach(cellId => {
          const prevState = action.previousStates?.get(cellId);
          if (prevState?.badges && prevState.badges.length > 0) {
            updated[cellId] = prevState.badges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
      setDisabledCells(prev => {
        const newSet = new Set(prev);
        action.targetCells.forEach(cellId => {
          const prevState = action.previousStates?.get(cellId);
          if (prevState?.disabled) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    }
  }, [undoHistory, setDisabledCells, setCellBadges]);

  // 재실행 처리
  const handleRedo = useCallback(() => {
    const action = undoHistory.redo();
    if (!action) return;

    if (action.type === 'toggleDisabled') {
      // disabledCells 상태 재적용
      setDisabledCells(prev => {
        const newSet = new Set(prev);
        action.cellIds.forEach(cellId => {
          const newState = action.newStates.get(cellId);
          if (newState) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    } else if (action.type === 'setBadges') {
      // cellBadges 상태 재적용
      setCellBadges(prev => {
        const updated = { ...prev };
        action.cellIds.forEach(cellId => {
          const newBadges = action.newBadges.get(cellId);
          if (newBadges && newBadges.length > 0) {
            updated[cellId] = newBadges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
    } else if (action.type === 'paste') {
      // Reapply paste operation
      setCellBadges(prev => {
        const updated = { ...prev };
        action.targetCells.forEach(cellId => {
          const newState = action.newStates?.get(cellId);
          if (newState?.badges && newState.badges.length > 0) {
            updated[cellId] = newState.badges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
      setDisabledCells(prev => {
        const newSet = new Set(prev);
        action.targetCells.forEach(cellId => {
          const newState = action.newStates?.get(cellId);
          if (newState?.disabled) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    }
  }, [undoHistory, setDisabledCells, setCellBadges]);

  // 카테고리별 뱃지 토글 핸들러
  const handleToggleBadgeOption = useCallback(
    (category: string, option: string) => {
      const targetCells = contextMenu.targetCells || [];
      if (targetCells.length === 0) return;

      // Process 카테고리인지 확인
      const processCategoryConfig = getProcessCategoryConfig(category);
      const categoryConfig =
        processCategoryConfig ||
        CONDITION_CATEGORIES[category as keyof typeof CONDITION_CATEGORIES];

      if (!categoryConfig) return;

      // 현재 해당 옵션이 모든 타겟 셀에 있는지 확인
      const hasOptionInAllCells = targetCells.every((cellId) => {
        const badges = cellBadges[cellId] || [];
        const categoryBadge = badges.find(
          (badge) => badge.category === category
        );
        return categoryBadge?.options.includes(option) || false;
      });

      // 히스토리를 위한 이전 상태 저장
      const previousBadges = new Map<string, any[]>();
      targetCells.forEach(cellId => {
        previousBadges.set(cellId, cellBadges[cellId] ? [...cellBadges[cellId]] : []);
      });

      setCellBadges((prev) => {
        const updated = { ...prev };
        const newBadges = new Map<string, any[]>();

        targetCells.forEach((cellId) => {
          let existingBadges = updated[cellId] || [];

          // 🔄 "All" 뱃지가 있다면 개별 옵션 선택 시 제거
          const allBadgeIndex = existingBadges.findIndex(
            (badge) => badge.category === "All"
          );
          if (allBadgeIndex >= 0) {
            existingBadges = existingBadges.filter(
              (badge) => badge.category !== "All"
            );
          }

          const existingCategoryIndex = existingBadges.findIndex(
            (badge) => badge.category === category
          );

          if (existingCategoryIndex >= 0) {
            // 카테고리가 이미 있는 경우
            const existingCategory = existingBadges[existingCategoryIndex];
            const optionIndex = existingCategory.options.indexOf(option);

            if (hasOptionInAllCells) {
              // 옵션 제거
              if (optionIndex >= 0) {
                const newOptions = [...existingCategory.options];
                newOptions.splice(optionIndex, 1);

                if (newOptions.length === 0) {
                  // 옵션이 없으면 카테고리 전체 제거
                  existingBadges.splice(existingCategoryIndex, 1);
                } else {
                  // 옵션만 업데이트
                  existingBadges[existingCategoryIndex] = {
                    ...existingCategory,
                    options: newOptions,
                  };
                }
              }
            } else {
              // 옵션 추가
              if (optionIndex < 0) {
                existingBadges[existingCategoryIndex] = {
                  ...existingCategory,
                  options: [...existingCategory.options, option],
                };
              }
            }
          } else if (!hasOptionInAllCells) {
            // 새 카테고리 추가
            const badgeColor = getBadgeColor(categoryConfig.colorIndex);
            const newCategoryBadge: CategoryBadge = {
              category,
              options: [option],
              colorIndex: categoryConfig.colorIndex,
              style: badgeColor.style,
            };
            existingBadges.push(newCategoryBadge);
          }

          updated[cellId] = [...existingBadges];
          newBadges.set(cellId, [...existingBadges]);
        });

        // 히스토리에 추가
        setTimeout(() => {
          undoHistory.pushHistory({
            type: 'setBadges',
            cellIds: targetCells,
            previousBadges,
            newBadges,
          });
        }, 0);

        return updated;
      });
    },
    [
      contextMenu.targetCells,
      cellBadges,
      getProcessCategoryConfig,
      CONDITION_CATEGORIES,
      setCellBadges,
      undoHistory,
    ]
  );

  // 카테고리별 뱃지 제거 핸들러 (전체 카테고리 제거)
  const handleRemoveCategoryBadge = useCallback(
    (cellId: string, category: string) => {
      setCellBadges((prev) => ({
        ...prev,
        [cellId]: (prev[cellId] || []).filter(
          (badge) => badge.category !== category
        ),
      }));
    },
    []
  );

  // 모든 뱃지 제거 핸들러 (선택된 모든 셀에서) - 빈 배열로 설정
  const handleClearAllBadges = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    // 히스토리를 위한 이전 상태 저장
    const previousBadges = new Map<string, any[]>();
    targetCells.forEach(cellId => {
      previousBadges.set(cellId, cellBadges[cellId] ? [...cellBadges[cellId]] : []);
    });

    setCellBadges((prev) => {
      const updated = { ...prev };
      const newBadges = new Map<string, any[]>();
      
      targetCells.forEach((cellId) => {
        delete updated[cellId]; // 완전히 제거하여 메모리 최적화
        newBadges.set(cellId, []);
      });

      // 히스토리에 추가
      setTimeout(() => {
        undoHistory.pushHistory({
          type: 'setBadges',
          cellIds: targetCells,
          previousBadges,
          newBadges,
        });
      }, 0);

      return updated;
    });
  }, [contextMenu.targetCells, cellBadges, undoHistory]);

  // 모든 카테고리 선택 핸들러 - 뱃지를 비워서 All로 표시
  const handleSelectAllCategories = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    // 히스토리를 위한 이전 상태 저장
    const previousBadges = new Map<string, any[]>();
    targetCells.forEach(cellId => {
      previousBadges.set(cellId, cellBadges[cellId] ? [...cellBadges[cellId]] : []);
    });

    setCellBadges((prev) => {
      const updated = { ...prev };
      const newBadges = new Map<string, any[]>();

      targetCells.forEach((cellId) => {
        // 뱃지를 비워서 자동으로 All 표시되도록
        delete updated[cellId];
        newBadges.set(cellId, []);
      });

      // 히스토리에 추가
      setTimeout(() => {
        undoHistory.pushHistory({
          type: 'setBadges',
          cellIds: targetCells,
          previousBadges,
          newBadges,
        });
      }, 0);

      return updated;
    });
  }, [contextMenu.targetCells, cellBadges, undoHistory]);

  // 우클릭 핸들러
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, cellId: string) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 우클릭한 셀을 먼저 선택한 후 적용
        setSelectedCells(new Set([cellId]));
        targetCells = [cellId];
      }

      setContextMenu({
        show: true,
        cellId,
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectedCells, setSelectedCells]
  );

  // 행 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 해당 행에 적용)
  const handleRowRightClick = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 해당 행을 먼저 선택한 후 적용
        const rowCellIds = generateRowCells(rowIndex);
        setSelectedCells(rowCellIds);
        targetCells = Array.from(rowCellIds);
      }

      setContextMenu({
        show: true,
        cellId: `${rowIndex}-0`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateRowCells, selectedCells, setSelectedCells]
  );

  // 열 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 해당 열에 적용)
  const handleColumnRightClick = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 해당 열을 먼저 선택한 후 적용
        const columnCellIds = generateColumnCells(colIndex);
        setSelectedCells(columnCellIds);
        targetCells = Array.from(columnCellIds);
      }

      setContextMenu({
        show: true,
        cellId: `0-${colIndex}`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateColumnCells, selectedCells, setSelectedCells]
  );

  // Time 헤더 클릭 핸들러 (전체 선택)
  const handleTimeHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // 전체 셀 선택
      const allCellIds = generateAllCells();
      setSelectedCells((prev) =>
        toggleCellIds(allCellIds, prev, e.ctrlKey || e.metaKey)
      );

      // Shift 선택 시작점을 첫 번째 셀로 설정
      setShiftSelectStart({ row: 0, col: 0 });
    },
    [generateAllCells]
  );

  // Time 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 전체 셀에 적용)
  const handleTimeHeaderRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 전체 셀에 적용
        const allCellIds = generateAllCells();
        targetCells = Array.from(allCellIds);
      }

      setContextMenu({
        show: true,
        cellId: "0-0", // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateAllCells, selectedCells]
  );

  // 범위 선택 함수
  const selectCellRange = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const rangeCells = generateCellRange(startRow, endRow, startCol, endCol);
      setSelectedCells(rangeCells);
    },
    [generateCellRange, setSelectedCells]
  );

  // 셀 클릭 핸들러 (Shift, Ctrl 클릭 지원)
  const handleCellClick = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Ctrl + 클릭: 다중 선택
        if (e.shiftKey && shiftSelectStart) {
          // Ctrl + Shift + 클릭: 기존 선택 유지하면서 범위 추가
          const rangeCells = generateCellRange(
            shiftSelectStart.row,
            rowIndex,
            shiftSelectStart.col,
            colIndex
          );
          setSelectedCells((prev) => {
            const newSet = new Set(prev);
            rangeCells.forEach((id) => newSet.add(id));
            return newSet;
          });
        } else {
          // Ctrl + 클릭: 개별 셀 토글
          setSelectedCells((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(cellId)) {
              newSet.delete(cellId);
            } else {
              newSet.add(cellId);
            }
            return newSet;
          });
          setShiftSelectStart({ row: rowIndex, col: colIndex });
        }
      } else if (e.shiftKey && shiftSelectStart) {
        // Shift + 클릭: 범위 선택 (기존 선택 대체)
        selectCellRange(
          shiftSelectStart.row,
          shiftSelectStart.col,
          rowIndex,
          colIndex
        );
      } else {
        // 일반 클릭: 새로 선택 (기존 선택 해제)
        setShiftSelectStart({ row: rowIndex, col: colIndex });
        setSelectedCells(new Set([cellId]));
      }
    },
    [
      shiftSelectStart,
      selectCellRange,
      generateCellRange,
      setSelectedCells,
      setShiftSelectStart,
    ]
  );

  // 드래그 이벤트 핸들러들
  const handleCellMouseDown = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleCellClick(cellId, rowIndex, colIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;

      // 🚀 드래그 시작: 임시 선택 상태 초기화 (성능 최적화)
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, cellId])
        : new Set([cellId]);

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "cell",
          { row: rowIndex, col: colIndex },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setShiftSelectStart({ row: rowIndex, col: colIndex });
    },
    [handleCellClick, selectedCells]
  );

  // 드래그 성능 최적화를 위한 throttled 버전
  const handleCellMouseEnterRaw = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      if (dragState.isActive && dragState.type === "cell" && dragState.start) {
        const rangeCells = generateCellRange(
          dragState.start.row,
          rowIndex,
          dragState.start.col,
          colIndex
        );

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCells,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCells);
        }
      }
    },
    [dragState, generateCellRange, setTempSelectedCells]
  );

  // Throttle the mouse enter handler for better performance
  const handleCellMouseEnter = useThrottle(handleCellMouseEnterRaw, 16); // ~60fps

  const handleCellMouseUp = useCallback(() => {
    // 드래그 종료 시 즉시 최종 상태 확정
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  // 열 전체 선택/해제 핸들러 (클릭용)
  const handleColumnClick = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedCol !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 열부터 현재 열까지)
        const rangeCellIds = generateColumnRange(lastSelectedCol, colIndex);
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 열의 모든 셀 ID 생성
        const columnCellIds = generateColumnCells(colIndex);

        setSelectedCells((prev) =>
          toggleCellIds(columnCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 열 기록
      setLastSelectedCol(colIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: 0, col: colIndex });
    },
    [
      generateColumnRange,
      generateColumnCells,
      toggleCellIds,
      setSelectedCells,
      setLastSelectedCol,
      setShiftSelectStart,
      lastSelectedCol,
    ]
  );

  // 열 드래그 핸들러들
  const handleColumnMouseDown = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleColumnClick(colIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;
      const columnCellIds = generateColumnCells(colIndex);

      // 🚀 드래그 시작: 임시 선택 상태 사용
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, ...columnCellIds])
        : columnCellIds;

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "column",
          { row: 0, col: colIndex },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setLastSelectedCol(colIndex);
    },
    [
      generateColumnCells,
      selectedCells,
      setTempSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedCol,
      handleColumnClick,
    ]
  );

  // 열 드래그 성능 최적화를 위한 throttled 버전
  const handleColumnMouseEnterRaw = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      if (
        dragState.isActive &&
        dragState.type === "column" &&
        dragState.start
      ) {
        e.preventDefault();

        // 드래그 범위의 모든 열 선택
        const rangeCellIds = generateColumnRange(dragState.start.col, colIndex);

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateColumnRange, setTempSelectedCells]
  );

  const handleColumnMouseEnter = useThrottle(handleColumnMouseEnterRaw, 16);

  const handleColumnMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  // 행 전체 선택/해제 핸들러 (클릭용)
  const handleRowClick = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedRow !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 행부터 현재 행까지)
        const rangeCellIds = generateRowRange(lastSelectedRow, rowIndex);
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 행의 모든 셀 ID 생성
        const rowCellIds = generateRowCells(rowIndex);

        setSelectedCells((prev) =>
          toggleCellIds(rowCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 행 기록
      setLastSelectedRow(rowIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: rowIndex, col: 0 });
    },
    [
      generateRowRange,
      generateRowCells,
      toggleCellIds,
      setSelectedCells,
      setLastSelectedRow,
      setShiftSelectStart,
      lastSelectedRow,
    ]
  );

  // 행 드래그 핸들러들
  const handleRowMouseDown = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleRowClick(rowIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;
      const rowCellIds = generateRowCells(rowIndex);

      // 🚀 드래그 시작: 임시 선택 상태 사용
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, ...rowCellIds])
        : rowCellIds;

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "row",
          { row: rowIndex, col: 0 },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setLastSelectedRow(rowIndex);
    },
    [
      generateRowCells,
      selectedCells,
      setTempSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedRow,
      handleRowClick,
    ]
  );

  // 행 드래그 성능 최적화를 위한 throttled 버전
  const handleRowMouseEnterRaw = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      if (dragState.isActive && dragState.type === "row" && dragState.start) {
        e.preventDefault();

        // 드래그 범위의 모든 행 선택
        const rangeCellIds = generateRowRange(dragState.start.row, rowIndex);

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateRowRange, setTempSelectedCells]
  );

  const handleRowMouseEnter = useThrottle(handleRowMouseEnterRaw, 16);

  const handleRowMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  // 핸들러 객체 생성 (메모이제이션으로 성능 최적화)
  const tableHandlers = useMemo(
    () => ({
      timeHeader: {
        onClick: handleTimeHeaderClick,
        onRightClick: handleTimeHeaderRightClick,
      },
      column: {
        onMouseDown: handleColumnMouseDown,
        onMouseEnter: handleColumnMouseEnter,
        onMouseUp: handleColumnMouseUp,
        onRightClick: handleColumnRightClick,
      },
      row: {
        onMouseDown: handleRowMouseDown,
        onMouseEnter: handleRowMouseEnter,
        onMouseUp: handleRowMouseUp,
        onRightClick: handleRowRightClick,
      },
      cell: {
        onMouseDown: handleCellMouseDown,
        onMouseEnter: handleCellMouseEnter,
        onMouseUp: handleCellMouseUp,
        onRightClick: handleCellRightClick,
      },
      onRemoveCategoryBadge: handleRemoveCategoryBadge,
    }),
    [
      handleTimeHeaderClick,
      handleTimeHeaderRightClick,
      handleColumnMouseDown,
      handleColumnMouseEnter,
      handleColumnMouseUp,
      handleColumnRightClick,
      handleRowMouseDown,
      handleRowMouseEnter,
      handleRowMouseUp,
      handleRowRightClick,
      handleCellMouseDown,
      handleCellMouseEnter,
      handleCellMouseUp,
      handleCellRightClick,
      handleRemoveCategoryBadge,
    ]
  );

  // Handle copy operation
  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return;

    const cellsArray = Array.from(selectedCells).map(cellId => {
      const [row, col] = cellId.split('-').map(Number);
      return {
        row,
        col,
        badges: cellBadges[cellId] || [],
        disabled: disabledCells.has(cellId)
      };
    });

    // Calculate shape of copied area
    const rows = cellsArray.map(c => c.row);
    const cols = cellsArray.map(c => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    setCopiedData({
      cells: cellsArray,
      shape: {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1
      },
      startCell: { row: minRow, col: minCol }
    });

    // Show marching ants
    setShowMarchingAnts(true);
  }, [selectedCells, cellBadges, disabledCells]);

  // Handle paste operation
  const handlePaste = useCallback(() => {
    if (!copiedData || selectedCells.size === 0) return;

    const targetCellsArray = Array.from(selectedCells).map(cellId => {
      const [row, col] = cellId.split('-').map(Number);
      return { row, col, cellId };
    });

    // Calculate target shape
    const targetRows = targetCellsArray.map(c => c.row);
    const targetCols = targetCellsArray.map(c => c.col);
    const targetMinRow = Math.min(...targetRows);
    const targetMaxRow = Math.max(...targetRows);
    const targetMinCol = Math.min(...targetCols);
    const targetMaxCol = Math.max(...targetCols);
    const targetShape = {
      rows: targetMaxRow - targetMinRow + 1,
      cols: targetMaxCol - targetMinCol + 1
    };

    // Pattern C: Multiple cells → Single cell
    // When single cell is selected, paste the entire copied shape starting from that cell
    if (selectedCells.size === 1 && (copiedData.shape.rows > 1 || copiedData.shape.cols > 1)) {
      // Expand selection to match copied shape, trim at table boundaries
      const expandedCells = new Set<string>();
      for (let r = 0; r < copiedData.shape.rows; r++) {
        for (let c = 0; c < copiedData.shape.cols; c++) {
          const newRow = targetMinRow + r;
          const newCol = targetMinCol + c;
          // Check bounds - trim at table edges (Excel behavior)
          if (newRow < timeSlots.length && newCol < currentFacilities.length) {
            expandedCells.add(`${newRow}-${newCol}`);
          }
        }
      }
      executePaste(expandedCells, copiedData);
      return;
    }

    // Pattern B: Single cell → Multiple cells
    // When copying single cell to multiple cells, fill all selected cells
    if (copiedData.shape.rows === 1 && copiedData.shape.cols === 1) {
      executePaste(selectedCells, copiedData);
      return;
    }

    // Pattern D: Row/Column repeat
    // Check if it's a single row or column being repeated
    const isSingleRow = copiedData.shape.rows === 1 && copiedData.shape.cols > 1;
    const isSingleCol = copiedData.shape.cols === 1 && copiedData.shape.rows > 1;

    if (isSingleRow && targetShape.cols === copiedData.shape.cols) {
      // Single row copied, repeat for all selected rows
      executePaste(selectedCells, copiedData);
      return;
    }

    if (isSingleCol && targetShape.rows === copiedData.shape.rows) {
      // Single column copied, repeat for all selected columns
      executePaste(selectedCells, copiedData);
      return;
    }

    // Pattern A: 1:1 matching or exact multiples
    const isExactMatch = (copiedData.shape.rows === targetShape.rows && copiedData.shape.cols === targetShape.cols);
    const isExactMultiple = (targetShape.rows % copiedData.shape.rows === 0 && targetShape.cols % copiedData.shape.cols === 0);

    if (isExactMatch || isExactMultiple) {
      // Direct paste or pattern repeat
      executePaste(selectedCells, copiedData);
      return;
    }

    // Size mismatch - show warning
    setPendingPasteData({ targetCells: selectedCells, copiedData });
    setShowPasteWarning(true);
  }, [copiedData, selectedCells, timeSlots, currentFacilities]);


  // Execute the paste operation
  const executePaste = useCallback((targetCells: Set<string>, copiedData: any) => {
    const previousStates = new Map<string, { badges: CategoryBadge[]; disabled: boolean }>();
    const targetCellsArray = Array.from(targetCells).map(cellId => {
      const [row, col] = cellId.split('-').map(Number);
      previousStates.set(cellId, {
        badges: cellBadges[cellId] || [],
        disabled: disabledCells.has(cellId)
      });
      return { row, col, cellId };
    });

    // Calculate offsets
    const targetMinRow = Math.min(...targetCellsArray.map(c => c.row));
    const targetMinCol = Math.min(...targetCellsArray.map(c => c.col));

    // Apply paste
    const newBadges = { ...cellBadges };
    const newDisabledCells = new Set(disabledCells);

    targetCellsArray.forEach(target => {
      let sourceCellData: { row: number; col: number; badges: CategoryBadge[]; disabled: boolean } | undefined = undefined;

      // Pattern B: Single cell copy - use the same cell for all targets
      if (copiedData.shape.rows === 1 && copiedData.shape.cols === 1) {
        sourceCellData = copiedData.cells[0];
      }
      // Pattern D: Single row repeat
      else if (copiedData.shape.rows === 1) {
        const relativeCol = (target.col - targetMinCol) % copiedData.shape.cols;
        sourceCellData = copiedData.cells.find(
          c => c.row === copiedData.startCell.row &&
               c.col - copiedData.startCell.col === relativeCol
        );
      }
      // Pattern D: Single column repeat
      else if (copiedData.shape.cols === 1) {
        const relativeRow = (target.row - targetMinRow) % copiedData.shape.rows;
        sourceCellData = copiedData.cells.find(
          c => c.col === copiedData.startCell.col &&
               c.row - copiedData.startCell.row === relativeRow
        );
      }
      // Pattern A & C: Normal grid paste with wrapping
      else {
        const relativeRow = (target.row - targetMinRow) % copiedData.shape.rows;
        const relativeCol = (target.col - targetMinCol) % copiedData.shape.cols;

        sourceCellData = copiedData.cells.find(
          c => c.row - copiedData.startCell.row === relativeRow &&
               c.col - copiedData.startCell.col === relativeCol
        );
      }

      if (sourceCellData) {
        // Apply badges
        if (sourceCellData.badges.length > 0) {
          newBadges[target.cellId] = [...sourceCellData.badges];
        } else {
          delete newBadges[target.cellId];
        }

        // Apply disabled state
        if (sourceCellData.disabled) {
          newDisabledCells.add(target.cellId);
        } else {
          newDisabledCells.delete(target.cellId);
        }
      }
    });

    // Update states
    setCellBadges(newBadges);
    setDisabledCells(() => newDisabledCells);

    // Don't clear selection - keep the target cells selected
    // Only hide marching ants (handled in handleKeyDown)

    // Add to history
    undoHistory.pushHistory({
      type: 'paste',
      targetCells: Array.from(targetCells),
      previousStates,
      newStates: new Map(
        Array.from(targetCells).map(cellId => [
          cellId,
          {
            badges: newBadges[cellId] || [],
            disabled: newDisabledCells.has(cellId)
          }
        ])
      )
    });
  }, [cellBadges, disabledCells, setCellBadges, setDisabledCells, undoHistory]);

  // 🛡️ 키보드 이벤트 핸들러 (컴포넌트 스코프로 제한)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 🚀 컨텍스트 메뉴가 열려있을 때만 특정 키 차단
      if (contextMenu.show) {
        // Input, Popover 등 다른 UI 요소가 타겟인 경우는 차단하지 않음
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.closest('[role="dialog"]') ||
          target.closest("[data-radix-popper-content-wrapper]")
        ) {
          return; // Input이나 팝업 내부에서는 키보드 이벤트 허용
        }

        if (e.code === "Escape") {
          // ESC 키만 허용 - 메뉴를 닫기 위해
          return; // DropdownMenu의 onEscapeKeyDown이 처리하도록 함
        } else {
          // 테이블 영역에서만 나머지 키는 무시
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // 🎯 포커스 확인 및 보장
      if (document.activeElement !== containerRef.current) {
        containerRef.current?.focus();
      }

      // Cmd/Ctrl + C: Copy
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyC") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Cmd/Ctrl + V: Paste
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyV") {
        e.preventDefault();
        handlePaste();
        // Hide marching ants after paste but keep selection
        setShowMarchingAnts(false);
        return;
      }

      // ESC: Clear copy selection and marching ants
      if (e.code === "Escape") {
        if (showMarchingAnts) {
          setShowMarchingAnts(false);
        } else if (copiedData) {
          setCopiedData(null);
        }
        return;
      }

      // Space: Toggle disabled state for selected cells
      if (e.code === "Space") {
        e.preventDefault();
        const selectedCellsArray = Array.from(displaySelectedCells);
        if (selectedCellsArray.length === 0) return;

        // Check if all selected cells are currently disabled
        const allDisabled = selectedCellsArray.every(cellId => disabledCells.has(cellId));

        // Save previous states for undo
        const previousStates = new Map<string, boolean>();
        selectedCellsArray.forEach(cellId => {
          previousStates.set(cellId, disabledCells.has(cellId));
        });

        // Toggle disabled state
        setDisabledCells((prev: Set<string>) => {
          const newSet = new Set(prev);
          selectedCellsArray.forEach(cellId => {
            if (allDisabled) {
              // If all are disabled, enable them
              newSet.delete(cellId);
            } else {
              // If any are enabled, disable all
              newSet.add(cellId);
            }
          });
          return newSet;
        });

        // Save new states for undo
        const newStates = new Map<string, boolean>();
        selectedCellsArray.forEach(cellId => {
          newStates.set(cellId, !allDisabled);
        });

        // Add to undo history
        undoHistory.pushHistory({
          type: 'toggleDisabled',
          cellIds: selectedCellsArray,
          previousStates,
          newStates
        });

        return;
      }

      // Cmd/Ctrl + Z: 실행 취소
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 재실행: Mac은 Cmd+Shift+Z, Windows/Linux는 Ctrl+Y
      if ((e.metaKey && e.shiftKey && e.code === "KeyZ") || // Mac
          (e.ctrlKey && e.code === "KeyY")) { // Windows/Linux
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.code === "Escape") {
        // ESC: 모든 선택 해제
        e.preventDefault();
        setSelectedCells(new Set());
        setShiftSelectStart(null);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        // Delete/Backspace: 선택된 셀들의 뱃지 제거 (빈 상태로 만들기)
        e.preventDefault();

        if (selectedCells.size > 0) {
          const targetCells = Array.from(selectedCells);

          // 히스토리를 위한 이전 상태 저장
          const previousBadges = new Map<string, any[]>();
          targetCells.forEach(cellId => {
            previousBadges.set(cellId, cellBadges[cellId] ? [...cellBadges[cellId]] : []);
          });

          // 🚀 배치 업데이트로 경쟁 조건 방지 및 성능 향상
          React.startTransition(() => {
            // 뱃지 제거 (빈 상태로)
            setCellBadges((prev) => {
              const updated = { ...prev };
              const newBadges = new Map<string, any[]>();
              
              targetCells.forEach((cellId) => {
                delete updated[cellId]; // 완전히 제거
                newBadges.set(cellId, []);
              });

              // 히스토리에 추가
              setTimeout(() => {
                undoHistory.pushHistory({
                  type: 'setBadges',
                  cellIds: targetCells,
                  previousBadges,
                  newBadges,
                });
              }, 0);

              return updated;
            });
          });
        }
      }
    },
    [
      selectedCells,
      displaySelectedCells,
      contextMenu.show,
      disabledCells,
      setDisabledCells,
      setCellBadges,
      cellBadges,
      undoHistory,
      handleUndo,
      handleRedo,
      handleCopy,
      handlePaste,
      copiedData,
      showMarchingAnts,
      setShowMarchingAnts,
      setCopiedData,
      setSelectedCells,
      setShiftSelectStart,
    ]
  );

  // 🎯 포커스 관리 (한 번만 등록, 이벤트 리스너 누적 방지)
  useEffect(() => {
    const ensureFocus = () => {
      // input, textarea, select 등 form 요소가 포커스를 가지고 있으면 containerRef로 포커스를 옮기지 않음
      const activeElement = document.activeElement;
      const isFormElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      if (
        containerRef.current &&
        document.activeElement !== containerRef.current &&
        !isFormElement
      ) {
        containerRef.current.focus();
      }
    };

    // 초기 포커스 설정
    ensureFocus();

    // 🛡️ 클릭 이벤트 리스너는 한 번만 등록
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // input 요소를 클릭한 경우 포커스를 변경하지 않음
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (containerRef.current?.contains(e.target as Node)) {
        // RAF로 포커스 복원 최적화
        requestAnimationFrame(() => ensureFocus());
      }
    };

    document.addEventListener("click", handleDocumentClick, { passive: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []); // 🚀 한 번만 실행 (의존성 제거)

  // 탭 변경 시 선택 상태만 초기화 (disabledCells는 유지)
  React.useEffect(() => {
    // 선택 상태 초기화를 직접 수행
    setSelectedCells(new Set());
    setTempSelectedCells(null);
    setShiftSelectStart(null);
    setLastSelectedRow(null);
    setLastSelectedCol(null);
    setDragState({
      isActive: false,
      type: null,
      start: null,
      isAdditive: false,
      originalSelection: null,
    });
    
    setContextMenu({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });
    
    // undoHistory 메서드 직접 호출
    if (undoHistory && undoHistory.clearHistory) {
      undoHistory.clearHistory();
    }
    
    // Zone 변경 시 뱃지 초기화하지 않음 - 기존 뱃지 유지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProcessIndex, selectedZone]); // 핵심 의존성만 포함

  // 🛡️ 안전한 첫 번째 존 자동 선택 (초기화되지 않았거나 프로세스가 변경될 때만)
  React.useEffect(() => {
    if (
      processFlow &&
      processFlow.length > 0 &&
      selectedProcessIndex >= 0 &&
      selectedProcessIndex < processFlow.length &&
      processFlow[selectedProcessIndex] &&
      processFlow[selectedProcessIndex].zones
    ) {
      const zones = Object.keys(processFlow[selectedProcessIndex].zones);
      
      // 초기화되지 않았거나, selectedZone이 현재 zones에 없을 때만 설정
      if (zones.length > 0) {
        if (!selectedZone || !zones.includes(selectedZone)) {
          setSelectedZone(zones[0]);
        }
      }
    }
  }, [selectedProcessIndex, selectedZone, processFlow]); // 모든 의존성 포함

  // 🆕 disabledCells 또는 cellBadges 변경 시 period 재계산 및 zustand 업데이트
  useEffect(() => {
    if (!currentFacilities || currentFacilities.length === 0) return;
    if (!selectedZone || selectedProcessIndex === null) return;

    // Create unique key for this process-zone combination
    const initKey = `${selectedProcessIndex}-${selectedZone}`;

    // Skip update if not initialized yet for this specific process-zone
    if (!initializedKeys.has(initKey)) {
      // Always try to initialize from existing schedule data
      const hasExistingSchedule = currentFacilities.some(f =>
        f.operating_schedule?.time_blocks?.length > 0
      );

      console.log('ScheduleEditor initialization check:', {
        processIndex: selectedProcessIndex,
        zone: selectedZone,
        hasExistingSchedule,
        facilities: currentFacilities.length,
        firstFacility: currentFacilities[0]
      });

      if (hasExistingSchedule) {
        // 기존 schedule로부터 초기화 - 날짜 미리 계산
        const currentDate = useSimulationStore.getState().context.date || new Date().toISOString().split('T')[0];
        const prevDay = new Date(currentDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split('T')[0];

        console.log('Initializing from existing schedule data');
        const { disabledCells: initDisabledCells, badges: initBadges } =
          initializeDisabledCellsFromPeriods(currentFacilities, timeSlots, isPreviousDay, CONDITION_CATEGORIES, currentDate, prevDayStr);

        console.log('Initialized cells:', {
          disabledCount: initDisabledCells.size,
          badgeCount: Object.keys(initBadges).length
        });

        setDisabledCells(initDisabledCells);
        setCellBadges(initBadges);
        setInitializedKeys(prev => new Set([...prev, initKey]));
        return;
      }
      setInitializedKeys(prev => new Set([...prev, initKey]));
    }

    // 초기화가 완료된 후에만 업데이트 진행
    if (!initializedKeys.has(initKey)) {
      return; // 초기화 전에는 zustand 업데이트 하지 않음
    }

    // debounce를 위한 timeout
    const timeoutId = setTimeout(() => {
      // 각 시설별로 period 재계산
      currentFacilities.forEach((facility, facilityIndex) => {
        if (facility && facility.id) {
          const existingTimeBlocks = facility.operating_schedule?.time_blocks || [];
          
          // 현재 프로세스의 process_time_seconds 값 가져오기
          const currentProcess = selectedProcessIndex !== null ? processFlow[selectedProcessIndex] : null;
          const processTimeSeconds = (currentProcess as any)?.process_time_seconds;

          // 새로운 periods 계산 (뱃지 정보 포함, date 전달)
          const date = useSimulationStore.getState().context.date;
          const newTimeBlocks = calculatePeriodsFromDisabledCells(
            facilityIndex,
            disabledCells,
            timeSlots,
            existingTimeBlocks,
            cellBadges,
            processTimeSeconds ?? undefined,
            appliedTimeUnit,
            date,
            isPreviousDay
          );
          
          // 기존 time_blocks와 비교 (최적화: 길이 먼저 비교)
          const hasChanged = existingTimeBlocks.length !== newTimeBlocks.length ||
            JSON.stringify(existingTimeBlocks) !== JSON.stringify(newTimeBlocks);
          
          if (hasChanged) {
            // Zustand store 업데이트
            const { updateFacilitySchedule } = useSimulationStore.getState() as any;
            if (updateFacilitySchedule) {
              updateFacilitySchedule(
                selectedProcessIndex,
                selectedZone,
                facility.id,
                newTimeBlocks
              );
            }
          }
        }
      });
    }, 300); // 300ms debounce - 성능 개선
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    disabledCells,
    cellBadges,
    currentFacilities,
    selectedZone,
    selectedProcessIndex,
    initializedKeys,
    timeSlots,
    appliedTimeUnit,
    isPreviousDay,
    CONDITION_CATEGORIES,
    initializeDisabledCellsFromPeriods
  ]); // 모든 필요한 의존성 포함

  // 🛡️ 안전성 검사 강화
  if (!processFlow || processFlow.length === 0) {
    return null;
  }

  return (
    <div>
      {/* 🎯 키보드 이벤트 스코프 제한을 위한 컨테이너 */}
      <div
        ref={containerRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="outline-none"
        onClick={(e) => {
          // Popover나 Input 등 특정 요소 클릭은 차단하지 않음
          const target = e.target as HTMLElement;
          if (
            target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("button[data-radix-collection-item]") ||
            target.tagName === "INPUT" ||
            target.closest("input")
          ) {
            e.stopPropagation();
            return;
          }
        }}
      >
        {/* 2중 탭 */}
        <div className="mb-2 space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-16 text-sm font-medium text-default-900">
              Process
            </div>
            <Tabs
              value={selectedProcessIndex.toString()}
              onValueChange={(value) =>
                setSelectedProcessIndex(parseInt(value))
              }
              className="flex-1"
            >
              <TabsList
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${processFlow.length}, 1fr)`,
                }}
              >
                {processFlow.map((step, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className="text-sm font-medium text-default-900"
                  >
                    {formatProcessName(step.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* 🛡️ 안전한 존 탭 렌더링 */}
          {processFlow &&
            processFlow[selectedProcessIndex] &&
            processFlow[selectedProcessIndex].zones && (
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-default-900">
                  Zone
                </div>
                <Tabs
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                  className="flex-1"
                >
                  <TabsList
                    className="grid w-full"
                    style={{
                      gridTemplateColumns: `repeat(${Object.keys(processFlow[selectedProcessIndex].zones || {}).length}, 1fr)`,
                    }}
                  >
                    {Object.keys(
                      processFlow[selectedProcessIndex].zones || {}
                    ).map((zoneName) => (
                      <TabsTrigger
                        key={zoneName}
                        value={zoneName}
                        className="text-sm font-medium text-default-900"
                      >
                        {zoneName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}
        </div>

        {/* 우클릭 컨텍스트 메뉴 */}
        <ScheduleContextMenu
          contextMenu={contextMenu}
          onOpenChange={(open) =>
            setContextMenu((prev) => ({
              ...prev,
              show: open,
              targetCells: open ? prev.targetCells || [] : [],
            }))
          }
          categoryGroups={getCategoryGroups()}
          conditionCategories={CONDITION_CATEGORIES}
          cellBadges={cellBadges}
          onToggleBadgeOption={handleToggleBadgeOption}
          onSelectAllCategories={handleSelectAllCategories}
          onClearAllBadges={handleClearAllBadges}
        />

        {/* 제목과 전체화면 버튼 */}
        {selectedZone && currentFacilities.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-default-900">
              Operating Schedule -{" "}
              {formatProcessName(processFlow[selectedProcessIndex]?.name)} /{" "}
              {selectedZone}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-md border border-gray-200">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <input
                  id="time-unit"
                  type="text"
                  value={timeUnitInput}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setTimeUnitInput(numericValue);
                  }}
                  onKeyDown={(e) => {
                    // 키보드 이벤트가 테이블 단축키와 충돌하지 않도록 전파 중단
                    e.stopPropagation();

                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = parseInt(timeUnitInput) || 30;
                      const clampedValue = Math.max(1, Math.min(60, value));

                      // 값이 변경되었을 때만 처리
                      if (clampedValue !== appliedTimeUnit) {
                        // 데이터가 있으면 확인 다이얼로그 표시
                        if (Object.keys(cellBadges).length > 0 || disabledCells.size > 0) {
                          setPendingTimeUnit(clampedValue);
                          setShowTimeUnitConfirm(true);
                        } else {
                          // 데이터가 없으면 바로 변경
                          setAppliedTimeUnit(clampedValue);
                          setTimeUnitInput(clampedValue.toString());
                        }
                      }

                      // 입력 필드에서 포커스 제거
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={() => {
                    // onBlur에서는 값만 정리하고 적용하지 않음
                    const value = parseInt(timeUnitInput) || appliedTimeUnit;
                    const clampedValue = Math.max(1, Math.min(60, value));
                    setTimeUnitInput(clampedValue.toString());
                  }}
                  placeholder="30"
                  title="Time interval in minutes (1-60). Press Enter to apply."
                  className="w-8 bg-transparent border-none outline-none text-sm text-center font-medium text-gray-700 placeholder-gray-400"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-2"
              >
                <Expand className="h-4 w-4" />
                Full Screen
              </Button>
            </div>
          </div>
        )}

        {/* 엑셀 그리드 테이블 */}
        <ExcelTable
          selectedZone={selectedZone}
          currentFacilities={currentFacilities}
          timeSlots={timeSlots}
          selectedCells={displaySelectedCells}
          cellBadges={cellBadges}
          disabledCells={disabledCells}
          copiedCells={copiedCells}
          isFullScreen={false}
          virtualScroll={virtualScrollConfig}
          handlers={tableHandlers}
          isPreviousDay={isPreviousDay}
        />

        {/* 전체화면 Dialog */}
        <Dialog 
          open={isFullScreen} 
          modal={true}
          onOpenChange={(open) => {
            // 컨텍스트 메뉴가 열려있을 때는 Dialog를 닫지 않음
            if (!open && contextMenu.show) {
              return; // Dialog 닫기 방지
            }
            setIsFullScreen(open);
          }}
        >
          <DialogContent 
            className="max-w-[95vw] h-[95vh] p-0 flex flex-col"
            onInteractOutside={(e) => {
              // 컨텍스트 메뉴가 열려있을 때는 외부 상호작용 차단
              if (contextMenu.show) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle className="text-xl font-semibold">
                Operating Schedule -{" "}
                {formatProcessName(processFlow[selectedProcessIndex]?.name)} /{" "}
                {selectedZone}
              </DialogTitle>
              <DialogDescription>
                Configure time-based facility operations for{" "}
                {formatProcessName(processFlow[selectedProcessIndex]?.name)} in
                zone {selectedZone}
              </DialogDescription>
            </DialogHeader>
            <div 
              className="flex-1 min-h-0 px-6 pb-6 overflow-hidden"
              onClick={(e) => {
                // 컨텍스트 메뉴가 열려있을 때는 클릭 이벤트 전파 방지
                if (contextMenu.show) {
                  e.stopPropagation();
                }
              }}
            >
              <ExcelTable
                selectedZone={selectedZone}
                currentFacilities={currentFacilities}
                timeSlots={timeSlots}
                selectedCells={displaySelectedCells}
                cellBadges={cellBadges}
                disabledCells={disabledCells}
                copiedCells={copiedCells}
                isFullScreen={true}
                virtualScroll={virtualScrollConfig}
                handlers={tableHandlers}
                isPreviousDay={isPreviousDay}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Time Unit Change Confirmation Dialog */}
        <AlertDialog open={showTimeUnitConfirm} onOpenChange={setShowTimeUnitConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Time Interval?</AlertDialogTitle>
              <AlertDialogDescription>
                {Object.keys(cellBadges).length > 0 || disabledCells.size > 0
                  ? "Changing the time interval will clear all existing schedule data. Do you want to continue?"
                  : `Change time interval to ${pendingTimeUnit} minutes?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setTimeUnitInput(appliedTimeUnit.toString());
                setPendingTimeUnit(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (pendingTimeUnit) {
                  setAppliedTimeUnit(pendingTimeUnit);
                  setTimeUnitInput(pendingTimeUnit.toString());
                  // Clear data if exists
                  if (Object.keys(cellBadges).length > 0 || disabledCells.size > 0) {
                    setCellBadges({});
                    setDisabledCells(new Set<string>());
                  }
                  setPendingTimeUnit(null);
                }
              }}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Paste Size Mismatch Warning Dialog */}
        <AlertDialog open={showPasteWarning} onOpenChange={setShowPasteWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Size Mismatch</AlertDialogTitle>
              <AlertDialogDescription>
                The copied area and paste area have different sizes and shapes.
                Do you want to continue? The pattern will be repeated to fill the selection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingPasteData(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (pendingPasteData) {
                  executePaste(pendingPasteData.targetCells, pendingPasteData.copiedData);
                  setPendingPasteData(null);
                }
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
