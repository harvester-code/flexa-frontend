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
// 🗑️ 삭제된 파일들: flight-schedule.ts, flight-schedule-v2.ts, passenger-schedule.ts, processing-procedures.ts
export { useSimulationStore } from './store'; // 🆕 통합 단일 Store

// ==================== Type Re-exports ====================
export type { ScenarioProfileState } from './scenario-profile';
// 🗑️ 삭제된 타입들: FlightScheduleState, FlightScheduleV2State, PassengerScheduleState, ProcessingProceduresState
export type { SimulationStoreState } from './store'; // 🆕 통합 단일 Store Types
