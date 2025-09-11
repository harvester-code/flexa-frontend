"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Building2,
  Expand,
  Globe,
  MapPin,
  Navigation,
  Plane,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { EntryCondition, ProcessStep } from "@/types/simulationTypes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn, formatProcessName } from "@/lib/utils";
import { useSimulationStore } from "../_stores";

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

// 드래그 상태 타입 정의
type DragState = {
  type: "cell" | "row" | "column" | null;
  isActive: boolean;
  start: { row: number; col: number } | null;
  isAdditive: boolean;
  originalSelection: Set<string> | null;
};

const DEFAULT_DRAG_STATE: DragState = {
  type: null,
  isActive: false,
  start: null,
  isAdditive: false,
  originalSelection: null,
};

// 드래그 상태 헬퍼 함수들
const resetDragState = () => ({ ...DEFAULT_DRAG_STATE });

const createDragState = (
  type: "cell" | "row" | "column",
  start: { row: number; col: number },
  isAdditive: boolean = false,
  originalSelection: Set<string> | null = null
) => ({
  type,
  isActive: true,
  start,
  isAdditive,
  originalSelection,
});

// 🧠 스마트 토글 헬퍼 함수 (일부 선택됨 → 모두 선택됨 → 모두 해제됨)
const toggleCellIds = (
  cellIds: Set<string>,
  currentSelection: Set<string>,
  preserveExisting: boolean = false
): Set<string> => {
  const newSet = preserveExisting
    ? new Set(currentSelection)
    : new Set<string>();

  // 토글할 셀들의 현재 상태 분석
  const selectedCells = Array.from(cellIds).filter((cellId) =>
    newSet.has(cellId)
  );
  const unselectedCells = Array.from(cellIds).filter(
    (cellId) => !newSet.has(cellId)
  );

  if (unselectedCells.length > 0) {
    // 하나라도 선택되지 않은 셀이 있으면 → 모든 셀을 선택 상태로
    cellIds.forEach((cellId) => newSet.add(cellId));
  } else {
    // 모든 셀이 선택되어 있으면 → 모든 셀을 선택 해제
    cellIds.forEach((cellId) => newSet.delete(cellId));
  }

  return newSet;
};

// 유틸리티 함수들
const generateCellRange = (
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): Set<string> => {
  const cellIds = new Set<string>();
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cellIds.add(`${row}-${col}`);
    }
  }

  return cellIds;
};

const generateRowCells = (rowIndex: number, colCount: number): Set<string> => {
  const cellIds = new Set<string>();
  for (let col = 0; col < colCount; col++) {
    cellIds.add(`${rowIndex}-${col}`);
  }
  return cellIds;
};

const generateColumnCells = (
  colIndex: number,
  rowCount: number
): Set<string> => {
  const cellIds = new Set<string>();
  for (let row = 0; row < rowCount; row++) {
    cellIds.add(`${row}-${colIndex}`);
  }
  return cellIds;
};

const generateRowRange = (
  startRow: number,
  endRow: number,
  colCount: number
): Set<string> => {
  const cellIds = new Set<string>();
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = 0; col < colCount; col++) {
      cellIds.add(`${row}-${col}`);
    }
  }
  return cellIds;
};

const generateColumnRange = (
  startCol: number,
  endCol: number,
  rowCount: number
): Set<string> => {
  const cellIds = new Set<string>();
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  for (let col = minCol; col <= maxCol; col++) {
    for (let row = 0; row < rowCount; row++) {
      cellIds.add(`${row}-${col}`);
    }
  }
  return cellIds;
};

// 엑셀 테이블 컴포넌트 분리
interface ExcelTableProps {
  selectedZone: string;
  currentFacilities: any[];
  timeSlots: string[];
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>; // 🚫 비활성화된 셀들 추가
  isFullScreen?: boolean;
  handleTimeHeaderClick: (e: React.MouseEvent) => void;
  handleTimeHeaderRightClick: (e: React.MouseEvent) => void;
  handleColumnMouseDown: (colIndex: number, e: React.MouseEvent) => void;
  handleColumnMouseEnter: (colIndex: number, e: React.MouseEvent) => void;
  handleColumnMouseUp: () => void;
  handleColumnRightClick: (e: React.MouseEvent, colIndex: number) => void;
  handleRowMouseDown: (rowIndex: number, e: React.MouseEvent) => void;
  handleRowMouseEnter: (rowIndex: number, e: React.MouseEvent) => void;
  handleRowMouseUp: () => void;
  handleRowRightClick: (e: React.MouseEvent, rowIndex: number) => void;
  handleCellMouseDown: (
    cellId: string,
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent
  ) => void;
  handleCellMouseEnter: (
    cellId: string,
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent
  ) => void;
  handleCellMouseUp: () => void;
  handleCellRightClick: (e: React.MouseEvent, cellId: string) => void;
  handleRemoveCategoryBadge: (cellId: string, category: string) => void;
  cn: typeof cn;
}

