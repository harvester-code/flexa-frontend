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
import { useBadgeHandlers } from "./hooks/useBadgeHandlers";
import { useKeyboardHandlers } from "./hooks/useKeyboardHandlers";
import { useUndoRedoHandlers } from "./hooks/useUndoRedoHandlers";
import { useContextMenuHandlers } from "./hooks/useContextMenuHandlers";
import { useSelectionHandlers } from "./hooks/useSelectionHandlers";
import { ScheduleContextMenu } from "./ScheduleContextMenu";
import {
  Clock,
  Expand,
  Globe,
  MapPin,
  Navigation,
  Plane,
  Users,
} from "lucide-react";
import { ProcessStep } from "@/types/simulationTypes";
import { Button } from "@/components/ui/Button";
import {
  ParquetMetadataItem,
  OperatingScheduleEditorProps,
  BadgeCondition,
  CategoryBadge,
  TimeBlock,
  FacilityWithSchedule,
  TableHandlers,
  VirtualScrollConfig,
  ExcelTableProps,
} from "./schedule-editor/types";
import {
  createDynamicConditionCategories,
  deepEqual,
  formatTime,
  getNextTimeSlot,
  parsePeriodSafe,
  calculatePeriodsFromDisabledCells,
} from "./schedule-editor/helpers";
import ExcelTable from "./schedule-editor/ExcelTable";
import { useCopyPaste } from "./hooks/useCopyPaste";
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

// 상수들

