'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useSimulationStore } from './store';

// ==================== Types ====================
export interface UIRule {
  id: string;
  name: string;
  conditions: string[]; // UI 형식: ["Airline: Korean Air", "Aircraft Type: A333"]
  flightCount: number;
  distribution?: Record<string, number>; // UI 분포 데이터
}

export interface PassengerStoreState {
  // ==================== UI Data ====================
  // Nationality Tab
  nationality: {
    definedProperties: string[]; // ["Domestic", "International"]
    createdRules: UIRule[];
    hasDefaultRule: boolean;
    defaultDistribution: Record<string, number>;
  };

  // Pax Profile Tab
  profile: {
    definedProperties: string[]; // ["Business", "Crew", "General"]
    createdRules: UIRule[];
    hasDefaultRule: boolean;
    defaultDistribution: Record<string, number>;
  };

  // Load Factor Tab
  loadFactor: {
    createdRules: UIRule[];
    hasDefaultRule: boolean;
    defaultLoadFactor: number | null; // 빈값 허용
  };

  // Show-up Time Tab
  showUpTime: {
    createdRules: UIRule[];
    hasDefaultRule: boolean;
    defaultMean: number | null;
    defaultStd: number | null;
  };

  // ==================== Actions ====================
  // Nationality Actions
  setNationalityProperties: (properties: string[]) => void;
  addNationalityRule: (rule: UIRule) => void;
  updateNationalityRule: (ruleId: string, updatedRule: Partial<UIRule>) => void;
  removeNationalityRule: (ruleId: string) => void;
  reorderNationalityRules: (newOrder: UIRule[]) => void;
  setNationalityDefaultRule: (hasDefault: boolean) => void;
  updateNationalityDefaultDistribution: (distribution: Record<string, number>) => void;

  // Profile Actions
  setProfileProperties: (properties: string[]) => void;
  addProfileRule: (rule: UIRule) => void;
  updateProfileRule: (ruleId: string, updatedRule: Partial<UIRule>) => void;
  removeProfileRule: (ruleId: string) => void;
  reorderProfileRules: (newOrder: UIRule[]) => void;
  setProfileDefaultRule: (hasDefault: boolean) => void;
  updateProfileDefaultDistribution: (distribution: Record<string, number>) => void;

  // Load Factor Actions
  addLoadFactorRule: (rule: UIRule) => void;
  updateLoadFactorRule: (ruleId: string, updatedRule: Partial<UIRule>) => void;
  removeLoadFactorRule: (ruleId: string) => void;
  reorderLoadFactorRules: (newOrder: UIRule[]) => void;
  setLoadFactorDefaultRule: (hasDefault: boolean) => void;
  updateLoadFactorDefault: (loadFactor: number | null) => void;

  // Show-up Time Actions
  addShowUpTimeRule: (rule: UIRule) => void;
  updateShowUpTimeRule: (ruleId: string, updatedRule: Partial<UIRule>) => void;
  removeShowUpTimeRule: (ruleId: string) => void;
  reorderShowUpTimeRules: (newOrder: UIRule[]) => void;
  setShowUpTimeDefaultRule: (hasDefault: boolean) => void;
  updateShowUpTimeDefault: (params: { mean: number | null; std: number | null }) => void;

  // ==================== JSON Generation ====================
  generatePassengerJSON: () => any;

  // ==================== Utilities ====================
  reset: () => void;
}

// ==================== Helper Functions ====================
/**
 * UI 조건 문자열을 백엔드 conditions 객체로 변환
 * "Airline: Korean Air" → { operating_carrier_iata: ["KE"] }
 */
