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
    selectedConditions: {
      type: 'departure' | 'arrival';
      conditions: Array<{
        field: string; // "departure_terminal", "operating_carrier_iata", etc.
        values: string[]; // ["2"], ["KE", "LJ"], etc.
      }>;
    } | null;
    appliedFilterResult: {
      total: number;
      chart_x_data: string[]; // ["00:00", "01:00", ...]
      chart_y_data: {
        airline: Array<{
          name: string;
          order: number;
          y: number[];
          acc_y: number[];
        }>;
        terminal: Array<{
          name: string;
          order: number;
          y: number[];
          acc_y: number[];
        }>;
      };
      appliedAt: string;
    } | null;
    total_flights: number | null;
    airlines: Record<string, string> | null;
    filters: Record<string, unknown> | null;
  };
  passenger: {
    settings: Record<string, unknown>;
    demographics: Record<string, unknown>;
    arrivalPatterns: Record<string, unknown>;
    showUpResults: Record<string, unknown> | null;
    parquetMeta: {
      columns: Array<{
        name: string;
        unique_values: string[];
        count: number;
      }>;
    } | null;
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
  setSelectedConditions: (selectedConditions: {
    type: 'departure' | 'arrival';
    conditions: Array<{
      field: string;
      values: string[];
    }>;
  }) => void;

  // 🆕 편의 액션들 - API 바디 형태 조작
  setFlightType: (type: 'departure' | 'arrival') => void;
  addCondition: (field: string, values: string[]) => void;
  removeCondition: (field: string) => void;
  updateConditionValues: (field: string, values: string[]) => void;
  toggleConditionValue: (field: string, value: string) => void;
  clearAllConditions: () => void;

  setAppliedFilterResult: (result: {
    total: number;
    chart_x_data: string[];
    chart_y_data: {
      airline: Array<{
        name: string;
        order: number;
        y: number[];
        acc_y: number[];
      }>;
      terminal: Array<{
        name: string;
        order: number;
        y: number[];
        acc_y: number[];
      }>;
    };
  }) => void;

  // Workflow 관련 액션들
  setCurrentStep: (step: number) => void;
  setStepCompleted: (step: number, completed: boolean) => void;
  updateAvailableSteps: () => void; // 완료된 단계에 따라 availableSteps 업데이트

  // Passenger 관련 액션들
  setParquetMeta: (parquetMeta: {
    columns: Array<{
      name: string;
      unique_values: string[];
      count: number;
    }>;
  }) => void;

  // TODO: 사용자가 필요한 액션들을 하나씩 추가할 예정
}

