'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProcessStep } from '@/types/simulationTypes';

// ==================== Passenger Types ====================
export interface PassengerData {
  settings: {
    min_arrival_minutes: number | null;
  };
  pax_generation: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: Record<string, number>;
    }>;
    default: {
      load_factor: number | null;
    };
  };
  pax_demographics: {
    nationality: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
        flightCount?: number;
      }>;
      default: Record<string, number>;
    };
    profile: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
        flightCount?: number;
      }>;
      default: Record<string, number>;
    };
  };
  pax_arrival_patterns: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: {
        mean: number;
        std: number;
      };
    }>;
    default: {
      mean: number | null;
      std: number | null;
    };
  };
}

// ==================== Processing Procedures Helpers ====================
/**
 * 프로세스 이름을 정규화하는 공통 함수
 * 예: "Visa-Check" -> "visa_check"
 */
const normalizeProcessName = (name: string): string => {
  return name
    .toLowerCase() // 소문자 변환
    .replace(/[^a-z0-9]/g, '_') // 영문, 숫자 외 모든 문자를 언더스코어로
    .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, ''); // 앞뒤 언더스코어 제거
};

/**
 * Legacy procedures를 새로운 process_flow 형태로 변환하는 헬퍼 함수
 */
const migrateProceduresToProcessFlow = (procedures: any[]): ProcessStep[] => {
  return procedures
    .sort((a: any, b: any) => a.order - b.order)
    .map((procedure: any, index: number) => {
      const processStep = {
        step: index,
        name: normalizeProcessName(procedure.process), // 정규화 적용
        travel_time_minutes: 0, // 사용자가 UI에서 설정
        entry_conditions: [],
        zones: {} as Record<string, any>,
      };

      // facility_names를 zones로 변환 (범용적 처리)
      procedure.facility_names.forEach((facilityName: string) => {
        // Process Configuration에서는 zone만 생성, facilities는 빈 배열
        processStep.zones[facilityName] = {
          facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
        };
      });

      return processStep;
    });
};

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
      expected_flights?: {
        selected: number; // 실제 필터된 결과 수
        total: number; // 전체 항공편 수
      };
      originalLocalState?: Record<string, any>; // 🎯 원본 로컬 상태 저장 (복원용)
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
  passenger: PassengerData;
  process_flow: ProcessStep[];
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
    expected_flights?: {
      selected: number;
      total: number;
    };
  }) => void;

  // 🆕 편의 액션들 - API 바디 형태 조작
  setFlightType: (type: 'departure' | 'arrival') => void;
  addCondition: (field: string, values: string[]) => void;
  removeCondition: (field: string) => void;
  updateConditionValues: (field: string, values: string[]) => void;
  toggleConditionValue: (field: string, value: string) => void;
  clearAllConditions: () => void;

  setAppliedFilterResult: (result: any) => void;

  // Workflow 관련 액션들
  setCurrentStep: (step: number) => void;
  setStepCompleted: (step: number, completed: boolean) => void;
  updateAvailableSteps: () => void; // 완료된 단계에 따라 availableSteps 업데이트
  checkStep2Completion: () => void; // Step 2 완료 조건 확인 및 자동 완료

  // ==================== Passenger Actions ====================
  setSettings: (settings: Partial<PassengerData['settings']>) => void;
  setPaxDemographics: (demographics: PassengerData['pax_demographics']) => void;
  setPaxGenerationValues: (values: string[]) => void;
  setNationalityValues: (values: string[]) => void;
  setProfileValues: (values: string[]) => void;
  addPaxGenerationRule: (conditions: Record<string, string[]>, value: number | Record<string, number>) => void;
  addNationalityRule: (
    conditions: Record<string, string[]>,
    flightCount?: number,
    value?: Record<string, number>
  ) => void;
  addProfileRule: (conditions: Record<string, string[]>, flightCount?: number, value?: Record<string, number>) => void;
  removePaxGenerationRule: (ruleIndex: number) => void;
  removeNationalityRule: (ruleIndex: number) => void;
  removeProfileRule: (ruleIndex: number) => void;
  updatePaxGenerationValue: (ruleIndex: number, value: number | Record<string, number>) => void;
  updatePaxGenerationDistribution: (ruleIndex: number, distribution: Record<string, number>) => void;
  setPaxGenerationDefault: (value: number | null) => void;
  updateNationalityDistribution: (ruleIndex: number, distribution: Record<string, number>) => void;
  updateProfileDistribution: (ruleIndex: number, distribution: Record<string, number>) => void;
  setNationalityDefault: (defaultValues: Record<string, number>) => void;
  setProfileDefault: (defaultValues: Record<string, number>) => void;
  reorderPaxDemographics: () => void;
  setPaxArrivalPatternRules: (rules: PassengerData['pax_arrival_patterns']['rules']) => void;
  setPaxArrivalPatternDefault: (defaultValues: { mean: number; std: number }) => void;
  addPaxArrivalPatternRule: (rule: PassengerData['pax_arrival_patterns']['rules'][0]) => void;
  updatePaxArrivalPatternRule: (index: number, rule: PassengerData['pax_arrival_patterns']['rules'][0]) => void;
  removePaxArrivalPatternRule: (index: number) => void;
  resetPassenger: () => void;
  loadPassengerMetadata: (metadata: Record<string, unknown>) => void;

  // ==================== Processing Procedures Actions ====================
  setProcessFlow: (flow: ProcessStep[]) => void;
  convertFromProcedures: (
    procedures: Array<{ order: number; process: string; facility_names: string[] }>,
    entryType?: string
  ) => void;
  setProcessCompleted: (completed: boolean) => void;
  resetProcessFlow: () => void;
  loadProcessMetadata: (metadata: Record<string, unknown>) => void;
  setFacilitiesForZone: (processIndex: number, zoneName: string, count: number) => void;
  updateOperatingSchedule: (processIndex: number, zoneName: string, timeBlocks: any[]) => void;
  toggleFacilityTimeBlock: (processIndex: number, zoneName: string, facilityId: string, period: string) => void;
  updateTravelTime: (processIndex: number, minutes: number) => void;

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
    settings: {
      min_arrival_minutes: null,
    },
    pax_generation: {
      rules: [],
      default: {
        load_factor: null, // 하드코딩 완전 제거, UI에서만 설정
      },
    },
    pax_demographics: {
      nationality: {
        available_values: [],
        rules: [],
        default: {},
      },
      profile: {
        available_values: [],
        rules: [],
        default: {},
      },
    },
    pax_arrival_patterns: {
      rules: [],
      default: {
        mean: null,
        std: null,
      },
    },
  },
  process_flow: [],
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
        if (result === null) {
          state.flight.appliedFilterResult = null;
          return;
        }

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

    // Step 2 완료 조건 확인 및 자동 완료 처리
    checkStep2Completion: () =>
      set((state) => {
        // pax_arrival_patterns.default 값 확인
        const arrivalDefault = state.passenger.pax_arrival_patterns?.default;
        const hasArrivalDefault =
          arrivalDefault &&
          typeof arrivalDefault.mean === 'number' &&
          arrivalDefault.mean !== null &&
          typeof arrivalDefault.std === 'number' &&
          arrivalDefault.std !== null;

        // pax_generation.default 값 확인
        const genDefault = state.passenger.pax_generation?.default;
        const hasGenDefault =
          genDefault && typeof genDefault.load_factor === 'number' && genDefault.load_factor !== null;

        // 두 조건이 모두 만족되면 step2 완료 처리
        if (hasArrivalDefault && hasGenDefault && !state.workflow.step2Completed) {
          state.workflow.step2Completed = true;

          // step3 접근 가능하도록 업데이트
          if (!state.workflow.availableSteps.includes(3)) {
            state.workflow.availableSteps.push(3);
          }
        }
      }),

    // ==================== Passenger Actions ====================

    setSettings: (newSettings) =>
      set((state) => {
        Object.assign(state.passenger.settings, newSettings);
      }),

    setPaxDemographics: (demographics) =>
      set((state) => {
        state.passenger.pax_demographics = demographics;
      }),

    setNationalityValues: (values) =>
      set((state) => {
        // 올바른 순서로 nationality 객체 재구성
        const currentRules = state.passenger.pax_demographics.nationality.rules || [];
        const currentDefault = state.passenger.pax_demographics.nationality.default || {};

        state.passenger.pax_demographics.nationality = {
          available_values: values,
          rules: currentRules,
          default: currentDefault,
        };
      }),

    setProfileValues: (values) =>
      set((state) => {
        // 올바른 순서로 profile 객체 재구성
        const currentRules = state.passenger.pax_demographics.profile.rules || [];
        const currentDefault = state.passenger.pax_demographics.profile.default || {};

        state.passenger.pax_demographics.profile = {
          available_values: values,
          rules: currentRules,
          default: currentDefault,
        };
      }),

    setPaxGenerationValues: (values) =>
      set((state) => {
        // pax_generation에는 available_values가 따로 없으므로 제거
      }),

    addPaxGenerationRule: (conditions, value) =>
      set((state) => {
        state.passenger.pax_generation.rules.push({
          conditions,
          value: typeof value === 'number' ? { load_factor: value } : value,
        });
      }),

    removePaxGenerationRule: (ruleIndex) =>
      set((state) => {
        state.passenger.pax_generation.rules.splice(ruleIndex, 1);
      }),

    updatePaxGenerationValue: (ruleIndex, value) =>
      set((state) => {
        if (state.passenger.pax_generation.rules[ruleIndex]) {
          if (typeof value === 'number') {
            state.passenger.pax_generation.rules[ruleIndex].value.load_factor = value;
          } else {
            state.passenger.pax_generation.rules[ruleIndex].value = value;
          }
        }
      }),

    updatePaxGenerationDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.passenger.pax_generation.rules[ruleIndex]) {
          state.passenger.pax_generation.rules[ruleIndex].value = distribution;
        }
      }),

    setPaxGenerationDefault: (value) => {
      set((state) => {
        state.passenger.pax_generation.default.load_factor = value;
      });
      // Step 2 완료 조건 확인
      useSimulationStore.getState().checkStep2Completion();
    },

    addNationalityRule: (conditions, flightCount, value = {}) =>
      set((state) => {
        state.passenger.pax_demographics.nationality.rules.push({
          conditions,
          value: value,
          flightCount,
        });
      }),

    addProfileRule: (conditions, flightCount, value = {}) =>
      set((state) => {
        state.passenger.pax_demographics.profile.rules.push({
          conditions,
          value: value,
          flightCount,
        });
      }),

    removeNationalityRule: (ruleIndex) =>
      set((state) => {
        state.passenger.pax_demographics.nationality.rules.splice(ruleIndex, 1);
      }),

    removeProfileRule: (ruleIndex) =>
      set((state) => {
        state.passenger.pax_demographics.profile.rules.splice(ruleIndex, 1);
      }),

    updateNationalityDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.passenger.pax_demographics.nationality.rules[ruleIndex]) {
          state.passenger.pax_demographics.nationality.rules[ruleIndex].value = distribution;
        }
      }),

    updateProfileDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.passenger.pax_demographics.profile.rules[ruleIndex]) {
          state.passenger.pax_demographics.profile.rules[ruleIndex].value = distribution;
        }
      }),

    setNationalityDefault: (defaultValues) =>
      set((state) => {
        state.passenger.pax_demographics.nationality.default = defaultValues;
      }),

    setProfileDefault: (defaultValues) =>
      set((state) => {
        state.passenger.pax_demographics.profile.default = defaultValues;
      }),

    reorderPaxDemographics: () =>
      set((state) => {
        // nationality 재정렬 (안전하게 체크)
        if (state.passenger.pax_demographics.nationality) {
          const nationalityData = state.passenger.pax_demographics.nationality;
          state.passenger.pax_demographics.nationality = {
            available_values: nationalityData.available_values || [],
            rules: nationalityData.rules || [],
            default: nationalityData.default || {},
          };
        }

        // profile 재정렬 (안전하게 체크)
        if (state.passenger.pax_demographics.profile) {
          const profileData = state.passenger.pax_demographics.profile;
          state.passenger.pax_demographics.profile = {
            available_values: profileData.available_values || [],
            rules: profileData.rules || [],
            default: profileData.default || {},
          };
        }
      }),

    setPaxArrivalPatternRules: (rules) =>
      set((state) => {
        state.passenger.pax_arrival_patterns.rules = rules;
      }),

    setPaxArrivalPatternDefault: (defaultValues) => {
      set((state) => {
        state.passenger.pax_arrival_patterns.default = defaultValues;
      });
      // Step 2 완료 조건 확인
      useSimulationStore.getState().checkStep2Completion();
    },

    addPaxArrivalPatternRule: (rule) =>
      set((state) => {
        state.passenger.pax_arrival_patterns.rules.push(rule);
      }),

    updatePaxArrivalPatternRule: (index, rule) =>
      set((state) => {
        if (state.passenger.pax_arrival_patterns.rules[index]) {
          state.passenger.pax_arrival_patterns.rules[index] = rule;
        }
      }),

    removePaxArrivalPatternRule: (index) =>
      set((state) => {
        state.passenger.pax_arrival_patterns.rules.splice(index, 1);
      }),

    resetPassenger: () =>
      set((state) => {
        Object.assign(state.passenger, {
          settings: {
            min_arrival_minutes: null,
          },
          pax_generation: {
            rules: [],
            default: {
              load_factor: null, // 하드코딩 완전 제거
            },
          },
          pax_demographics: {
            // load_factor 완전 제거! pax_generation으로 이동했음
            nationality: {
              available_values: [],
              rules: [],
              default: {},
            },
            profile: {
              available_values: [],
              rules: [],
              default: {},
            },
          },
          pax_arrival_patterns: {
            rules: [],
            default: {
              mean: null,
              std: null,
            },
          },
        });
      }),

    loadPassengerMetadata: (metadata) =>
      set((state) => {
        Object.assign(state.passenger, {
          settings: {
            min_arrival_minutes: null,
          },
          pax_generation: {
            rules: [],
            default: {
              load_factor: null, // 하드코딩 완전 제거
            },
          },
          pax_demographics: {
            // load_factor 완전 제거! pax_generation으로 이동했음
            nationality: {
              available_values: [],
              rules: [],
              default: {},
            },
            profile: {
              available_values: [],
              rules: [],
              default: {},
            },
          },
          pax_arrival_patterns: {
            rules: [],
            default: {
              mean: null,
              std: null,
            },
          },
          ...metadata,
        });
      }),

    // ==================== Processing Procedures Actions ====================

    setProcessFlow: (flow) =>
      set((state) => {
        // 모든 프로세스 이름 정규화
        state.process_flow = flow.map((process) => ({
          ...process,
          name: normalizeProcessName(process.name),
        }));
      }),

    convertFromProcedures: (procedures, entryType = 'Entry') =>
      set((state) => {
        const convertedFlow = procedures
          .sort((a, b) => a.order - b.order) // order 기준 정렬
          .map((procedure, index) => {
            const processStep = {
              step: index,
              name: normalizeProcessName(procedure.process), // "Visa-Check" -> "visa_check"
              travel_time_minutes: 0, // 사용자가 UI에서 설정
              entry_conditions: [],
              zones: {} as Record<string, any>,
            };

            // facility_names를 zones로 변환 (범용적 처리)
            procedure.facility_names.forEach((facilityName: string) => {
              // Process Configuration에서는 zone만 생성, facilities는 빈 배열
              processStep.zones[facilityName] = {
                facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
              };
            });

            return processStep;
          });

        state.process_flow = convertedFlow;
      }),

    setProcessCompleted: (completed) =>
      set((state) => {
        state.workflow.step3Completed = completed;
      }),

    resetProcessFlow: () =>
      set((state) => {
        state.process_flow = [];
      }),

    loadProcessMetadata: (metadata) =>
      set((state) => {
        // 기존 procedures 형태인 경우 자동 마이그레이션
        if (metadata.procedures && Array.isArray(metadata.procedures) && !metadata.process_flow) {
          const convertedFlow = migrateProceduresToProcessFlow(metadata.procedures);
          state.process_flow = convertedFlow;
        } else {
          // 이미 새로운 형태인 경우 - 프로세스 이름 정규화 적용
          const normalizedMetadata = { ...metadata };

          if (normalizedMetadata.process_flow && Array.isArray(normalizedMetadata.process_flow)) {
            normalizedMetadata.process_flow = normalizedMetadata.process_flow.map((process: ProcessStep) => ({
              ...process,
              name: normalizeProcessName(process.name), // 기존 데이터도 정규화
            }));

            state.process_flow = normalizedMetadata.process_flow as ProcessStep[];
          }
        }
      }),

    setFacilitiesForZone: (processIndex, zoneName, count) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          // 지정된 개수만큼 facilities 생성
          const facilities = Array.from({ length: count }, (_, i) => ({
            id: `${zoneName}_${i + 1}`,
            operating_schedule: {}, // 빈 객체로 초기화, today 키는 컴포넌트에서 동적으로 생성
          }));

          state.process_flow[processIndex].zones[zoneName].facilities = facilities;
        }
      }),

    updateOperatingSchedule: (processIndex, zoneName, timeBlocks) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          const zone = state.process_flow[processIndex].zones[zoneName];

          if (zone.facilities) {
            // 모든 시설에 동일한 스케줄 적용
            zone.facilities.forEach((facility: any) => {
              facility.operating_schedule = {
                today: {
                  time_blocks: timeBlocks.map((block) => ({
                    period: block.period,
                    process_time_seconds: block.processTime,
                    passenger_conditions: block.conditions,
                  })),
                },
              };
            });
          }
        }
      }),

    // 개별 시설의 특정 시간 블록만 토글
    toggleFacilityTimeBlock: (processIndex, zoneName, facilityId, period) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          const zone = state.process_flow[processIndex].zones[zoneName];
          const facility = zone.facilities?.find((f: any) => f.id === facilityId);

          if (facility) {
            // 기존 스케줄 초기화
            if (!facility.operating_schedule) {
              facility.operating_schedule = {};
            }
            if (!facility.operating_schedule.today) {
              facility.operating_schedule.today = { time_blocks: [] };
            }

            const timeBlocks = facility.operating_schedule.today.time_blocks || [];
            const [startTime] = period.split('~');

            // 시간을 분 단위로 변환
            const timeToMinutes = (timeStr: string) => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            };

            const targetMinutes = timeToMinutes(startTime);

            // 해당 시간이 포함된 모든 기존 블록 찾기
            const overlappingBlocks = timeBlocks.filter((block: any) => {
              if (!block.period) return false;
              const [blockStart, blockEnd] = block.period.split('~');
              const blockStartMinutes = timeToMinutes(blockStart);
              const blockEndMinutes = blockEnd === '00:00' ? 24 * 60 : timeToMinutes(blockEnd);

              return targetMinutes >= blockStartMinutes && targetMinutes < blockEndMinutes;
            });

            if (overlappingBlocks.length > 0) {
              // 겹치는 블록들이 있으면 모두 제거 (체크 해제)
              overlappingBlocks.forEach((overlappingBlock) => {
                const index = timeBlocks.findIndex((block: any) => block.period === overlappingBlock.period);
                if (index !== -1) {
                  timeBlocks.splice(index, 1);
                }
              });
            } else {
              // 겹치는 블록이 없으면 새로운 10분 블록 추가 (체크)
              timeBlocks.push({
                period,
                process_time_seconds: 30, // 기본값 - 추후 설정 가능하도록 개선 필요
                passenger_conditions: [],
              });
            }
          }
        }
      }),

    updateTravelTime: (processIndex, minutes) =>
      set((state) => {
        if (state.process_flow[processIndex]) {
          state.process_flow[processIndex].travel_time_minutes = minutes;
        }
      }),

    // TODO: 사용자가 필요한 액션들을 여기에 하나씩 추가할 예정
  }))
);

// ==================== Helpers ====================
export const getSimulationInitialState = (scenarioId?: string) => createInitialState(scenarioId);
