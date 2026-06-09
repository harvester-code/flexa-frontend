import { useEffect, useRef } from "react";
import { useSimulationStore } from "../../../_stores";
import { FacilityWithSchedule, CategoryBadge } from "../schedule-editor/types";
import { calculatePeriodsFromDisabledCells, deepEqual } from "../schedule-editor/helpers";
import type { ProcessStep } from "@/types/simulationTypes";

interface UseFacilityScheduleSyncProps {
  currentFacilities: FacilityWithSchedule[];
  selectedZone: string | null;
  selectedProcessIndex: number | null;
  initializedKeys: Set<string>;
  setInitializedKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  timeSlots: string[];
  isPreviousDay: boolean;
  initializeDisabledCellsFromPeriods: (
    facilities: FacilityWithSchedule[],
    timeSlots: string[],
    isPreviousDay: boolean,
    currentDate: string,
    prevDayStr: string
  ) => {
    disabledCells: Set<string>;
    badges: Record<string, CategoryBadge[]>;
    processTimes: Record<string, number>;
  };
  disabledCells: Set<string>;
  setDisabledCells: (cells: Set<string>) => void;
  cellBadges: Record<string, CategoryBadge[]>;
  setCellBadges: (badges: Record<string, CategoryBadge[]>) => void;
  cellProcessTimes: Record<string, number>;
  setCellProcessTimes: (processTimes: Record<string, number>) => void;
  appliedTimeUnit: number;
  processFlow: ProcessStep[];
  facilityPresetVersion?: number;
}

export function useFacilityScheduleSync({
  currentFacilities,
  selectedZone,
  selectedProcessIndex,
  initializedKeys,
  setInitializedKeys,
  timeSlots,
  isPreviousDay,
  initializeDisabledCellsFromPeriods,
  disabledCells,
  setDisabledCells,
  cellBadges,
  setCellBadges,
  cellProcessTimes,
  setCellProcessTimes,
  appliedTimeUnit,
  processFlow,
  facilityPresetVersion = 0,
}: UseFacilityScheduleSyncProps) {
  const timeSlotSignatureRef = useRef<string>("");
  const lastPresetVersionRef = useRef<number>(facilityPresetVersion);

  // Sync facility schedules with store
  useEffect(() => {
    if (!currentFacilities || currentFacilities.length === 0) return;
    if (!selectedZone || selectedProcessIndex === null) return;

    const currentSignature = timeSlots.join("|");
    const timeSlotsChanged = timeSlotSignatureRef.current !== currentSignature;

    // Create unique key for this process-zone combination
    const initKey = `${selectedProcessIndex}-${selectedZone}`;

    // processFlow가 외부에서 갱신된 경우(조건 제거 등) stale UI 뱃지로 덮어쓰지 않도록 재초기화
    if (lastPresetVersionRef.current !== facilityPresetVersion) {
      lastPresetVersionRef.current = facilityPresetVersion;
      setInitializedKeys((prev) => {
        if (!prev.has(initKey)) return prev;
        const next = new Set(prev);
        next.delete(initKey);
        return next;
      });
    }
    const storeState = useSimulationStore.getState();
    const contextDate =
      storeState?.context?.date || new Date().toISOString().split("T")[0];

    // Skip update if not initialized yet for this specific process-zone
    if (!initializedKeys.has(initKey)) {
      // Always try to initialize from existing schedule data
      const hasExistingSchedule = currentFacilities.some(
        (f) => f.operating_schedule?.time_blocks && f.operating_schedule.time_blocks.length > 0
      );

      if (hasExistingSchedule) {
        // Initialize from existing schedule - calculate dates in advance
        const prevDay = new Date(contextDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split("T")[0];

        const { disabledCells: initDisabledCells, badges: initBadges, processTimes: initProcessTimes } =
          initializeDisabledCellsFromPeriods(
            currentFacilities,
            timeSlots,
            isPreviousDay,
            contextDate,
            prevDayStr
          );

        setDisabledCells(initDisabledCells);
        setCellBadges(initBadges);
        setCellProcessTimes(initProcessTimes);
        setInitializedKeys((prev) => new Set([...prev, initKey]));
        return;
      }
      setInitializedKeys((prev) => new Set([...prev, initKey]));
    }

    // Only proceed with updates after initialization is complete
    if (!initializedKeys.has(initKey)) {
      return; // Don't update zustand before initialization
    }

    // Immediate update (removed debounce to ensure data integrity)
    // Recalculate periods for each facility
    currentFacilities.forEach((facility, facilityIndex) => {
      if (facility && facility.id) {
        const existingTimeBlocks =
          facility.operating_schedule?.time_blocks || [];

        // Get process_time_seconds value for current process
        const currentProcess =
          selectedProcessIndex !== null
            ? processFlow[selectedProcessIndex]
            : undefined;
        const processTimeSeconds = currentProcess?.process_time_seconds ?? undefined;

        // Calculate new periods (including badge info, pass date)
        const newTimeBlocks = calculatePeriodsFromDisabledCells(
          facilityIndex,
          disabledCells,
          timeSlots,
          existingTimeBlocks,
          cellBadges,
          cellProcessTimes,
          processTimeSeconds ?? undefined,
          appliedTimeUnit,
          contextDate,
          isPreviousDay
        );

        // Detect exact changes with deep equality check
        const hasChanged = !deepEqual(existingTimeBlocks, newTimeBlocks);

        if (hasChanged || timeSlotsChanged) {
          // Update Zustand store immediately
          const { updateFacilitySchedule } = useSimulationStore.getState();
          updateFacilitySchedule(
            selectedProcessIndex,
            selectedZone,
            facility.id,
            newTimeBlocks
          );
        }
      }
    });
    timeSlotSignatureRef.current = currentSignature;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    disabledCells,
    cellBadges,
    cellProcessTimes,
    currentFacilities,
    selectedZone,
    selectedProcessIndex,
    initializedKeys,
    timeSlots,
    appliedTimeUnit,
    isPreviousDay,
    initializeDisabledCellsFromPeriods,
    facilityPresetVersion,
  ]); // All necessary dependencies included
}
