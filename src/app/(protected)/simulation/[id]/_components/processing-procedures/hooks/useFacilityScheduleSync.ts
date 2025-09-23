import { useEffect } from "react";
import { useSimulationStore } from "../../../_stores";
import { FacilityWithSchedule } from "../schedule-editor/types";
import { calculatePeriodsFromDisabledCells, deepEqual } from "../schedule-editor/helpers";

interface UseFacilityScheduleSyncProps {
  currentFacilities: FacilityWithSchedule[];
  selectedZone: string | null;
  selectedProcessIndex: number | null;
  initializedKeys: Set<string>;
  setInitializedKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  timeSlots: string[];
  isPreviousDay: boolean;
  CONDITION_CATEGORIES: Record<string, any>;
  initializeDisabledCellsFromPeriods: (
    facilities: FacilityWithSchedule[],
    timeSlots: string[],
    isPreviousDay: boolean,
    categories: Record<string, any>,
    currentDate: string,
    prevDayStr: string
  ) => {
    disabledCells: Set<string>;
    badges: Record<string, any[]>;
  };
  disabledCells: Set<string>;
  setDisabledCells: (cells: Set<string>) => void;
  cellBadges: Record<string, any[]>;
  setCellBadges: (badges: Record<string, any[]>) => void;
  appliedTimeUnit: number;
  processFlow: any[];
}

export function useFacilityScheduleSync({
  currentFacilities,
  selectedZone,
  selectedProcessIndex,
  initializedKeys,
  setInitializedKeys,
  timeSlots,
  isPreviousDay,
  CONDITION_CATEGORIES,
  initializeDisabledCellsFromPeriods,
  disabledCells,
  setDisabledCells,
  cellBadges,
  setCellBadges,
  appliedTimeUnit,
  processFlow,
}: UseFacilityScheduleSyncProps) {
  // Sync facility schedules with store
  useEffect(() => {
    if (!currentFacilities || currentFacilities.length === 0) return;
    if (!selectedZone || selectedProcessIndex === null) return;

    // Create unique key for this process-zone combination
    const initKey = `${selectedProcessIndex}-${selectedZone}`;

    // Skip update if not initialized yet for this specific process-zone
    if (!initializedKeys.has(initKey)) {
      // Always try to initialize from existing schedule data
      const hasExistingSchedule = currentFacilities.some(
        (f) => f.operating_schedule?.time_blocks && f.operating_schedule.time_blocks.length > 0
      );

      console.log("ScheduleEditor initialization check:", {
        processIndex: selectedProcessIndex,
        zone: selectedZone,
        hasExistingSchedule,
        facilities: currentFacilities.length,
        firstFacility: currentFacilities[0],
      });

      if (hasExistingSchedule) {
        // Initialize from existing schedule - calculate dates in advance
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
            : null;
        const processTimeSeconds = (currentProcess as any)
          ?.process_time_seconds;

        // Calculate new periods (including badge info, pass date)
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

        // Detect exact changes with deep equality check
        const hasChanged = !deepEqual(existingTimeBlocks, newTimeBlocks);

        if (hasChanged) {
          // Update Zustand store immediately
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
  ]); // All necessary dependencies included
}