// 모듈화된 Zustand 기반 탭 데이터 훅들
// 기존 useScenarioStore 대신 개별 모듈을 사용하여 성능과 유지보수성 향상
import {
  useFacilityConnectionStore,
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
} from '../[id]/_stores';

// ==================== Flight Schedule 탭 데이터 훅 ====================
export const useFlightScheduleData = () => {
  const {
    // Data
    airport,
    date,
    type,
    availableConditions,
    selectedConditions,
    chartData,
    total,
    isCompleted,

    // Actions
    setAirport,
    setDate,
    setType,
    setAvailableConditions,
    setSelectedConditions,
    setChartData,
    setTotal,
    setCompleted,
    resetState,
    loadMetadata,
  } = useFlightScheduleStore();

  return {
    // Data
    airport,
    date,
    type,
    availableConditions,
    selectedConditions,
    chartData,
    total,
    isCompleted,

    // Actions (기존 호환성을 위해 actions 객체로 감쌈)
    actions: {
      setAirport,
      setDate,
      setType,
      setAvailableConditions,
      setSelectedConditions,
      setChartData,
      setTotal,
      setIsCompleted: setCompleted, // 기존 호환성을 위해 setIsCompleted로 별칭 제공
      resetState,
      loadMetadata,
    },
  };
};

// ==================== Passenger Schedule 탭 데이터 훅 ====================
export const usePassengerScheduleData = () => {
  const {
    // Data
    settings,
    pax_demographics,
    pax_arrival_patterns,
    apiResponseData,
    isCompleted,

    // Actions
    setSettings,
    setPaxDemographics,
    setPaxArrivalPatternRules,
    addPaxArrivalPatternRule,
    updatePaxArrivalPatternRule,
    removePaxArrivalPatternRule,
    setApiResponseData,
    setCompleted,
    resetState,
    loadMetadata,
  } = usePassengerScheduleStore();

  return {
    // Data
    settings,
    pax_demographics,
    pax_arrival_patterns,
    apiResponseData,
    isCompleted,

    // Actions (기존 호환성을 위해 actions 객체로 감쌈)
    actions: {
      setSettings,
      setPaxDemographics,
      setPaxArrivalPatternRules,
      addPaxArrivalPatternRule,
      updatePaxArrivalPatternRule,
      removePaxArrivalPatternRule,
      setApiResponseData,
      setIsCompleted: setCompleted,
      resetState,
      loadMetadata,
    },
  };
};

// ==================== Airport Processing 탭 데이터 훅 ====================
export const useAirportProcessingData = () => {
  const {
    // Data
    process_flow,
    isCompleted,

    // Actions
    setProcessFlow,
    convertFromProcedures,
    setCompleted,
    resetState,
    loadMetadata,
  } = useProcessingProceduresStore();

  return {
    // Data
    process_flow,
    isCompleted,

    // Actions (기존 호환성을 위해 actions 객체로 감쌈)
    actions: {
      setProcessFlow,
      convertFromProcedures,
      setIsCompleted: setCompleted,
      resetState,
      loadMetadata,
    },
  };
};

// ==================== 🔗 Facility Connection 탭 데이터 훅 ====================
export const useFacilityConnectionData = () => {
  const {
    // Data
    processes,
    isCompleted,

    // Actions
    setProcesses,
    generateProcessesFromProcedures,
    setCompleted,
    resetState,
    loadMetadata,
  } = useFacilityConnectionStore();

  return {
    // Data
    processes,
    isCompleted,

    // Actions (기존 호환성을 위해 actions 객체로 감쌈)
    actions: {
      setProcesses,
      generateProcessesFromProcedures,
      setIsCompleted: setCompleted,
      resetState,
      loadMetadata,
    },
  };
};

// ==================== Legacy 호환성 지원 ====================
/**
 * @deprecated 기존 이름과 호환성을 위해 유지
 * useScenarioOverviewData()를 사용하세요
 * [DEPRECATED] 이 함수는 deprecated입니다. useScenarioOverviewData()를 사용하세요.
 */
export const useScenarioProfileData = () => {
  // 빈 객체 반환 (기존 코드가 깨지지 않도록)
  return {
    checkpoint: '',
    scenarioName: '',
    scenarioTerminal: '',
    scenarioHistory: [],
    currentScenarioTab: 0,
    availableScenarioTab: [],
    actions: {
      setCheckpoint: () => {},
      setScenarioName: () => {},
      setScenarioTerminal: () => {},
      setScenarioHistory: () => {},
      setCurrentScenarioTab: () => {},
      setAvailableScenarioTab: () => {},
      resetState: () => {},
      loadMetadata: () => {},
    },
  };
};

// ==================== 개별 스토어 직접 접근 ====================
/**
 * 더 간단한 사용을 위한 직접 export
 * 예: const { airport, setAirport } = useFlightScheduleStore();
 */
export {
  useFlightScheduleStore,
  usePassengerScheduleStore,
  useProcessingProceduresStore,
  useFacilityConnectionStore,
} from '../[id]/_stores';