const convertUIConditionsToBackend = (uiConditions: string[]): Record<string, string[]> => {
  const backendConditions: Record<string, string[]> = {};

  // Display label을 실제 column key로 변환하는 맵핑
  const labelToColumnMap: Record<string, string> = {
    Airline: 'operating_carrier_iata',
    'Aircraft Type': 'aircraft_type_icao',
    'Flight Type': 'flight_type',
    'Total Seats': 'total_seats',
    'Arrival Airport': 'arrival_airport_iata',
    'Arrival Terminal': 'arrival_terminal',
    'Arrival City': 'arrival_city',
    'Arrival Country': 'arrival_country',
    'Arrival Region': 'arrival_region',
    'Departure Airport Iata': 'departure_airport_iata',
    'Departure Terminal': 'departure_terminal',
    'Departure City': 'departure_city',
    'Departure Country': 'departure_country',
    'Departure Region': 'departure_region',
  };

  // 값 변환 맵핑 (필요시)
  const valueMapping: Record<string, Record<string, string>> = {
    operating_carrier_iata: {
      'Korean Air': 'KE',
      'Asiana Airlines': 'OZ',
      // 필요에 따라 추가
    },
  };

  if (Array.isArray(uiConditions)) {
    uiConditions.forEach((condition) => {
      if (typeof condition === 'string') {
        const parts = condition.split(': ');
        if (parts.length === 2) {
          const displayLabel = parts[0];
          const value = parts[1];
          const columnKey = labelToColumnMap[displayLabel] || displayLabel.toLowerCase().replace(' ', '_');

          // 값 변환 적용 (있으면)
          const convertedValue = valueMapping[columnKey]?.[value] || value;

          if (!backendConditions[columnKey]) {
            backendConditions[columnKey] = [];
          }
          backendConditions[columnKey].push(convertedValue);
        }
      }
    });
  }

  return backendConditions;
};

/**
 * 퍼센트 분포를 소수점으로 변환
 * { domestic: 65, foreigner: 35 } → { domestic: 0.65, foreigner: 0.35 }
 */
const convertPercentageToDecimal = (percentageObj: Record<string, number>): Record<string, number> => {
  const result: Record<string, number> = {};
  
  if (percentageObj && typeof percentageObj === 'object') {
    Object.entries(percentageObj).forEach(([key, value]) => {
      if (typeof key === 'string' && typeof value === 'number' && !isNaN(value)) {
        result[key] = value / 100;
      }
    });
  }
  
  return result;
};

// ==================== Initial State ====================
const createInitialState = (): Omit<PassengerStoreState, keyof PassengerStoreActions> => ({
  nationality: {
    definedProperties: ['Domestic', 'International'], // 기본값
    createdRules: [],
    hasDefaultRule: false,
    defaultDistribution: {}, // 빈 객체로 시작
  },
  profile: {
    definedProperties: ['General'], // 기본값
    createdRules: [],
    hasDefaultRule: false,
    defaultDistribution: {}, // 빈 객체로 시작
  },
  loadFactor: {
    createdRules: [],
    hasDefaultRule: true, // Load Factor는 항상 Default 표시
    defaultLoadFactor: null, // 빈값으로 시작
  },
  showUpTime: {
    createdRules: [],
    hasDefaultRule: true, // Show-up Time은 항상 Default 표시
    defaultMean: null,
    defaultStd: null,
  },
});

type PassengerStoreActions = Pick<
  PassengerStoreState,
  | 'setNationalityProperties'
  | 'addNationalityRule'
  | 'updateNationalityRule'
  | 'removeNationalityRule'
  | 'reorderNationalityRules'
  | 'setNationalityDefaultRule'
  | 'updateNationalityDefaultDistribution'
  | 'setProfileProperties'
  | 'addProfileRule'
  | 'updateProfileRule'
  | 'removeProfileRule'
  | 'reorderProfileRules'
  | 'setProfileDefaultRule'
  | 'updateProfileDefaultDistribution'
  | 'addLoadFactorRule'
  | 'updateLoadFactorRule'
  | 'removeLoadFactorRule'
  | 'reorderLoadFactorRules'
  | 'setLoadFactorDefaultRule'
  | 'updateLoadFactorDefault'
  | 'addShowUpTimeRule'
  | 'updateShowUpTimeRule'
  | 'removeShowUpTimeRule'
  | 'reorderShowUpTimeRules'
  | 'setShowUpTimeDefaultRule'
  | 'updateShowUpTimeDefault'
  | 'generatePassengerJSON'
  | 'reset'
>;

