"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCellSelection } from "./hooks/useCellSelection";
import { ScheduleContextMenu } from "./ScheduleContextMenu";
import { Expand, Globe, MapPin, Navigation, Plane, Users } from "lucide-react";
import { ProcessStep } from "@/types/simulationTypes";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn, formatProcessName } from "@/lib/utils";
import { useSimulationStore } from "../../_stores";

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
  bgColor: string;
  textColor: string;
  borderColor: string;
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
      bgColor: string;
      textColor: string;
      borderColor: string;
    }
  > = {};

  // 🎯 1단계: parquetMetadata 처리
  parquetMetadata.forEach((item) => {
    let categoryName = "";
    let icon = Plane;
    let colors = {
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    };

    switch (item.column) {
      case "operating_carrier_name":
      case "operating_carrier_iata":
        categoryName = "Airline";
        icon = Plane;
        colors = {
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        };
        break;
      case "aircraft_type":
        categoryName = "Aircraft Type";
        icon = Plane;
        colors = {
          bgColor: "bg-indigo-50",
          textColor: "text-indigo-700",
          borderColor: "border-indigo-200",
        };
        break;
      case "flight_type":
        categoryName = "Flight Type";
        icon = Navigation;
        colors = {
          bgColor: "bg-cyan-50",
          textColor: "text-cyan-700",
          borderColor: "border-cyan-200",
        };
        break;
      case "arrival_airport_iata":
        categoryName = "Arrival Airport";
        icon = MapPin;
        colors = {
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        };
        break;
      case "arrival_city":
        categoryName = "Arrival City";
        icon = MapPin;
        colors = {
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          borderColor: "border-purple-200",
        };
        break;
      case "arrival_country":
        categoryName = "Arrival Country";
        icon = Globe;
        colors = {
          bgColor: "bg-pink-50",
          textColor: "text-pink-700",
          borderColor: "border-pink-200",
        };
        break;
      case "arrival_region":
        categoryName = "Arrival Region";
        icon = Globe;
        colors = {
          bgColor: "bg-rose-50",
          textColor: "text-rose-700",
          borderColor: "border-rose-200",
        };
        break;
      case "nationality":
        categoryName = "Nationality";
        icon = MapPin;
        colors = {
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
        };
        break;
      case "profile":
        categoryName = "Passenger Type";
        icon = Users;
        colors = {
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
        };
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
          ...colors,
        };
      }
    }
  });

  // 🎯 2단계: paxDemographics 처리 (additionalMetadata와 동일)
  Object.entries(paxDemographics).forEach(([key, data]) => {
    if (data && data.available_values && data.available_values.length > 0) {
      let categoryName = "";
      let icon = Users;
      let colors = {
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
      };

      if (key === "nationality") {
        categoryName = "Nationality";
        icon = MapPin;
        colors = {
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
        };
      } else if (key === "profile") {
        categoryName = "Passenger Type";
        icon = Users;
        colors = {
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
        };
      }

      if (categoryName) {
        // paxDemographics가 우선순위를 가지도록 덮어쓰기
        categories[categoryName] = {
          icon,
          options: data.available_values,
          ...colors,
        };
      }
    }
  });

  return categories;
};

// 상수들

// ROW_HEIGHT와 VIEWPORT_HEIGHT 상수들
const ROW_HEIGHT = 60; // 각 행의 높이 (픽셀)
const VIEWPORT_HEIGHT = 500; // 보이는 영역 높이
const BUFFER_SIZE = 3; // 앞뒤로 추가 렌더링할 행 수 (부드러운 스크롤)

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
  isFullScreen?: boolean;
  virtualScroll: VirtualScrollConfig;
  handlers: TableHandlers;
}

