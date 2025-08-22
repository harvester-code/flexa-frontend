import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore } from '../../_store/useScenarioStore';
import { TAB_RESET_MAP, type TabName } from '../_constants/resetMap';

/**
 * 탭별 상태 초기화를 담당하는 Custom Hook
 *
 * 각 탭에서 데이터 변경 시 영향받는 하위 탭들의 상태를
 * 자동으로 초기화하는 기능을 제공합니다.
 */
export const useTabReset = () => {
  // zustand store에서 모든 reset 액션들을 가져옴
  const resetActions = useScenarioStore(
    useShallow((s) => ({
      resetPassengerSchedule: s.passengerSchedule.actions.resetState,
      resetFacilityConnection: s.facilityConnection.actions.resetState,
      resetFacilityCapacity: s.facilityCapacity.actions.resetState,
      resetScenarioOverview: s.scenarioOverview.actions.resetState,
      resetAirportProcessing: s.airportProcessing.actions.resetState,
    }))
  );

  /**
   * 지정된 탭에 따라 필요한 상태들을 초기화
   *
   * @param tabName - 데이터를 변경한 탭 이름
   * @param options - 추가 옵션
   * @param options.force - 강제 실행 여부 (기본값: false)
   * @param options.exclude - 제외할 상태들
   */
  const resetByTab = useCallback(
    (
      tabName: TabName,
      options: {
        force?: boolean;
        exclude?: string[];
      } = {}
    ) => {
      const { force = false, exclude = [] } = options;

      // Reset Map에서 해당 탭의 초기화 대상들 가져오기
      const resetTargets = TAB_RESET_MAP[tabName];

      if (!resetTargets || resetTargets.length === 0) {
        return; // 초기화할 대상이 없으면 종료
      }

      // 각 초기화 대상에 대해 해당하는 reset 함수 실행
      resetTargets.forEach((stateName) => {
        // exclude 리스트에 있으면 건너뛰기
        if (exclude.includes(stateName)) {
          return;
        }

        // 상태명을 reset 함수명으로 변환 (예: passengerSchedule -> resetPassengerSchedule)
        const resetFnName =
          `reset${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}` as keyof typeof resetActions;

        const resetFn = resetActions[resetFnName];

        if (resetFn) {
          resetFn();
        }
      });
    },
    [resetActions]
  );

  /**
   * 특정 상태 하나만 초기화
   *
   * @param stateName - 초기화할 상태명
   */
  const resetSingleState = useCallback(
    (stateName: string) => {
      const resetFnName = `reset${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}` as keyof typeof resetActions;
      const resetFn = resetActions[resetFnName];

      if (resetFn) {
        resetFn();
      }
    },
    [resetActions]
  );

  /**
   * 모든 상태 초기화 (시나리오 새로 시작할 때 사용)
   */
  const resetAllStates = useCallback(() => {
    Object.values(resetActions).forEach((resetFn) => {
      if (resetFn) resetFn();
    });
  }, [resetActions]);

  return {
    resetByTab,
    resetSingleState,
    resetAllStates,
    // 디버깅용: 현재 Reset Map 확인
    getResetMap: () => TAB_RESET_MAP,
  };
};
