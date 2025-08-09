// 표준화된 탭 데이터 훅들
import { useShallow } from 'zustand/react/shallow';
import { useScenarioStore } from '@/stores/useScenarioStore';

// Flight Schedule 탭 데이터 훅
export const useFlightScheduleData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      airport: s.flightSchedule.airport,
      date: s.flightSchedule.date,
      availableConditions: s.flightSchedule.availableConditions,
      selectedConditions: s.flightSchedule.selectedConditions,
      chartData: s.flightSchedule.chartData,
      total: s.flightSchedule.total,
      isCompleted: s.flightSchedule.isCompleted,
      // 액션들
      actions: s.flightSchedule.actions,
    }))
  );
};

// Passenger Schedule 탭 데이터 훅
export const usePassengerScheduleData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      destribution_conditions: s.passengerSchedule.destribution_conditions,
      apiResponseData: s.passengerSchedule.apiResponseData,
      isCompleted: s.passengerSchedule.isCompleted,
      // 액션들
      actions: s.passengerSchedule.actions,
    }))
  );
};

// Airport Processing 탭 데이터 훅
export const useAirportProcessingData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      procedures: s.airportProcessing.procedures,
      entryType: s.airportProcessing.entryType,
      isCompleted: s.airportProcessing.isCompleted,
      // 액션들
      actions: s.airportProcessing.actions,
    }))
  );
};

// Facility Connection 탭 데이터 훅
export const useFacilityConnectionData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      processes: s.facilityConnection.processes,
      isCompleted: s.facilityConnection.isCompleted,
      // 액션들
      actions: s.facilityConnection.actions,
    }))
  );
};

// Facility Capacity 탭 데이터 훅
export const useFacilityCapacityData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      selectedNodes: s.facilityCapacity.selectedNodes,
      settings: s.facilityCapacity.settings,
      isCompleted: s.facilityCapacity.isCompleted,
      // 액션들
      actions: s.facilityCapacity.actions,
    }))
  );
};

// Scenario Profile 데이터 훅
export const useScenarioProfileData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      checkpoint: s.scenarioProfile.checkpoint,
      scenarioName: s.scenarioProfile.scenarioName,
      scenarioTerminal: s.scenarioProfile.scenarioTerminal,
      scenarioHistory: s.scenarioProfile.scenarioHistory,
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      // 액션들
      actions: s.scenarioProfile.actions,
    }))
  );
};

// Scenario Overview 데이터 훅
export const useScenarioOverviewData = () => {
  return useScenarioStore(
    useShallow((s) => ({
      // 데이터
      matrix: s.scenarioOverview.matrix,
      // 액션들
      actions: s.scenarioOverview.actions,
    }))
  );
};