const ExcelTable: React.FC<ExcelTableProps> = React.memo(
  ({
    selectedZone,
    currentFacilities,
    timeSlots,
    selectedCells,
    cellBadges,
    disabledCells,
    isFullScreen = false,
    virtualScroll,
    handlers,
  }) => {
    const {
      visibleTimeSlots = timeSlots,
      startIndex = 0,
      totalHeight = 0,
      offsetY = 0,
      onScroll,
    } = virtualScroll;
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

    // 🖼️ 선택된 셀의 바깥쪽 테두리 계산 함수 (최적화)
    const getSelectionBorders = useMemo(() => {
      const borderMap = new Map<string, string>();

      selectedCells.forEach((cellId) => {
        const [rowIndex, colIndex] = parseCellId(cellId);
        const borders: string[] = [];

        // 위쪽 테두리 (위쪽 셀이 선택되지 않음)
        const topCellId = `${rowIndex - 1}-${colIndex}`;
        if (!selectedCells.has(topCellId)) {
          borders.push("border-t-2 border-dashed border-primary");
        }

        // 아래쪽 테두리 (아래쪽 셀이 선택되지 않음)
        const bottomCellId = `${rowIndex + 1}-${colIndex}`;
        if (!selectedCells.has(bottomCellId)) {
          borders.push("border-b-2 border-dashed border-primary");
        }

        // 왼쪽 테두리 (왼쪽 셀이 선택되지 않음)
        const leftCellId = `${rowIndex}-${colIndex - 1}`;
        if (!selectedCells.has(leftCellId)) {
          borders.push("border-l-2 border-dashed border-primary");
        }

        // 오른쪽 테두리 (오른쪽 셀이 선택되지 않음)
        const rightCellId = `${rowIndex}-${colIndex + 1}`;
        if (!selectedCells.has(rightCellId)) {
          borders.push("border-r-2 border-dashed border-primary");
        }

        borderMap.set(cellId, borders.join(" "));
      });

      return (rowIndex: number, colIndex: number) => {
        const cellId = `${rowIndex}-${colIndex}`;
        return borderMap.get(cellId) || "";
      };
    }, [selectedCells, parseCellId]);
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
        className={`rounded-lg border ${
          isFullScreen ? "overflow-auto" : "max-h-[70vh] overflow-auto"
        }`}
        onScroll={onScroll}
        style={{
          height: isFullScreen ? "100%" : 500,
        }}
      >
        {/* 🚀 가상화 스크롤 컨테이너 */}
        <div style={{ height: totalHeight }}>
          <table className="w-full table-fixed text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th
                  className="w-16 cursor-pointer select-none border-r p-2 text-left transition-colors hover:bg-primary/10"
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
                    className="min-w-20 cursor-pointer select-none border-r p-2 text-center transition-colors hover:bg-primary/10"
                    onMouseDown={(e) =>
                      handlers.column.onMouseDown(colIndex, e)
                    }
                    onMouseEnter={(e) =>
                      handlers.column.onMouseEnter(colIndex, e)
                    }
                    onMouseUp={handlers.column.onMouseUp}
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
            <tbody style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleTimeSlots.map((timeSlot, visibleRowIndex) => {
                const rowIndex = startIndex + visibleRowIndex;
                return (
                  <tr
                    key={rowIndex}
                    className="border-t"
                    style={{ height: 60 }}
                  >
                    <td
                      className="cursor-pointer select-none border-r p-1 text-center text-xs font-medium text-default-500 transition-colors hover:bg-primary/10"
                      onMouseDown={(e) => handlers.row.onMouseDown(rowIndex, e)}
                      onMouseEnter={(e) =>
                        handlers.row.onMouseEnter(rowIndex, e)
                      }
                      onMouseUp={handlers.row.onMouseUp}
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
                      {timeSlot}
                    </td>
                    {currentFacilities.map((facility, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const isSelected = selectedCells.has(cellId);
                      const isDisabled = disabledCells.has(cellId);
                      const badges = cellBadges[cellId] || [];
                      const selectionBorders = getSelectionBorders(
                        rowIndex,
                        colIndex
                      );

                      return (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "cursor-pointer select-none p-1",
                            !isSelected && "border-r", // 선택되지 않은 셀만 기본 테두리
                            isDisabled && "bg-gray-100",
                            selectionBorders
                          )}
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
                              {/* 카테고리 뱃지들 */}
                              {badges.map((categoryBadge, badgeIndex) => (
                                <span
                                  key={`${categoryBadge.category}-${badgeIndex}`}
                                  className={cn(
                                    categoryBadge.bgColor,
                                    categoryBadge.textColor,
                                    categoryBadge.borderColor,
                                    "select-none rounded border px-1 text-[9px] font-medium leading-tight"
                                  )}
                                  title={`${categoryBadge.category}: ${categoryBadge.options.join("|")}`}
                                >
                                  {categoryBadge.options
                                    .map((option) => option.slice(0, 3))
                                    .join("|")}
                                </span>
                              ))}
                            </div>
                          </div>
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
  // 🔗 Zustand 연결 - Facility Detail 기능 통합
  const setFacilitiesForZone = useSimulationStore(
    (s) => s.setFacilitiesForZone
  );
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

  // 뱃지 상태 관리 (cellId -> CategoryBadge[]) - 카테고리별로 관리
  const [cellBadges, setCellBadges] = useState<Record<string, CategoryBadge[]>>(
    {}
  );

  // 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    cellId: string;
    targetCells: string[];
    x: number;
    y: number;
  }>({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });

  // 🚫 셀별 비활성화 상태 관리
  const [disabledCells, setDisabledCells] = useState<Set<string>>(new Set());

  // 🚀 가상화 상태 (Virtual Scrolling)
  const [scrollTop, setScrollTop] = useState(0);

  // 시간 슬롯 생성 (00:00 ~ 23:50, 10분 단위, 144개)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, []);

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

  // 🚀 가상화 스크롤 핸들러 (Virtual Scrolling)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
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
              bgColor: "bg-orange-50",
              textColor: "text-orange-700",
              borderColor: "border-orange-200",
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

  // 🚀 가상화 계산 (Virtual Scrolling)
  const virtualScrollConfig = useMemo(() => {
    const totalRows = timeSlots.length;
    const visibleRows = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT);

    const startIdx = Math.max(
      0,
      Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE
    );
    const endIdx = Math.min(
      totalRows,
      startIdx + visibleRows + BUFFER_SIZE * 2
    );

    const visibleSlots = timeSlots.slice(startIdx, endIdx);
    const totalH = totalRows * ROW_HEIGHT;
    const offsetTop = startIdx * ROW_HEIGHT;

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      visibleTimeSlots: visibleSlots,
      totalHeight: totalH,
      offsetY: offsetTop,
      onScroll: handleScroll,
    };
  }, [scrollTop, timeSlots, handleScroll]);

  // 🔍 Process 카테고리 config 가져오기 헬퍼
  const getProcessCategoryConfig = useCallback(
    (category: string) => {
      if (selectedProcessIndex > 0 && processFlow && processFlow.length > 0) {
        for (let i = 0; i < selectedProcessIndex; i++) {
          const process = processFlow[i];
          if (process && process.zones) {
            const processName = formatProcessName(process.name);
            if (processName === category) {
              return {
                icon: Navigation,
                options: Object.keys(process.zones),
                bgColor: "bg-orange-50",
                textColor: "text-orange-700",
                borderColor: "border-orange-200",
              };
            }
          }
        }
      }
      return null;
    },
    [selectedProcessIndex, processFlow]
  );

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

      setCellBadges((prev) => {
        const updated = { ...prev };

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
            const newCategoryBadge: CategoryBadge = {
              category,
              options: [option],
              bgColor: categoryConfig.bgColor,
              textColor: categoryConfig.textColor,
              borderColor: categoryConfig.borderColor,
            };
            existingBadges.push(newCategoryBadge);
          }

          updated[cellId] = [...existingBadges];
        });

        return updated;
      });
    },
    [
      contextMenu.targetCells,
      cellBadges,
      getProcessCategoryConfig,
      CONDITION_CATEGORIES,
      setCellBadges,
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

  // 모든 뱃지 제거 핸들러 (선택된 모든 셀에서)
  const handleClearAllBadges = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    setCellBadges((prev) => {
      const updated = { ...prev };
      targetCells.forEach((cellId) => {
        updated[cellId] = [];
      });
      return updated;
    });
  }, [contextMenu.targetCells]);

  // 모든 카테고리 선택 핸들러 - "All" 뱃지 하나만 표시
  const handleSelectAllCategories = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    setCellBadges((prev) => {
      const updated = { ...prev };

      targetCells.forEach((cellId) => {
        // ⭐ "All" 뱃지 하나만 추가 (기존 뱃지들은 모두 제거)
        updated[cellId] = [
          {
            category: "All",
            options: ["All"],
            bgColor: "bg-slate-50",
            textColor: "text-slate-700",
            borderColor: "border-slate-300",
          },
        ];
      });

      return updated;
    });
  }, [contextMenu.targetCells]);

  // 우클릭 핸들러
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, cellId: string) => {
      e.preventDefault();

      // 우클릭한 셀이 현재 선택에 포함되어 있는지 확인
      const isCurrentlySelected = selectedCells.has(cellId);

      let targetCells: string[];
      if (isCurrentlySelected && selectedCells.size > 1) {
        // 선택된 셀들 중 하나를 우클릭한 경우 → 모든 선택된 셀에 적용
        targetCells = Array.from(selectedCells);
      } else {
        // 선택되지 않은 셀을 우클릭한 경우 → 해당 셀에만 적용
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
    [selectedCells]
  );

  // 행 헤더 우클릭 핸들러 (해당 행의 모든 셀에 적용)
  const handleRowRightClick = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      e.preventDefault();

      // 해당 행의 모든 셀 ID 생성
      const rowCellIds = generateRowCells(rowIndex);
      const targetCells = Array.from(rowCellIds);

      setContextMenu({
        show: true,
        cellId: `${rowIndex}-0`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateRowCells]
  );

  // 열 헤더 우클릭 핸들러 (해당 열의 모든 셀에 적용)
  const handleColumnRightClick = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.preventDefault();

      // 해당 열의 모든 셀 ID 생성
      const columnCellIds = generateColumnCells(colIndex);
      const targetCells = Array.from(columnCellIds);

      setContextMenu({
        show: true,
        cellId: `0-${colIndex}`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateColumnCells]
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

  // Time 헤더 우클릭 핸들러 (전체 셀에 뱃지 적용)
  const handleTimeHeaderRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // 전체 셀 ID 생성
      const allCellIds = generateAllCells();
      const targetCells = Array.from(allCellIds);

      setContextMenu({
        show: true,
        cellId: "0-0", // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateAllCells]
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

  const handleCellMouseEnter = useCallback(
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

  const handleCellMouseUp = useCallback(() => {
    finalizeDrag();
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

      setSelectedCells((prev) => {
        setDragState(
          createDragState(
            "column",
            { row: 0, col: colIndex },
            isAdditive,
            isAdditive ? new Set(prev) : null
          )
        );

        if (isAdditive) {
          // Cmd + 드래그: 기존 선택 유지하면서 현재 열 추가
          return new Set([...prev, ...columnCellIds]);
        } else {
          // 일반 드래그: 새로 선택
          return columnCellIds;
        }
      });
      setLastSelectedCol(colIndex);
    },
    [
      generateColumnCells,
      setSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedCol,
      handleColumnClick,
    ]
  );

  const handleColumnMouseEnter = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      if (
        dragState.isActive &&
        dragState.type === "column" &&
        dragState.start
      ) {
        e.preventDefault();

        // 드래그 범위의 모든 열 선택
        const rangeCellIds = generateColumnRange(dragState.start.col, colIndex);

        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateColumnRange, setSelectedCells]
  );

  const handleColumnMouseUp = useCallback(() => {
    finalizeDrag();
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

      setSelectedCells((prev) => {
        setDragState(
          createDragState(
            "row",
            { row: rowIndex, col: 0 },
            isAdditive,
            isAdditive ? new Set(prev) : null
          )
        );

        if (isAdditive) {
          // Cmd + 드래그: 기존 선택 유지하면서 현재 행 추가
          return new Set([...prev, ...rowCellIds]);
        } else {
          // 일반 드래그: 새로 선택
          return rowCellIds;
        }
      });
      setLastSelectedRow(rowIndex);
    },
    [
      generateRowCells,
      setSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedRow,
      handleRowClick,
    ]
  );

  const handleRowMouseEnter = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      if (dragState.isActive && dragState.type === "row" && dragState.start) {
        e.preventDefault();

        // 드래그 범위의 모든 행 선택
        const rangeCellIds = generateRowRange(dragState.start.row, rowIndex);

        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateRowRange, setSelectedCells]
  );

  const handleRowMouseUp = useCallback(() => {
    finalizeDrag();
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

      if (e.code === "Space") {
        e.preventDefault();
        // 🚫 스페이스바 로직: 배경색 활성화/비활성화 토글
        if (selectedCells.size > 0) {
          const selectedCellIds = Array.from(selectedCells);

          // 스마트 토글: 일부라도 비활성화되어 있으면 모두 활성화, 모두 활성화면 모두 비활성화
          const someDisabled = selectedCellIds.some((cellId) =>
            disabledCells.has(cellId)
          );

          setDisabledCells((prev) => {
            const newSet = new Set(prev);

            if (someDisabled) {
              // 일부가 비활성화 → 모두 활성화
              selectedCellIds.forEach((cellId) => newSet.delete(cellId));
            } else {
              // 모두 활성화 → 모두 비활성화
              selectedCellIds.forEach((cellId) => newSet.add(cellId));
            }

            return newSet;
          });
        }
      } else if (e.code === "Escape") {
        // ESC: 모든 선택 해제
        e.preventDefault();
        setSelectedCells(new Set());
        setShiftSelectStart(null);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        // Delete/Backspace: 선택된 셀들의 뱃지 모두 제거
        e.preventDefault();

        if (selectedCells.size > 0) {
          const targetCells = Array.from(selectedCells);

          // 🚀 배치 업데이트로 경쟁 조건 방지 및 성능 향상
          React.startTransition(() => {
            // 뱃지 제거
            setCellBadges((prev) => {
              const updated = { ...prev };
              targetCells.forEach((cellId) => {
                delete updated[cellId]; // 빈 배열 대신 완전 제거로 메모리 최적화
              });
              return updated;
            });
          });
        }
      }
    },
    [
      selectedCells,
      contextMenu.show,
      disabledCells,
      setDisabledCells,
      setCellBadges,
    ]
  );

  // 🎯 포커스 관리 (한 번만 등록, 이벤트 리스너 누적 방지)
  useEffect(() => {
    const ensureFocus = () => {
      if (
        containerRef.current &&
        document.activeElement !== containerRef.current
      ) {
        containerRef.current.focus();
      }
    };

    // 초기 포커스 설정
    ensureFocus();

    // 🛡️ 클릭 이벤트 리스너는 한 번만 등록
    const handleDocumentClick = (e: MouseEvent) => {
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

  // 탭 변경 시 선택 상태들 초기화
  React.useEffect(() => {
    clearSelection(); // 커스텀 훅의 clearSelection 사용
    setCellBadges({});
    setContextMenu({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });
    setDisabledCells(new Set()); // 🚫 비활성화 상태도 초기화
  }, [selectedProcessIndex, selectedZone, clearSelection]);

  // 🛡️ 안전한 첫 번째 존 자동 선택
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
      if (zones.length > 0) {
        setSelectedZone(zones[0]);
      }
    }
  }, [selectedProcessIndex, processFlow]);

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
        )}

        {/* 엑셀 그리드 테이블 */}
        <ExcelTable
          selectedZone={selectedZone}
          currentFacilities={currentFacilities}
          timeSlots={timeSlots}
          selectedCells={displaySelectedCells}
          cellBadges={cellBadges}
          disabledCells={disabledCells}
          isFullScreen={false}
          virtualScroll={virtualScrollConfig}
          handlers={tableHandlers}
        />

        {/* 전체화면 Dialog */}
        <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 flex flex-col">
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
            <div className="flex-1 min-h-0 px-6 pb-6 overflow-auto">
              <ExcelTable
                selectedZone={selectedZone}
                currentFacilities={currentFacilities}
                timeSlots={timeSlots}
                selectedCells={displaySelectedCells}
                cellBadges={cellBadges}
                disabledCells={disabledCells}
                isFullScreen={true}
                virtualScroll={virtualScrollConfig}
                handlers={tableHandlers}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
