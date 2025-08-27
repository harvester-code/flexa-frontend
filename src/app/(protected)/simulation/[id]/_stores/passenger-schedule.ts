import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ==================== Types ====================
export interface PassengerScheduleState {
  // Data
  settings: {
    date: string;
    airport: string;
    load_factor: number;
    min_arrival_minutes: number;
  };
  pax_demographics: Record<string, unknown>;
  pax_arrival_patterns: {
    rules: Array<{
      conditions: {
        operating_carrier_iata: string[];
      };
      mean: number;
      std: number;
    }>;
    default: {
      mean: number;
      std: number;
    };
  };
  apiResponseData: Record<string, unknown> | null;
  isCompleted: boolean;

  // Actions
  setSettings: (settings: Partial<PassengerScheduleState['settings']>) => void;
  setPaxDemographics: (demographics: Record<string, unknown>) => void;
  setPaxArrivalPatternRules: (rules: PassengerScheduleState['pax_arrival_patterns']['rules']) => void;
  addPaxArrivalPatternRule: (rule: PassengerScheduleState['pax_arrival_patterns']['rules'][0]) => void;
  updatePaxArrivalPatternRule: (
    index: number,
    rule: PassengerScheduleState['pax_arrival_patterns']['rules'][0]
  ) => void;
  removePaxArrivalPatternRule: (index: number) => void;
  setApiResponseData: (data: Record<string, unknown> | null) => void;
  setCompleted: (completed: boolean) => void;
  resetState: () => void;
  loadMetadata: (metadata: Record<string, unknown>) => void;
}

// ==================== Initial State ====================
const initialState = {
  settings: {
    date: new Date().toISOString().split('T')[0], // 오늘 날짜 (YYYY-MM-DD 형식)
    airport: '',
    load_factor: 0.85,
    min_arrival_minutes: 30,
  },
  pax_demographics: {},
  pax_arrival_patterns: {
    rules: [],
    default: {
      mean: 120,
      std: 30,
    },
  },
  apiResponseData: null,
  isCompleted: false,
};

// ==================== Store ====================
export const usePassengerScheduleStore = create<PassengerScheduleState>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // Actions
    setSettings: (newSettings) =>
      set((state) => {
        Object.assign(state.settings, newSettings);
      }),

    setPaxDemographics: (demographics) =>
      set((state) => {
        state.pax_demographics = demographics;
      }),

    setPaxArrivalPatternRules: (rules) =>
      set((state) => {
        state.pax_arrival_patterns.rules = rules;
      }),

    addPaxArrivalPatternRule: (rule) =>
      set((state) => {
        state.pax_arrival_patterns.rules.push(rule);
      }),

    updatePaxArrivalPatternRule: (index, rule) =>
      set((state) => {
        if (state.pax_arrival_patterns.rules[index]) {
          state.pax_arrival_patterns.rules[index] = rule;
        }
      }),

    removePaxArrivalPatternRule: (index) =>
      set((state) => {
        state.pax_arrival_patterns.rules.splice(index, 1);
      }),

    setApiResponseData: (data) =>
      set((state) => {
        state.apiResponseData = data;
      }),

    setCompleted: (completed) =>
      set((state) => {
        state.isCompleted = completed;
      }),

    resetState: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    loadMetadata: (metadata) =>
      set((state) => {
        Object.assign(state, {
          ...initialState,
          ...metadata,
        });
      }),
  }))
);

// ==================== Helpers ====================
export const getPassengerScheduleInitialState = () => ({ ...initialState });