// ROW_HEIGHT와 VIEWPORT_HEIGHT 상수들
const ROW_HEIGHT = 60; // 각 행의 높이 (픽셀)
const VIEWPORT_HEIGHT = 500; // 보이는 영역 높이 (기본값)
const BUFFER_SIZE = 3; // 앞뒤로 추가 렌더링할 행 수 (부드러운 스크롤)

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
  const [timeUnitInput, setTimeUnitInput] = useState<string>("30");
  const [appliedTimeUnit, setAppliedTimeUnit] = useState<number>(30);
  const [pendingTimeUnit, setPendingTimeUnit] = useState<number | null>(null);
  const [showTimeUnitConfirm, setShowTimeUnitConfirm] = useState(false);

  // 뱃지 상태 관리 - Zone별로 저장하여 탭 전환 시에도 유지
  const [allZoneBadges, setAllZoneBadges] = useState<
    Record<string, Record<string, CategoryBadge[]>>
  >({});

  // 비활성화된 셀 상태 관리 - Zone별로 저장하여 탭 전환 시에도 유지
  const [allZoneDisabledCells, setAllZoneDisabledCells] = useState<
    Record<string, Set<string>>
  >({});

  // 마지막으로 저장된 시설 데이터의 해시값 (변경 감지용)
  const [lastFacilitiesHash, setLastFacilitiesHash] = useState<string>("");

  // 현재 Zone의 키
  const zoneKey = useMemo(
    () => `${selectedProcessIndex}-${selectedZone}`,
    [selectedProcessIndex, selectedZone]
  );

  // 현재 Zone의 뱃지 가져오기 (메모이제이션으로 최적화)
  const cellBadges = useMemo(
    () => allZoneBadges[zoneKey] || {},
    [allZoneBadges, zoneKey]
  );

  // 현재 Zone의 비활성화된 셀 가져오기 (메모이제이션으로 최적화)
  const disabledCells = useMemo(
    () => allZoneDisabledCells[zoneKey] || new Set<string>(),
    [allZoneDisabledCells, zoneKey]
  );

  // 현재 Zone의 뱃지 업데이트 함수 (안전한 업데이트)
  const setCellBadges = useCallback(
    (updater: any) => {
      setAllZoneBadges((prev) => {
        const newBadges =
          typeof updater === "function"
            ? updater(prev[zoneKey] || {})
            : updater;
        // 변경사항이 있을 때만 업데이트
        if (!deepEqual(prev[zoneKey], newBadges)) {
          return {
            ...prev,
            [zoneKey]: newBadges,
          };
        }
        return prev;
      });
    },
    [zoneKey]
  );

  // 현재 Zone의 비활성화된 셀 업데이트 함수 (안전한 업데이트)
  const setDisabledCells = useCallback(
    (updater: any) => {
      setAllZoneDisabledCells((prev) => {
        const currentSet = prev[zoneKey] || new Set<string>();
        const newSet =
          typeof updater === "function" ? updater(currentSet) : updater;

        // Set 비교를 위한 헬퍼
        const areSetsEqual = (a: Set<string>, b: Set<string>) => {
          if (a.size !== b.size) return false;
          for (const item of a) {
            if (!b.has(item)) return false;
          }
          return true;
        };

        // 변경사항이 있을 때만 업데이트
        if (!areSetsEqual(currentSet, newSet)) {
          return {
            ...prev,
            [zoneKey]: newSet,
          };
        }
        return prev;
      });
    },
    [zoneKey]
  );

  // 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    cellId: string;
    targetCells: string[];
    x: number;
    y: number;
  }>({ show: false, cellId: "", targetCells: [], x: 0, y: 0 });


  // 초기 로드 상태 추적 - processIndex와 zone별로 추적
  const [initializedKeys, setInitializedKeys] = useState<Set<string>>(
    new Set()
  );

  // period 문자열을 disabled cells로 변환하는 함수 (타입 안전성 향상)
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

              // 안전한 period 파싱 사용
              const parsedPeriod = parsePeriodSafe(block.period);

              if (!parsedPeriod.valid) {
                console.error("Failed to parse period:", block.period);
                // 파싱 실패 시에도 데이터를 보존하기 위해 전체 활성화로 폴백
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

              // 여러 날에 걸친 period 처리
              const nextDayStr = new Date(new Date(date).getTime() + 86400000)
                .toISOString()
                .split("T")[0];

              // Period가 현재 표시 날짜 범위에 포함되는지 확인
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

              // Period가 전체 시간대를 포함하는지 확인 (2일 이상 걸쳐진 period)
              const isFullPeriod =
                periodStartDate <= prevDateObj &&
                periodEndDate >= currentDateObj;

              if (isFullPeriod) {
                // 전체 시간대 활성화
                console.log(
                  "Full period detected - activating all cells for facility:",
                  facility.id
                );
                for (let i = 0; i < timeSlots.length; i++) {
                  activatedSlots.add(i);
                }
              } else {
                // 부분적인 period 처리
                if (isPreviousDay) {
                  // D-1 표시가 있을 때
                  if (startDate <= prevDayStr && endDate >= prevDayStr) {
                    // 전날 포함
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

                  // 당일 처리
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
                  // D-1 표시가 없을 때
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

              // passenger_conditions가 있으면 해당 period의 모든 활성 셀에 뱃지 설정
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
                    const badgeColor = getBadgeColor(categoryConfig.colorIndex);
                    badges.push({
                      category: categoryName,
                      options: condition.values || [],
                      colorIndex: categoryConfig.colorIndex,
                      style: badgeColor.style,
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

                  // 해당 period에 속하는 모든 셀에 뱃지 적용
                  const startIdx = timeSlots.indexOf(startTime);
                  let endIdx = timeSlots.indexOf(endTime);

                  // endTime이 정확히 일치하지 않으면 timeUnit 기반으로 계산
                  if (endIdx === -1 || endIdx <= startIdx) {
                    // timeUnit을 고려한 정확한 인덱스 계산
                    const [endHour, endMin] = endTime.split(":").map(Number);
                    const timeUnit = timeSlots[1]
                      ? (parseInt(timeSlots[1].split(":")[1]) -
                          parseInt(timeSlots[0].split(":")[1]) +
                          60) %
                          60 || 30
                      : 30;

                    // 이전 시간 슬롯 계산
                    let prevMin = endMin - timeUnit;
                    let prevHour = endHour;
                    if (prevMin < 0) {
                      prevMin += 60;
                      prevHour -= 1;
                    }

                    const prevEndTime = `${String(prevHour).padStart(2, "0")}:${String(prevMin).padStart(2, "0")}`;
                    endIdx = timeSlots.indexOf(prevEndTime) + 1;

                    // 그래도 못 찾으면 가장 가까운 인덱스 찾기
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
                      // activatedSlots에 포함된 셀에만 뱃지 추가 (비활성화된 셀 제외)
                      if (
                        activatedSlots.has(i) &&
                        !newDisabledCells.has(cellId)
                      ) {
                        // 기존 뱃지가 있으면 병합, 없으면 새로 추가
                        if (newBadges[cellId]) {
                          // 중복 제거하며 병합
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
    },
    []
  );

  // field name을 category name으로 변환하는 헬퍼 함수
  const getCategoryNameFromField = (field: string): string => {
    const fieldToCategoryMap: Record<string, string> = {
      operating_carrier_name: "Airline",
      operating_carrier_iata: "Airline",
      aircraft_type: "Aircraft Type",
      flight_type: "Flight Type",
      arrival_airport_iata: "Arrival Airport",
      arrival_city: "Arrival City",
      arrival_country: "Arrival Country",
      arrival_region: "Arrival Region",
      nationality: "Nationality",
      profile: "Passenger Type",
    };
    return fieldToCategoryMap[field] || "";
  };

  // category name을 field name으로 변환하는 헬퍼 함수
  const getCategoryFieldName = (category: string): string => {
    const categoryToFieldMap: Record<string, string> = {
      Airline: "operating_carrier_iata",
      "Aircraft Type": "aircraft_type",
      "Flight Type": "flight_type",
      "Arrival Airport": "arrival_airport_iata",
      "Arrival City": "arrival_city",
      "Arrival Country": "arrival_country",
      "Arrival Region": "arrival_region",
      Nationality: "nationality",
      "Passenger Type": "profile",
    };
    return categoryToFieldMap[category] || "";
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
      let totalPassengersByTime: number[] = new Array(
        chartResult.chart_x_data.length
      ).fill(0);

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
      const firstPassengerIndex = totalPassengersByTime.findIndex(
        (count) => count > 0
      );
      const lastPassengerIndex = totalPassengersByTime.findLastIndex(
        (count) => count > 0
      );

      if (firstPassengerIndex !== -1 && lastPassengerIndex !== -1) {
        // 시작 시간 30분 단위 내림
        const startDateTime = chartResult.chart_x_data[firstPassengerIndex];
        const [startDate, startTime] = startDateTime.split(" ");
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const roundedStartMinute = Math.floor(startMinute / 30) * 30;
        const roundedStartHour = startHour;

        // 종료 시간 처리
        const endDateTime =
          chartResult.chart_x_data[
            Math.min(
              lastPassengerIndex + 1,
              chartResult.chart_x_data.length - 1
            )
          ];
        const [endDate, endTime] = endDateTime.split(" ");
        const [endHour] = endTime.split(":").map(Number);

        // 시작이 전날인지 확인
        const currentDate =
          contextDate || new Date().toISOString().split("T")[0];
        isPrev = startDate < currentDate;

        // 전날 시간부터 시작하는 경우
        if (isPrev) {
          // 전날 시간 추가
          for (let hour = roundedStartHour; hour < 24; hour++) {
            const minuteStart =
              hour === roundedStartHour ? roundedStartMinute : 0;
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
          const minuteStart =
            hour === startHourForToday && !isPrev ? startMinuteForToday : 0;
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

  // Copy/Paste functionality using custom hook
  const {
    copiedData,
    showMarchingAnts,
    copiedCells,
    showPasteWarning,
    pendingPasteData,
    setCopiedData,
    setShowMarchingAnts,
    setShowPasteWarning,
    setPendingPasteData,
    handleCopy,
    handlePaste,
    executePaste,
  } = useCopyPaste({
    selectedCells,
    cellBadges,
    disabledCells,
    timeSlots,
    currentFacilities,
    setCellBadges,
    setDisabledCells,
    undoHistory,
  });

  // 빈 스크롤 핸들러 (가상화 비활성화로 더 이상 필요 없음)
  const handleScroll = useCallback(() => {
    // 가상화가 비활성화되었으므로 아무것도 하지 않음
  }, []);

  // Undo/Redo handlers 훅 사용
  const { handleUndo, handleRedo } = useUndoRedoHandlers({
    undoHistory,
    setDisabledCells,
    setCellBadges,
  });

  // Context Menu handlers 훅 사용
  const {
    handleCellRightClick,
    handleRowRightClick,
    handleColumnRightClick,
    handleTimeHeaderRightClick,
  } = useContextMenuHandlers({
    selectedCells,
    setSelectedCells,
    setContextMenu,
    generateRowCells,
    generateColumnCells,
    generateAllCells,
  });

  // Selection handlers 훅 사용
  const {
    selectCellRange,
    handleTimeHeaderClick,
    handleCellClick,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    handleColumnClick,
    handleColumnMouseDown,
    handleColumnMouseEnter,
    handleColumnMouseUp,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseEnter,
    handleRowMouseUp,
  } = useSelectionHandlers({
    selectedCells,
    setSelectedCells,
    setTempSelectedCells,
    shiftSelectStart,
    setShiftSelectStart,
    lastSelectedRow,
    setLastSelectedRow,
    lastSelectedCol,
    setLastSelectedCol,
    dragState,
    setDragState,
    createDragState,
    finalizeDrag,
    generateCellRange,
    generateRowCells,
    generateColumnCells,
    generateRowRange,
    generateColumnRange,
    generateAllCells,
    toggleCellIds,
  });

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

  // Badge handlers 훅 사용
  const {
    handleToggleBadgeOption,
    handleRemoveCategoryBadge,
    handleClearAllBadges,
    handleSelectAllCategories,
    getProcessCategoryConfig,
  } = useBadgeHandlers({
    contextMenu,
    cellBadges,
    setCellBadges,
    undoHistory,
    CONDITION_CATEGORIES,
    selectedProcessIndex,
    processFlow,
  });


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




  // Keyboard handlers 훅 사용
  const { handleKeyDown } = useKeyboardHandlers({
    selectedCells,
    displaySelectedCells,
    contextMenu,
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
    containerRef,
  });


  // 🎯 포커스 관리 (한 번만 등록, 이벤트 리스너 누적 방지)
  useEffect(() => {
    const ensureFocus = () => {
      // input, textarea, select 등 form 요소가 포커스를 가지고 있으면 containerRef로 포커스를 옮기지 않음
      const activeElement = document.activeElement;
      const isFormElement =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.getAttribute("contenteditable") === "true");

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
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
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
      const hasExistingSchedule = currentFacilities.some(
        (f) => f.operating_schedule?.time_blocks?.length > 0
      );

      console.log("ScheduleEditor initialization check:", {
        processIndex: selectedProcessIndex,
        zone: selectedZone,
        hasExistingSchedule,
        facilities: currentFacilities.length,
        firstFacility: currentFacilities[0],
      });

      if (hasExistingSchedule) {
        // 기존 schedule로부터 초기화 - 날짜 미리 계산
        const currentDate =
          useSimulationStore.getState().context.date ||
          new Date().toISOString().split("T")[0];
        const prevDay = new Date(currentDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split("T")[0];

        console.log("Initializing from existing schedule data");
        const { disabledCells: initDisabledCells, badges: initBadges } =
          initializeDisabledCellsFromPeriods(
            currentFacilities,
            timeSlots,
            isPreviousDay,
            CONDITION_CATEGORIES,
            currentDate,
            prevDayStr
          );

        console.log("Initialized cells:", {
          disabledCount: initDisabledCells.size,
          badgeCount: Object.keys(initBadges).length,
        });

        setDisabledCells(initDisabledCells);
        setCellBadges(initBadges);
        setInitializedKeys((prev) => new Set([...prev, initKey]));
        return;
      }
      setInitializedKeys((prev) => new Set([...prev, initKey]));
    }

    // 초기화가 완료된 후에만 업데이트 진행
    if (!initializedKeys.has(initKey)) {
      return; // 초기화 전에는 zustand 업데이트 하지 않음
    }

    // 즉시 업데이트 (debounce 제거로 데이터 무결성 보장)
    // 각 시설별로 period 재계산
    currentFacilities.forEach((facility, facilityIndex) => {
      if (facility && facility.id) {
        const existingTimeBlocks =
          facility.operating_schedule?.time_blocks || [];

        // 현재 프로세스의 process_time_seconds 값 가져오기
        const currentProcess =
          selectedProcessIndex !== null
            ? processFlow[selectedProcessIndex]
            : null;
        const processTimeSeconds = (currentProcess as any)
          ?.process_time_seconds;

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

        // Deep equality 체크로 정확한 변경 감지
        const hasChanged = !deepEqual(existingTimeBlocks, newTimeBlocks);

        if (hasChanged) {
          // Zustand store 즉시 업데이트
          const { updateFacilitySchedule } =
            useSimulationStore.getState() as any;
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
    initializeDisabledCellsFromPeriods,
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
                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                    setTimeUnitInput(numericValue);
                  }}
                  onKeyDown={(e) => {
                    // 키보드 이벤트가 테이블 단축키와 충돌하지 않도록 전파 중단
                    e.stopPropagation();

                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = parseInt(timeUnitInput) || 30;
                      const clampedValue = Math.max(1, Math.min(60, value));

                      // 값이 변경되었을 때만 처리
                      if (clampedValue !== appliedTimeUnit) {
                        // 데이터가 있으면 확인 다이얼로그 표시
                        if (
                          Object.keys(cellBadges).length > 0 ||
                          disabledCells.size > 0
                        ) {
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
        <AlertDialog
          open={showTimeUnitConfirm}
          onOpenChange={setShowTimeUnitConfirm}
        >
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
              <AlertDialogCancel
                onClick={() => {
                  setTimeUnitInput(appliedTimeUnit.toString());
                  setPendingTimeUnit(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingTimeUnit) {
                    setAppliedTimeUnit(pendingTimeUnit);
                    setTimeUnitInput(pendingTimeUnit.toString());
                    // Clear data if exists
                    if (
                      Object.keys(cellBadges).length > 0 ||
                      disabledCells.size > 0
                    ) {
                      setCellBadges({});
                      setDisabledCells(new Set<string>());
                    }
                    setPendingTimeUnit(null);
                  }
                }}
              >
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
                Do you want to continue? The pattern will be repeated to fill
                the selection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPendingPasteData(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingPasteData) {
                    executePaste(
                      pendingPasteData.targetCells,
                      pendingPasteData.copiedData
                    );
                    setPendingPasteData(null);
                  }
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}