const ExcelTable: React.FC<ExcelTableProps> = React.memo(
  ({
    selectedZone,
    currentFacilities,
    timeSlots,
    selectedCells,
    cellBadges,
    disabledCells, // 🚫 비활성화된 셀들 props
    isFullScreen = false,
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
    cn,
  }) => {
    // 🖼️ 선택된 셀의 바깥쪽 테두리 계산 함수 (최적화)
    const getSelectionBorders = useMemo(() => {
      const borderMap = new Map<string, string>();

      selectedCells.forEach((cellId) => {
        const [rowIndex, colIndex] = cellId.split("-").map(Number);
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
    }, [selectedCells]);
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
      >
        <table className="w-full table-fixed text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th
                className="w-16 cursor-pointer select-none border-r p-2 text-left transition-colors hover:bg-primary/10"
                onClick={(e) => handleTimeHeaderClick(e)}
                onContextMenu={(e) => {
                  // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                  } else {
                    handleTimeHeaderRightClick(e);
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
                  onMouseDown={(e) => handleColumnMouseDown(colIndex, e)}
                  onMouseEnter={(e) => handleColumnMouseEnter(colIndex, e)}
                  onMouseUp={handleColumnMouseUp}
                  onContextMenu={(e) => {
                    // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                    } else {
                      handleColumnRightClick(e, colIndex);
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
            {timeSlots.map((timeSlot, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                <td
                  className="cursor-pointer select-none border-r p-1 text-center text-xs font-medium text-default-500 transition-colors hover:bg-primary/10"
                  onMouseDown={(e) => handleRowMouseDown(rowIndex, e)}
                  onMouseEnter={(e) => handleRowMouseEnter(rowIndex, e)}
                  onMouseUp={handleRowMouseUp}
                  onContextMenu={(e) => {
                    // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                    } else {
                      handleRowRightClick(e, rowIndex);
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
                          handleCellMouseDown(cellId, rowIndex, colIndex, e);
                        }
                      }}
                      onMouseEnter={(e) =>
                        handleCellMouseEnter(cellId, rowIndex, colIndex, e)
                      }
                      onMouseUp={handleCellMouseUp}
                      onContextMenu={(e) => {
                        // Cmd/Ctrl 키와 함께 사용할 때 컨텍스트 메뉴 방지
                        if (e.ctrlKey || e.metaKey) {
                          e.preventDefault();
                        } else {
                          handleCellRightClick(e, cellId);
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
            ))}
          </tbody>
        </table>
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

  // 통합 드래그 상태
  const [dragState, setDragState] = useState<DragState>(resetDragState);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Shift 클릭 선택 상태
  const [shiftSelectStart, setShiftSelectStart] = useState<{
    row: number;
    col: number;
  } | null>(null);

  // 더블 스페이스 기능 제거됨

  // Shift 범위 선택을 위한 마지막 선택 위치
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null);
  const [lastSelectedCol, setLastSelectedCol] = useState<number | null>(null);

  // 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    cellId: string;
    targetCells: string[];
    x: number;
    y: number;
  }>({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });

  // 🔍 카테고리별 검색어 관리
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // 🚫 셀별 비활성화 상태 관리
  const [disabledCells, setDisabledCells] = useState<Set<string>>(new Set());

  // 🔍 검색어 변경 핸들러
  const handleSearchTermChange = useCallback(
    (category: string, term: string) => {
      setSearchTerms((prev) => ({
        ...prev,
        [category]: term,
      }));
    },
    []
  );

  // 🔤 옵션 정렬 및 필터링 함수
  const getFilteredAndSortedOptions = useCallback(
    (category: string, options: string[]) => {
      const searchTerm = searchTerms[category]?.toLowerCase() || "";

      return options
        .filter((option) => option.toLowerCase().includes(searchTerm))
        .sort((a, b) => a.localeCompare(b));
    },
    [searchTerms]
  );

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

  // 🔢 현재 존의 시설 개수 가져오기
  const currentFacilityCount = useMemo(() => {
    return currentFacilities.length;
  }, [currentFacilities]);

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
    [contextMenu.targetCells, cellBadges, getProcessCategoryConfig]
  );

  // 옵션 상태 확인 헬퍼 - 카테고리별 옵션 확인
  const getOptionCheckState = useCallback(
    (category: string, option: string) => {
      const targetCells = contextMenu.targetCells || [];
      if (targetCells.length === 0) return false;

      // 🚀 매번 새로운 상태에서 확인 (경쟁 조건 방지)
      const cellsWithOption = targetCells.filter((cellId) => {
        const badges = cellBadges[cellId] || [];
        return badges.some(
          (badge) =>
            badge.category === category && badge.options.includes(option)
        );
      });

      if (cellsWithOption.length === 0) return false; // 없음
      if (cellsWithOption.length === targetCells.length) return true; // 모두 있음
      return "indeterminate"; // 일부만 있음
    },
    [contextMenu.targetCells, cellBadges]
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
      const rowCellIds = generateRowCells(rowIndex, currentFacilities.length);
      const targetCells = Array.from(rowCellIds);

      setContextMenu({
        show: true,
        cellId: `${rowIndex}-0`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [currentFacilities.length]
  );

  // 열 헤더 우클릭 핸들러 (해당 열의 모든 셀에 적용)
  const handleColumnRightClick = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.preventDefault();

      // 해당 열의 모든 셀 ID 생성
      const columnCellIds = generateColumnCells(colIndex, timeSlots.length);
      const targetCells = Array.from(columnCellIds);

      setContextMenu({
        show: true,
        cellId: `0-${colIndex}`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [timeSlots.length]
  );

  // 전체 셀 생성 헬퍼 함수
  const generateAllCells = useCallback(() => {
    const allCellIds = new Set<string>();
    for (let row = 0; row < timeSlots.length; row++) {
      for (let col = 0; col < currentFacilities.length; col++) {
        allCellIds.add(`${row}-${col}`);
      }
    }
    return allCellIds;
  }, [timeSlots.length, currentFacilities.length]);

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

  // 범위 셀 ID 생성 헬퍼 함수 (시설 검증 포함)
  const generateRangeCellIds = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const cellIds = generateCellRange(startRow, endRow, startCol, endCol);
      // 유효한 시설만 필터링
      const validCellIds = new Set<string>();
      const facilityCount = currentFacilities.length;
      cellIds.forEach((cellId) => {
        const [, colStr] = cellId.split("-");
        const col = parseInt(colStr);
        if (col < facilityCount) {
          validCellIds.add(cellId);
        }
      });
      return validCellIds;
    },
    [currentFacilities.length]
  );

  // 범위 선택 함수
  const selectCellRange = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const rangeCells = generateRangeCellIds(
        startRow,
        startCol,
        endRow,
        endCol
      );
      setSelectedCells(rangeCells);
    },
    [generateRangeCellIds]
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
          const rangeCells = generateRangeCellIds(
            shiftSelectStart.row,
            shiftSelectStart.col,
            rowIndex,
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
    [shiftSelectStart, selectCellRange, generateRangeCellIds]
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

      setSelectedCells((prev) => {
        setDragState(
          createDragState(
            "cell",
            { row: rowIndex, col: colIndex },
            isAdditive,
            isAdditive ? new Set(prev) : null
          )
        );

        if (isAdditive) {
          // Cmd + 드래그: 기존 선택 유지하면서 현재 셀 추가
          return new Set([...prev, cellId]);
        } else {
          // 일반 드래그: 새로 선택 (기존 선택 해제)
          return new Set([cellId]);
        }
      });
      setShiftSelectStart({ row: rowIndex, col: colIndex });
    },
    [handleCellClick]
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
        const rangeCells = generateRangeCellIds(
          dragState.start.row,
          dragState.start.col,
          rowIndex,
          colIndex
        );

        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCells,
          ]);
          setSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setSelectedCells(rangeCells);
        }
      }
    },
    [dragState, generateRangeCellIds]
  );

  const handleCellMouseUp = useCallback(() => {
    setDragState(resetDragState);
  }, []);

  // 전역 마우스업 이벤트
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragState(resetDragState);
    };

    // 🛡️ 패시브 리스너로 성능 최적화
    document.addEventListener("mouseup", handleGlobalMouseUp, {
      passive: true,
    });
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // 열 전체 선택/해제 핸들러 (클릭용)
  const handleColumnClick = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedCol !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 열부터 현재 열까지)
        const rangeCellIds = generateColumnRange(
          lastSelectedCol,
          colIndex,
          timeSlots.length
        );
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 열의 모든 셀 ID 생성
        const columnCellIds = generateColumnCells(colIndex, timeSlots.length);

        setSelectedCells((prev) =>
          toggleCellIds(columnCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 열 기록
      setLastSelectedCol(colIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: 0, col: colIndex });
    },
    [timeSlots.length, lastSelectedCol]
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
      const columnCellIds = generateColumnCells(colIndex, timeSlots.length);

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
    [timeSlots.length, handleColumnClick]
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
        const rangeCellIds = generateColumnRange(
          dragState.start.col,
          colIndex,
          timeSlots.length
        );

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
    [dragState, timeSlots.length]
  );

  const handleColumnMouseUp = useCallback(() => {
    setDragState(resetDragState);
  }, []);

  // 행 전체 선택/해제 핸들러 (클릭용)
  const handleRowClick = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedRow !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 행부터 현재 행까지)
        const rangeCellIds = generateRowRange(
          lastSelectedRow,
          rowIndex,
          currentFacilities.length
        );
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 행의 모든 셀 ID 생성
        const rowCellIds = generateRowCells(rowIndex, currentFacilities.length);

        setSelectedCells((prev) =>
          toggleCellIds(rowCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 행 기록
      setLastSelectedRow(rowIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: rowIndex, col: 0 });
    },
    [currentFacilities.length, lastSelectedRow]
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
      const rowCellIds = generateRowCells(rowIndex, currentFacilities.length);

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
    [currentFacilities.length, handleRowClick]
  );

  const handleRowMouseEnter = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      if (dragState.isActive && dragState.type === "row" && dragState.start) {
        e.preventDefault();

        // 드래그 범위의 모든 행 선택
        const rangeCellIds = generateRowRange(
          dragState.start.row,
          rowIndex,
          currentFacilities.length
        );

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
    [dragState, currentFacilities.length]
  );

  const handleRowMouseUp = useCallback(() => {
    setDragState(resetDragState);
  }, []);

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
    [selectedCells, contextMenu.show, disabledCells] // contextMenu.show, disabledCells 의존성 추가
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
    setSelectedCells(new Set());
    setCellBadges({});
    setContextMenu({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });
    setShiftSelectStart(null);
    setLastSelectedRow(null);
    setLastSelectedCol(null);
    setDragState(resetDragState);
    setSearchTerms({}); // 🔍 검색어도 초기화
    setDisabledCells(new Set()); // 🚫 비활성화 상태도 초기화
  }, [selectedProcessIndex, selectedZone]);

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
        <DropdownMenu
          open={contextMenu.show}
          onOpenChange={(open) =>
            setContextMenu((prev) => ({
              ...prev,
              show: open,
              targetCells: open ? prev.targetCells || [] : [],
            }))
          }
          modal={false}
        >
          {/* Invisible trigger positioned at mouse coordinates */}
          <DropdownMenuTrigger
            style={{
              position: "fixed",
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
          <DropdownMenuContent
            side="right"
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => {
              setContextMenu({
                show: false,
                cellId: "",
                targetCells: [],
                x: 0,
                y: 0,
              });
            }}
            onPointerDownOutside={(e) => {
              setContextMenu({
                show: false,
                cellId: "",
                targetCells: [],
                x: 0,
                y: 0,
              });
            }}
          >
            {/* Selected cells count info */}
            {(contextMenu.targetCells?.length || 0) > 1 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Apply to {contextMenu.targetCells?.length || 0} selected cells
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Select All option */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleSelectAllCategories();
              }}
              className="cursor-pointer"
            >
              <div className="flex w-full items-center gap-2">
                <Star size={16} className="text-primary" />
                <span className="font-medium">Select All</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {getCategoryGroups().map((group, groupIndex) => (
              <React.Fragment key={group.title}>
                {/* 🏷️ 그룹 제목 */}
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                  {group.title}
                </div>

                {/* 📋 그룹 내 카테고리들 */}
                {group.categories.map((category) => {
                  // Process 그룹인 경우 categoryConfigs 사용, 아니면 CONDITION_CATEGORIES 사용
                  const config =
                    group.categoryConfigs?.[category] ||
                    CONDITION_CATEGORIES[category];
                  const filteredOptions = getFilteredAndSortedOptions(
                    category,
                    config.options
                  );
                  const searchTerm = searchTerms[category] || "";

                  return (
                    <DropdownMenuSub key={category}>
                      <DropdownMenuSubTrigger>
                        <span className="flex items-center gap-2">
                          <config.icon size={16} className={config.textColor} />
                          <span>{category}</span>
                          {config.options.length > 10 && (
                            <span className="text-xs opacity-60">
                              ({config.options.length})
                            </span>
                          )}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-80 w-64 overflow-hidden">
                        {/* 🔍 검색 입력창 */}
                        <div className="p-2 border-b border-border">
                          <Input
                            placeholder={`Search ${category.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) =>
                              handleSearchTermChange(category, e.target.value)
                            }
                            className="h-8 text-sm"
                            autoFocus={false}
                            onKeyDown={(e) => {
                              // 검색창에서 Enter 키 등의 이벤트가 부모로 전파되지 않도록 방지
                              e.stopPropagation();
                            }}
                          />
                        </div>

                        {/* 📝 결과 카운트 */}
                        {searchTerm && (
                          <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border">
                            {filteredOptions.length} of {config.options.length}{" "}
                            results
                          </div>
                        )}

                        {/* 📋 옵션 목록 */}
                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {filteredOptions.length > 0 ? (
                            <>
                              {filteredOptions.map((option) => {
                                const checkState = getOptionCheckState(
                                  category,
                                  option
                                );
                                return (
                                  <DropdownMenuItem
                                    key={option}
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleToggleBadgeOption(category, option);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex w-full items-center gap-2">
                                      <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-border">
                                        {checkState === true && (
                                          <svg
                                            className="h-3 w-3 text-primary"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        )}
                                        {checkState === "indeterminate" && (
                                          <div className="h-2 w-2 rounded-sm bg-primary"></div>
                                        )}
                                      </div>
                                      <span className="truncate">{option}</span>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  // 현재 필터링된 옵션들에 대해서만 토글
                                  filteredOptions.forEach((option) => {
                                    handleToggleBadgeOption(category, option);
                                  });
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex w-full items-center gap-2">
                                  <span>
                                    Toggle All Visible ({filteredOptions.length}
                                    )
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No results found
                            </div>
                          )}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                })}

                {/* 🔹 그룹 구분선 (마지막 그룹 제외) */}
                {groupIndex < getCategoryGroups().length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleClearAllBadges();
              }}
              className="cursor-pointer"
            >
              <div className="flex w-full items-center gap-2 text-red-600">
                <Trash2 size={16} />
                <span>Clear All Badges</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
          selectedCells={selectedCells}
          cellBadges={cellBadges}
          disabledCells={disabledCells}
          isFullScreen={false}
          handleTimeHeaderClick={handleTimeHeaderClick}
          handleTimeHeaderRightClick={handleTimeHeaderRightClick}
          handleColumnMouseDown={handleColumnMouseDown}
          handleColumnMouseEnter={handleColumnMouseEnter}
          handleColumnMouseUp={handleColumnMouseUp}
          handleColumnRightClick={handleColumnRightClick}
          handleRowMouseDown={handleRowMouseDown}
          handleRowMouseEnter={handleRowMouseEnter}
          handleRowMouseUp={handleRowMouseUp}
          handleRowRightClick={handleRowRightClick}
          handleCellMouseDown={handleCellMouseDown}
          handleCellMouseEnter={handleCellMouseEnter}
          handleCellMouseUp={handleCellMouseUp}
          handleCellRightClick={handleCellRightClick}
          handleRemoveCategoryBadge={handleRemoveCategoryBadge}
          cn={cn}
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
                selectedCells={selectedCells}
                cellBadges={cellBadges}
                disabledCells={disabledCells}
                isFullScreen={true}
                handleTimeHeaderClick={handleTimeHeaderClick}
                handleTimeHeaderRightClick={handleTimeHeaderRightClick}
                handleColumnMouseDown={handleColumnMouseDown}
                handleColumnMouseEnter={handleColumnMouseEnter}
                handleColumnMouseUp={handleColumnMouseUp}
                handleColumnRightClick={handleColumnRightClick}
                handleRowMouseDown={handleRowMouseDown}
                handleRowMouseEnter={handleRowMouseEnter}
                handleRowMouseUp={handleRowMouseUp}
                handleRowRightClick={handleRowRightClick}
                handleCellMouseDown={handleCellMouseDown}
                handleCellMouseEnter={handleCellMouseEnter}
                handleCellMouseUp={handleCellMouseUp}
                handleCellRightClick={handleCellRightClick}
                handleRemoveCategoryBadge={handleRemoveCategoryBadge}
                cn={cn}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