// ==================== Store ====================
export const usePassengerStore = create<PassengerStoreState>()(
  immer((set, get) => ({
    // Initial state
    ...createInitialState(),

    // ==================== Nationality Actions ====================
    setNationalityProperties: (properties) =>
      set((state) => {
        state.nationality.definedProperties = properties;
      }),

    addNationalityRule: (rule) =>
      set((state) => {
        state.nationality.createdRules.push(rule);
      }),

    updateNationalityRule: (ruleId, updatedRule) =>
      set((state) => {
        const ruleIndex = state.nationality.createdRules.findIndex((rule) => rule.id === ruleId);
        if (ruleIndex !== -1) {
          state.nationality.createdRules[ruleIndex] = {
            ...state.nationality.createdRules[ruleIndex],
            ...updatedRule,
          };
        }
      }),

    removeNationalityRule: (ruleId) =>
      set((state) => {
        state.nationality.createdRules = state.nationality.createdRules.filter((rule) => rule.id !== ruleId);
      }),

    reorderNationalityRules: (newOrder) =>
      set((state) => {
        state.nationality.createdRules = newOrder;
      }),

    setNationalityDefaultRule: (hasDefault) =>
      set((state) => {
        state.nationality.hasDefaultRule = hasDefault;
      }),

    updateNationalityDefaultDistribution: (distribution) =>
      set((state) => {
        state.nationality.defaultDistribution = distribution;
      }),

    // ==================== Profile Actions ====================
    setProfileProperties: (properties) =>
      set((state) => {
        state.profile.definedProperties = properties;
      }),

    addProfileRule: (rule) =>
      set((state) => {
        state.profile.createdRules.push(rule);
      }),

    updateProfileRule: (ruleId, updatedRule) =>
      set((state) => {
        const ruleIndex = state.profile.createdRules.findIndex((rule) => rule.id === ruleId);
        if (ruleIndex !== -1) {
          state.profile.createdRules[ruleIndex] = {
            ...state.profile.createdRules[ruleIndex],
            ...updatedRule,
          };
        }
      }),

    removeProfileRule: (ruleId) =>
      set((state) => {
        state.profile.createdRules = state.profile.createdRules.filter((rule) => rule.id !== ruleId);
      }),

    reorderProfileRules: (newOrder) =>
      set((state) => {
        state.profile.createdRules = newOrder;
      }),

    setProfileDefaultRule: (hasDefault) =>
      set((state) => {
        state.profile.hasDefaultRule = hasDefault;
      }),

    updateProfileDefaultDistribution: (distribution) =>
      set((state) => {
        state.profile.defaultDistribution = distribution;
      }),

    // ==================== Load Factor Actions ====================
    addLoadFactorRule: (rule) =>
      set((state) => {
        state.loadFactor.createdRules.push(rule);
      }),

    updateLoadFactorRule: (ruleId, updatedRule) =>
      set((state) => {
        const ruleIndex = state.loadFactor.createdRules.findIndex((rule) => rule.id === ruleId);
        if (ruleIndex !== -1) {
          state.loadFactor.createdRules[ruleIndex] = {
            ...state.loadFactor.createdRules[ruleIndex],
            ...updatedRule,
          };
        }
      }),

    removeLoadFactorRule: (ruleId) =>
      set((state) => {
        state.loadFactor.createdRules = state.loadFactor.createdRules.filter((rule) => rule.id !== ruleId);
      }),

    reorderLoadFactorRules: (newOrder) =>
      set((state) => {
        state.loadFactor.createdRules = newOrder;
      }),

    setLoadFactorDefaultRule: (hasDefault) =>
      set((state) => {
        state.loadFactor.hasDefaultRule = hasDefault;
      }),

    updateLoadFactorDefault: (loadFactor) =>
      set((state) => {
        state.loadFactor.defaultLoadFactor = loadFactor;
      }),

    // ==================== Show-up Time Actions ====================
    addShowUpTimeRule: (rule) =>
      set((state) => {
        state.showUpTime.createdRules.push(rule);
      }),

    updateShowUpTimeRule: (ruleId, updatedRule) =>
      set((state) => {
        const ruleIndex = state.showUpTime.createdRules.findIndex((rule) => rule.id === ruleId);
        if (ruleIndex !== -1) {
          state.showUpTime.createdRules[ruleIndex] = {
            ...state.showUpTime.createdRules[ruleIndex],
            ...updatedRule,
          };
        }
      }),

    removeShowUpTimeRule: (ruleId) =>
      set((state) => {
        state.showUpTime.createdRules = state.showUpTime.createdRules.filter((rule) => rule.id !== ruleId);
      }),

    reorderShowUpTimeRules: (newOrder) =>
      set((state) => {
        state.showUpTime.createdRules = newOrder;
      }),

    setShowUpTimeDefaultRule: (hasDefault) =>
      set((state) => {
        state.showUpTime.hasDefaultRule = hasDefault;
      }),

    updateShowUpTimeDefault: ({ mean, std }) =>
      set((state) => {
        state.showUpTime.defaultMean = mean;
        state.showUpTime.defaultStd = std;
      }),

    // ==================== JSON Generation ====================
    generatePassengerJSON: () => {
      try {
        const state = get();
        
        // Unified Store에서 안전하게 airport, date 가져오기
        let airport = '';
        let date = '';
        
        try {
          const unifiedStore = useSimulationStore.getState();
          airport = unifiedStore?.context?.airport || '';
          date = unifiedStore?.context?.date || '';
        } catch (error) {
          console.warn('Failed to get unified store data:', error);
        }

      const result: any = {
        settings: {
          airport: airport || '',
          date: date || '',
          min_arrival_minutes: 15,
        },
        pax_generation: { rules: [], default: {} },
        pax_demographics: {
          nationality: { rules: [], default: {} },
          profile: { rules: [], default: {} },
        },
        pax_arrival_patterns: { rules: [], default: {} },
      };

      // Load Factor 처리
      try {
        result.pax_generation = {
          rules: (state.loadFactor?.createdRules || []).map((rule) => ({
            conditions: convertUIConditionsToBackend(rule.conditions || []),
            value: {
              load_factor: (rule.distribution?.['Load Factor'] || 80) / 100,
            },
          })),
          default:
            state.loadFactor?.defaultLoadFactor !== null
              ? { load_factor: state.loadFactor.defaultLoadFactor / 100 }
              : {},
        };
      } catch (error) {
        console.warn('Error processing load factor:', error);
      }

      // Nationality 처리  
      try {
        result.pax_demographics.nationality = {
          rules: (state.nationality?.createdRules || []).map((rule) => ({
            conditions: convertUIConditionsToBackend(rule.conditions || []),
            value: convertPercentageToDecimal(rule.distribution || {}),
          })),
          default: convertPercentageToDecimal(state.nationality?.defaultDistribution || {}),
        };
      } catch (error) {
        console.warn('Error processing nationality:', error);
      }

      // Profile 처리
      try {
        result.pax_demographics.profile = {
          rules: (state.profile?.createdRules || []).map((rule) => ({
            conditions: convertUIConditionsToBackend(rule.conditions || []),
            value: convertPercentageToDecimal(rule.distribution || {}),
          })),
          default: convertPercentageToDecimal(state.profile?.defaultDistribution || {}),
        };
      } catch (error) {
        console.warn('Error processing profile:', error);
      }

      // Show-up Time 처리
      try {
        result.pax_arrival_patterns = {
          rules: (state.showUpTime?.createdRules || []).map((rule) => ({
            conditions: convertUIConditionsToBackend(rule.conditions || []),
            value: {
              mean: rule.distribution?.mean || 120,
              std: rule.distribution?.std || 30,
            },
          })),
          default:
            state.showUpTime?.defaultMean !== null && state.showUpTime?.defaultStd !== null
              ? {
                  mean: state.showUpTime.defaultMean,
                  std: state.showUpTime.defaultStd,
                }
              : {},
        };
      } catch (error) {
        console.warn('Error processing show-up time:', error);
      }

        return result;
      } catch (error) {
        console.error('Error generating passenger JSON:', error);
        return {
          error: 'Failed to generate passenger JSON',
          message: error instanceof Error ? error.message : 'Unknown error',
          settings: { airport: '', date: '', min_arrival_minutes: 15 },
          pax_generation: { rules: [], default: {} },
          pax_demographics: {
            nationality: { rules: [], default: {} },
            profile: { rules: [], default: {} },
          },
          pax_arrival_patterns: { rules: [], default: {} },
        };
      }
    },

    // ==================== Utilities ====================
    reset: () =>
      set((state) => {
        Object.assign(state, createInitialState());
      }),
  }))
);

// ==================== Helper Hooks ====================
export const usePassengerJSON = () => {
  const generateJSON = usePassengerStore((state) => state.generatePassengerJSON);
  return generateJSON;
};
