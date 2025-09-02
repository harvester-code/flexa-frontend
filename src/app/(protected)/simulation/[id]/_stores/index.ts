/**
 * 모듈화된 Zustand Stores - 단순 Re-export
 *
 * 각 개별 store를 직접 사용하세요:
 *
 * @example
 * import { useFlightScheduleStore } from './_stores';
 * const airport = useFlightScheduleStore((s) => s.airport);
 * const setAirport = useFlightScheduleStore((s) => s.setAirport);
 */

// ==================== Individual Store Re-exports ====================
export { useScenarioProfileStore } from './scenario-profile';
export { useFlightScheduleStore } from './flight-schedule';
export { useFlightScheduleV2Store } from './flight-schedule-v2'; // 🆕 Modern Flight Schedule Store
// export { usePassengerScheduleStore } from './passenger-schedule'; // 🚫 Migrated to useSimulationStore
// export { useProcessingProceduresStore } from './processing-procedures'; // 🚫 Migrated to useSimulationStore
export { useSimulationStore } from './store'; // 🆕 통합 단일 Store

// ==================== Type Re-exports ====================
export type { ScenarioProfileState } from './scenario-profile';
export type { FlightScheduleState } from './flight-schedule';
export type { FlightScheduleV2State } from './flight-schedule-v2'; // 🆕 Modern Flight Schedule Types
export type { PassengerScheduleState } from './passenger-schedule';
export type { ProcessingProceduresState } from './processing-procedures';
export type { SimulationStoreState } from './store'; // 🆕 통합 단일 Store Types