// ==================== Initial State ====================
const createInitialState = (scenarioId?: string) => ({
  context: {
    scenarioId: scenarioId || '',
    airport: 'ICN', // ICN을 기본값으로 설정
    date: new Date().toISOString().split('T')[0], // 오늘 날짜 (YYYY-MM-DD 형식)
    lastSavedAt: null,
  },
  flight: {
    selectedConditions: null,
    appliedFilterResult: null,
    total_flights: null,
    airlines: null,
    filters: null,
  },
  passenger: {
    settings: {},
    demographics: {},
    arrivalPatterns: {},
    showUpResults: null,
    parquetMeta: null,
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
        state.flight.selectedConditions = null;
        state.flight.appliedFilterResult = null;
        state.flight.total_flights = null;
        state.flight.airlines = null;
        state.flight.filters = null;

        // ✅ flight 데이터 리셋 시 관련된 passenger 데이터도 리셋
        state.passenger.parquetMeta = null;

        // ✅ flight 데이터 리셋 시 workflow도 리셋
        state.workflow.step1Completed = false;
        state.workflow.availableSteps = [1]; // 첫 번째 단계만 접근 가능
      }),

    setSelectedConditions: (selectedConditions) =>
      set((state) => {
        state.flight.selectedConditions = selectedConditions;
      }),

    // 🆕 편의 액션들 구현 - API 바디 형태 조작
    setFlightType: (type) =>
      set((state) => {
        if (!state.flight.selectedConditions) {
          state.flight.selectedConditions = {
            type,
            conditions: [],
          };
        } else {
          state.flight.selectedConditions.type = type;
        }
      }),

    addCondition: (field, values) =>
      set((state) => {
        if (!state.flight.selectedConditions) {
          state.flight.selectedConditions = {
            type: 'departure',
            conditions: [{ field, values }],
          };
        } else {
          // 같은 field가 이미 있으면 제거하고 새로 추가
          state.flight.selectedConditions.conditions = state.flight.selectedConditions.conditions.filter(
            (condition) => condition.field !== field
          );
          if (values.length > 0) {
            state.flight.selectedConditions.conditions.push({ field, values });
          }
        }
      }),

    removeCondition: (field) =>
      set((state) => {
        if (state.flight.selectedConditions) {
          state.flight.selectedConditions.conditions = state.flight.selectedConditions.conditions.filter(
            (condition) => condition.field !== field
          );
        }
      }),

    updateConditionValues: (field, values) =>
      set((state) => {
        if (!state.flight.selectedConditions) {
          state.flight.selectedConditions = {
            type: 'departure',
            conditions: values.length > 0 ? [{ field, values }] : [],
          };
        } else {
          const existingCondition = state.flight.selectedConditions.conditions.find(
            (condition) => condition.field === field
          );

          if (existingCondition) {
            if (values.length > 0) {
              existingCondition.values = values;
            } else {
              // values가 비어있으면 조건 제거
              state.flight.selectedConditions.conditions = state.flight.selectedConditions.conditions.filter(
                (condition) => condition.field !== field
              );
            }
          } else if (values.length > 0) {
            // 새로운 조건 추가
            state.flight.selectedConditions.conditions.push({ field, values });
          }
        }
      }),

    toggleConditionValue: (field, value) =>
      set((state) => {
        if (!state.flight.selectedConditions) {
          state.flight.selectedConditions = {
            type: 'departure',
            conditions: [{ field, values: [value] }],
          };
        } else {
          const existingCondition = state.flight.selectedConditions.conditions.find(
            (condition) => condition.field === field
          );

          if (existingCondition) {
            const valueIndex = existingCondition.values.indexOf(value);
            if (valueIndex === -1) {
              // 값 추가
              existingCondition.values.push(value);
            } else {
              // 값 제거
              existingCondition.values.splice(valueIndex, 1);

              // 값이 모두 없어지면 조건 제거
              if (existingCondition.values.length === 0) {
                state.flight.selectedConditions.conditions = state.flight.selectedConditions.conditions.filter(
                  (condition) => condition.field !== field
                );
              }
            }
          } else {
            // 새로운 조건 추가
            state.flight.selectedConditions.conditions.push({ field, values: [value] });
          }
        }
      }),

    clearAllConditions: () =>
      set((state) => {
        if (state.flight.selectedConditions) {
          state.flight.selectedConditions.conditions = [];
        }
      }),

    setAppliedFilterResult: (result) =>
      set((state) => {
        state.flight.appliedFilterResult = {
          ...result,
          appliedAt: new Date().toISOString(),
        };

        // ✅ appliedFilterResult가 설정되면 step1 완료 처리
        state.workflow.step1Completed = true;

        // availableSteps 업데이트 (step1이 완료되면 step2 접근 가능)
        if (!state.workflow.availableSteps.includes(2)) {
          state.workflow.availableSteps.push(2);
        }
      }),

    // ==================== Workflow Actions ====================

    setCurrentStep: (step) =>
      set((state) => {
        state.workflow.currentStep = step;
      }),

    setStepCompleted: (step, completed) =>
      set((state) => {
        if (step === 1) state.workflow.step1Completed = completed;
        else if (step === 2) state.workflow.step2Completed = completed;
        else if (step === 3) state.workflow.step3Completed = completed;
      }),

    updateAvailableSteps: () =>
      set((state) => {
        const availableSteps = [1]; // 첫 번째 단계는 항상 접근 가능

        if (state.workflow.step1Completed && !availableSteps.includes(2)) {
          availableSteps.push(2);
        }
        if (state.workflow.step2Completed && !availableSteps.includes(3)) {
          availableSteps.push(3);
        }

        state.workflow.availableSteps = availableSteps;
      }),

    // ==================== Passenger Actions ====================

    setParquetMeta: (parquetMeta) =>
      set((state) => {
        state.passenger.parquetMeta = parquetMeta;
      }),

    // TODO: 사용자가 필요한 액션들을 여기에 하나씩 추가할 예정
  }))
);

// ==================== Helpers ====================
export const getSimulationInitialState = (scenarioId?: string) => createInitialState(scenarioId);
