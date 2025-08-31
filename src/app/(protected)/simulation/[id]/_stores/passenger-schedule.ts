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
  pax_demographics: {
    nationality: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        distribution: Record<string, number>;
      }>;
      default: Record<string, number>;
    };
    profile: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        distribution: Record<string, number>;
      }>;
      default: Record<string, number>;
    };
  };
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
  setPaxDemographics: (demographics: PassengerScheduleState['pax_demographics']) => void;
  setNationalityValues: (values: string[]) => void;
  setProfileValues: (values: string[]) => void;
  addNationalityRule: (conditions: Record<string, string[]>) => void;
  addProfileRule: (conditions: Record<string, string[]>) => void;
  removeNationalityRule: (ruleIndex: number) => void;
  removeProfileRule: (ruleIndex: number) => void;
  updateNationalityDistribution: (ruleIndex: number, distribution: Record<string, number>) => void;
  updateProfileDistribution: (ruleIndex: number, distribution: Record<string, number>) => void;
  reorderPaxDemographics: () => void;
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
  pax_demographics: {
    nationality: {
      available_values: [],
      rules: [],
      default: {}
    },
    profile: {
      available_values: [],
      rules: [],
      default: {}
    }
  },
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

    setNationalityValues: (values) =>
      set((state) => {
        // 올바른 순서로 nationality 객체 재구성
        const currentRules = state.pax_demographics.nationality.rules || [];
        const currentDefault = state.pax_demographics.nationality.default || {};
        
        state.pax_demographics.nationality = {
          available_values: values,
          rules: currentRules,
          default: currentDefault
        };
      }),

    setProfileValues: (values) =>
      set((state) => {
        // 올바른 순서로 profile 객체 재구성
        const currentRules = state.pax_demographics.profile.rules || [];
        const currentDefault = state.pax_demographics.profile.default || {};
        
        state.pax_demographics.profile = {
          available_values: values,
          rules: currentRules,
          default: currentDefault
        };
      }),

    addNationalityRule: (conditions) =>
      set((state) => {
        state.pax_demographics.nationality.rules.push({
          conditions,
          distribution: {} // available_values 기반으로 설정할 예정
        });
      }),

    addProfileRule: (conditions) =>
      set((state) => {
        state.pax_demographics.profile.rules.push({
          conditions,
          distribution: {} // available_values 기반으로 설정할 예정
        });
      }),

    removeNationalityRule: (ruleIndex) =>
      set((state) => {
        state.pax_demographics.nationality.rules.splice(ruleIndex, 1);
      }),

    removeProfileRule: (ruleIndex) =>
      set((state) => {
        state.pax_demographics.profile.rules.splice(ruleIndex, 1);
      }),

    updateNationalityDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.pax_demographics.nationality.rules[ruleIndex]) {
          state.pax_demographics.nationality.rules[ruleIndex].distribution = distribution;
        }
      }),

    updateProfileDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.pax_demographics.profile.rules[ruleIndex]) {
          state.pax_demographics.profile.rules[ruleIndex].distribution = distribution;
        }
      }),

    reorderPaxDemographics: () =>
      set((state) => {
        // nationality 재정렬 (안전하게 체크)
        if (state.pax_demographics.nationality) {
          const nationalityData = state.pax_demographics.nationality;
          state.pax_demographics.nationality = {
            available_values: nationalityData.available_values || [],
            rules: nationalityData.rules || [],
            default: nationalityData.default || {}
          };
        }
        
        // profile 재정렬 (안전하게 체크)
        if (state.pax_demographics.profile) {
          const profileData = state.pax_demographics.profile;
          state.pax_demographics.profile = {
            available_values: profileData.available_values || [],
            rules: profileData.rules || [],
            default: profileData.default || {}
          };
        }
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
