import { useEffect, useRef } from "react";
import { useSimulationStore } from "../../../_stores";
import type { FacilityWithSchedule } from "../schedule-editor/types";
import {
  calculatePeriodsFromDisabledCells,
  deepEqual,
} from "../schedule-editor/helpers";
import { useScheduleInitialization } from "./useScheduleInitialization";
import type { ProcessStep } from "@/types/simulationTypes";

interface UseNormalizeAllSchedulesProps {
  timeSlots: string[];
  isPreviousDay: boolean;
  appliedTimeUnit: number;
  processFlow: ProcessStep[];
  isTimeSlotsFromChartData: boolean;
}

/**
 * 모든 프로세스의 모든 zone에 대해 time_blocks의 period를
 * 현재 timeSlots 범위에 맞게 정규화하는 훅.
 *
 * 문제 상황:
 *   useFacilityScheduleSync는 "현재 선택된 zone"만 재계산하므로,
 *   사용자가 열어보지 않은 zone의 period가 과거 timeSlots 기준으로
 *   남아있을 수 있다 (예: 21:00이어야 할 것이 20:30으로 남음).
 *
 * 해결:
 *   timeSlots가 확정되면 모든 zone의 time_blocks를 grid 기반으로
 *   초기화 → 재계산하여 일관성을 보장한다.
 */
export function useNormalizeAllSchedules({
  timeSlots,
  isPreviousDay,
  appliedTimeUnit,
  processFlow,
  isTimeSlotsFromChartData,
}: UseNormalizeAllSchedulesProps) {
  const { initializeDisabledCellsFromPeriods } = useScheduleInitialization();
  const lastSignatureRef = useRef("");

  useEffect(() => {
    if (!timeSlots || timeSlots.length === 0 || processFlow.length === 0) {
      return;
    }

    // chartResult가 로드되지 않은 상태의 기본 timeSlots(00:00~24:00)로
    // 정규화하면 이전 날짜 기반 period가 훼손될 수 있으므로 스킵
    if (!isTimeSlotsFromChartData) {
      return;
    }

    // timeSlots 범위 또는 zone/facility 구조가 바뀔 때만 실행 (불필요한 재실행 방지)
    const zoneCount = processFlow.reduce(
      (acc, p) => acc + Object.keys(p.zones || {}).length,
      0
    );
    const facilityCount = processFlow.reduce(
      (acc, p) =>
        acc +
        Object.values(p.zones || {}).reduce(
          (zacc: number, z: any) => zacc + (z.facilities?.length || 0),
          0
        ),
      0
    );
    const signature = `${timeSlots[0]}|${timeSlots[timeSlots.length - 1]}|${timeSlots.length}|${isPreviousDay}|${appliedTimeUnit}|${zoneCount}|${facilityCount}`;
    if (lastSignatureRef.current === signature) {
      return;
    }
    lastSignatureRef.current = signature;

    const storeState = useSimulationStore.getState();
    const contextDate =
      storeState.context?.date || new Date().toISOString().split("T")[0];
    const prevDay = new Date(contextDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().split("T")[0];

    let totalNormalized = 0;

    processFlow.forEach((process, processIndex) => {
      if (!process.zones) return;

      Object.entries(process.zones).forEach(([zoneName, zone]) => {
        const facilities: FacilityWithSchedule[] =
          (zone as any).facilities || [];
        if (facilities.length === 0) return;

        // 스케줄이 있는 facility가 하나도 없으면 스킵
        const hasSchedule = facilities.some(
          (f) =>
            f.operating_schedule?.time_blocks &&
            f.operating_schedule.time_blocks.length > 0
        );
        if (!hasSchedule) return;

        // 1단계: 기존 time_blocks → grid 상태로 초기화
        const { disabledCells, badges, processTimes } =
          initializeDisabledCellsFromPeriods(
            facilities,
            timeSlots,
            isPreviousDay,
            contextDate,
            prevDayStr
          );

        // 2단계: grid 상태 → 정규화된 time_blocks로 재계산
        facilities.forEach((facility, facilityIndex) => {
          const existingBlocks =
            facility.operating_schedule?.time_blocks || [];
          if (existingBlocks.length === 0) return;

          const normalizedBlocks = calculatePeriodsFromDisabledCells(
            facilityIndex,
            disabledCells,
            timeSlots,
            existingBlocks,
            badges,
            processTimes,
            process.process_time_seconds ?? undefined,
            appliedTimeUnit,
            contextDate,
            isPreviousDay
          );

          // 변경된 경우에만 store 업데이트
          if (!deepEqual(existingBlocks, normalizedBlocks)) {
            const { updateFacilitySchedule } =
              useSimulationStore.getState();
            updateFacilitySchedule(
              processIndex,
              zoneName,
              facility.id,
              normalizedBlocks
            );
            totalNormalized++;
          }
        });
      });
    });

    if (totalNormalized > 0) {
      console.log(
        `[useNormalizeAllSchedules] ${totalNormalized}개 facility의 time_blocks를 현재 timeSlots 범위로 정규화 완료`
      );
    }
  }, [
    timeSlots,
    isPreviousDay,
    appliedTimeUnit,
    processFlow,
    initializeDisabledCellsFromPeriods,
  ]);
}
