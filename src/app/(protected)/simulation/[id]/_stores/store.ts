'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ==================== Types ====================
export interface SimulationStoreState {
  context: {
    scenarioId: string;
    airport: string;
    date: string;
    lastSavedAt: string | null;
  };
  flight: {
    total_flights: number | null;
    airlines: Record<string, string> | null;
    filters: Record<string, unknown> | null;
    selectedConditions: {
      mode: 'departure' | 'arrival' | null;
      category: string | null;
      value: string | null;
    } | null;
    appliedFilterResult: {
      requestBody: Record<string, unknown>;
      responseData: Record<string, unknown>;
      appliedAt: string;
    } | null;
  };
  passenger: {
    settings: Record<string, unknown>;
    demographics: Record<string, unknown>;
    arrivalPatterns: Record<string, unknown>;
    showUpResults: Record<string, unknown> | null;
  };
  process: {
    flow: Array<Record<string, unknown>>;
  };
  workflow: {
    currentStep: number;
    step1Completed: boolean;
    step2Completed: boolean;
    step3Completed: boolean;
    availableSteps: number[];
  };
  savedAt: string | null;

  // Actions - 사용자가 하나씩 지정할 예정
  resetStore: () => void;

  // Context 관련 액션들
  setScenarioId: (scenarioId: string) => void;
  setAirport: (airport: string) => void;
  setDate: (date: string) => void;
  setLastSavedAt: (timestamp: string | null) => void;

  // Flight 관련 액션들
  setFlightFilters: (data: {
    total_flights: number;
    airlines: Record<string, string>;
    filters: Record<string, unknown>;
  }) => void;
  resetFlightData: () => void; // 🆕 flight 영역만 리셋
  setSelectedConditions: (conditions: {
    mode: 'departure' | 'arrival' | null;
    category: string | null;
    value: string | null;
  }) => void;
  setAppliedFilterResult: (result: {
    requestBody: Record<string, unknown>;
    responseData: Record<string, unknown>;
  }) => void;

  // TODO: 사용자가 필요한 액션들을 하나씩 추가할 예정
}

// ==================== Initial State ====================
const createInitialState = (scenarioId?: string) => ({
  context: {
    scenarioId: scenarioId || '',
    airport: 'ICN', // ICN을 기본값으로 설정
    date: '',
    lastSavedAt: null,
  },
  flight: {
    total_flights: null,
    airlines: null,
    filters: null,
    selectedConditions: null,
    appliedFilterResult: null,
  },
  passenger: {
    settings: {},
    demographics: {},
    arrivalPatterns: {},
    showUpResults: null,
  },
  process: {
    flow: [],
  },
  workflow: {
    currentStep: 1,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    availableSteps: [1],
  },
  savedAt: null,
});

// ==================== Store ====================
export const useSimulationStore = create<SimulationStoreState>()(
  immer((set) => ({
    // Initial state
    ...createInitialState(),

    // Actions
    resetStore: () =>
      set((state) => {
        Object.assign(state, createInitialState(state.context.scenarioId));
      }),

    // Context 관련 액션들
    setScenarioId: (scenarioId) =>
      set((state) => {
        state.context.scenarioId = scenarioId;
      }),

    setAirport: (airport) =>
      set((state) => {
        state.context.airport = airport;
      }),

    setDate: (date) =>
      set((state) => {
        state.context.date = date;
      }),

    setLastSavedAt: (timestamp) =>
      set((state) => {
        state.context.lastSavedAt = timestamp;
      }),

    // Flight 관련 액션들
    setFlightFilters: (data) =>
      set((state) => {
        state.flight.total_flights = data.total_flights;
        state.flight.airlines = data.airlines;
        state.flight.filters = data.filters;
      }),

    resetFlightData: () =>
      set((state) => {
        state.flight.total_flights = null;
        state.flight.airlines = null;
        state.flight.filters = null;
        state.flight.selectedConditions = null;
        state.flight.appliedFilterResult = null;
      }),

    setSelectedConditions: (conditions) =>
      set((state) => {
        state.flight.selectedConditions = conditions;
      }),

    setAppliedFilterResult: (result) =>
      set((state) => {
        state.flight.appliedFilterResult = {
          ...result,
          appliedAt: new Date().toISOString(),
        };
      }),

    // TODO: 사용자가 필요한 액션들을 여기에 하나씩 추가할 예정
  }))
);

// ==================== Helpers ====================
export const getSimulationInitialState = (scenarioId?: string) => createInitialState(scenarioId);
