"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ProcessStep } from "@/types/simulationTypes";
// Removed convertToDecimal import - no longer converting to decimals

// ==================== Passenger Types ====================
export interface PassengerData {
  settings: {
    min_arrival_minutes: number | null;
  };
  pax_generation: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: Record<string, number>;
      flightCount?: number;
    }>;
    default: {
      load_factor: number | null;
      flightCount?: number;
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
      default: Record<string, number> & { flightCount?: number };
    };
    profile: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
        flightCount?: number;
      }>;
      default: Record<string, number> & { flightCount?: number };
    };
  };
  pax_arrival_patterns: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: {
        mean: number;
        std: number;
      };
      flightCount?: number;
    }>;
    default: {
      mean: number | null;
      std: number | null;
      flightCount?: number;
    };
  };
  // 여객 차트 결과 데이터
  chartResult?: {
    total: number;
    chart_x_data: string[];
    chart_y_data?: {
      [category: string]: Array<{
        name: string;
        order: number;
        y: number[];
      }>;
    };
    summary?: {
      flights: number;
      avg_seats: number;
      load_factor: number;
      min_arrival_minutes: number;
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
    .replace(/[^a-z0-9]/g, "_") // 영문, 숫자 외 모든 문자를 언더스코어로
    .replace(/_+/g, "_") // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, ""); // 앞뒤 언더스코어 제거
};

/**
 * 여객 차트에서 최초/최종 여객 도착 시간을 찾아 운영 시간을 계산하는 함수
 * ScheduleEditor의 로직과 동일하게 처리
 * @param chartResult 여객 차트 결과 데이터
 * @param date 기준 날짜 (YYYY-MM-DD)
 * @returns 운영 시간 period 문자열
 */
const calculateOperatingPeriodFromPassengers = (
  chartResult: any,
  date: string
): string => {
  if (!chartResult?.chart_x_data || chartResult.chart_x_data.length === 0) {
    // 데이터가 없으면 기본값 (00:00-24:00)
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T")[0];
    return `${date} 00:00:00-${nextDayStr} 00:00:00`;
  }

  // chart_x_data의 첫번째와 마지막 값 직접 사용
  const firstTime = chartResult.chart_x_data[0]; // "2025-09-21 20:30"
  const lastTime =
    chartResult.chart_x_data[chartResult.chart_x_data.length - 1];

  console.log("Using chart_x_data directly - First time:", firstTime);
  console.log("Using chart_x_data directly - Last time:", lastTime);

  // 첫번째 시간에 초 추가
  const startDateTime = `${firstTime}:00`;

  // 마지막 시간 처리
  let endDateTime: string;
  const [lastDate, lastTimeOnly] = lastTime.split(" ");

  if (lastTimeOnly === "00:00") {
    // 이미 00:00이면 그대로 사용
    endDateTime = `${lastTime}:00`;
  } else {
    // 00:00이 아니면 다음날 00:00:00으로 설정
    const lastDateObj = new Date(lastDate);
    lastDateObj.setDate(lastDateObj.getDate() + 1);
    const nextDayStr = lastDateObj.toISOString().split("T")[0];
    endDateTime = `${nextDayStr} 00:00:00`;
  }

  const result = `${startDateTime}-${endDateTime}`;
  console.log("Final period result:", result);

  // 예: "2025-09-21 20:30:00-2025-09-22 00:00:00"
  return result;
};

interface LegacyProcedure {
  process: string;
  order: number;
  facility_names: string[];
}

interface Facility {
  id: string;
  operating_schedule: {
    time_blocks: Array<{
      period: string; // "YYYY-MM-DD HH:MM:SS-YYYY-MM-DD HH:MM:SS" format for API
      process_time_seconds: number;
      passenger_conditions: Array<{
        field: string;
        values: string[];
      }>;
    }>;
  };
}

/**
 * Legacy procedures를 새로운 process_flow 형태로 변환하는 헬퍼 함수
 */
const migrateProceduresToProcessFlow = (
  procedures: LegacyProcedure[]
): ProcessStep[] => {
  return procedures
    .sort((a, b) => a.order - b.order)
    .map((procedure, index: number) => {
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
      type: "departure" | "arrival";
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
        [category: string]: Array<{
          name: string;
          order: number;
          y: number[];
          acc_y: number[];
        }>;
      };
      appliedAt: string;
      // 🔧 Passenger Schedule 탭 활성화를 위한 parquet_metadata
      parquet_metadata?: Array<{
        column: string;
        values: Record<
          string,
          {
            flights: string[];
            indices: number[];
          }
        >;
      }>;
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
    type: "departure" | "arrival";
    conditions: Array<{
      field: string;
      values: string[];
    }>;
    expected_flights?: {
      selected: number;
      total: number;
    };
    originalLocalState?: Record<string, any>;
  }) => void;

  // 🆕 편의 액션들 - API 바디 형태 조작
  setFlightType: (type: "departure" | "arrival") => void;
  addCondition: (field: string, values: string[]) => void;
  removeCondition: (field: string) => void;
  updateConditionValues: (field: string, values: string[]) => void;
  toggleConditionValue: (field: string, value: string) => void;
  clearAllConditions: () => void;

  setAppliedFilterResult: (
    result: {
      total: number;
      chart_x_data: string[];
      chart_y_data: {
        [category: string]: Array<{
          name: string;
          order: number;
          y: number[];
          acc_y: number[];
        }>;
      };
      appliedAt: string;
      // 🔧 Passenger Schedule 탭 활성화를 위한 parquet_metadata
      parquet_metadata?: Array<{
        column: string;
        values: Record<
          string,
          {
            flights: string[];
            indices: number[];
          }
        >;
      }>;
    } | null
  ) => void;

  // Workflow 관련 액션들
  setCurrentStep: (step: number) => void;
  setStepCompleted: (step: number, completed: boolean) => void;
  updateAvailableSteps: () => void; // 완료된 단계에 따라 availableSteps 업데이트
  // checkStep2Completion 제거됨 - Generate Pax 버튼으로만 Step 2 완료

  // ==================== Passenger Actions ====================
  setSettings: (settings: Partial<PassengerData["settings"]>) => void;
  setPaxDemographics: (demographics: PassengerData["pax_demographics"]) => void;
  setPaxGenerationValues: (values: string[]) => void;
  setNationalityValues: (values: string[]) => void;
  setProfileValues: (values: string[]) => void;
  addPaxGenerationRule: (
    conditions: Record<string, string[]>,
    value: number | Record<string, number>,
    flightCount?: number
  ) => void;
  addNationalityRule: (
    conditions: Record<string, string[]>,
    flightCount?: number,
    value?: Record<string, number>
  ) => void;
  addProfileRule: (
    conditions: Record<string, string[]>,
    flightCount?: number,
    value?: Record<string, number>
  ) => void;
  removePaxGenerationRule: (ruleIndex: number) => void;
  removeNationalityRule: (ruleIndex: number) => void;
  removeProfileRule: (ruleIndex: number) => void;
  updatePaxGenerationValue: (
    ruleIndex: number,
    value: number | Record<string, number>
  ) => void;
  updatePaxGenerationDistribution: (
    ruleIndex: number,
    distribution: Record<string, number>
  ) => void;
  updatePaxGenerationRule: (
    ruleIndex: number,
    conditions: Record<string, string[]>,
    loadFactor: number,
    flightCount?: number
  ) => void;
  setPaxGenerationDefault: (value: number | null) => void;
  reorderPaxGenerationRules: (
    newOrder: PassengerData["pax_generation"]["rules"]
  ) => void;
  updateNationalityDistribution: (
    ruleIndex: number,
    distribution: Record<string, number>
  ) => void;
  updateNationalityRule: (
    ruleIndex: number,
    conditions: Record<string, string[]>,
    flightCount: number,
    distribution: Record<string, number>
  ) => void;
  reorderNationalityRules: (
    newOrder: PassengerData["pax_demographics"]["nationality"]["rules"]
  ) => void;
  updateProfileDistribution: (
    ruleIndex: number,
    distribution: Record<string, number>
  ) => void;
  updateProfileRule: (
    ruleIndex: number,
    conditions: Record<string, string[]>,
    flightCount: number,
    distribution: Record<string, number>
  ) => void;
  reorderProfileRules: (
    newOrder: PassengerData["pax_demographics"]["profile"]["rules"]
  ) => void;
  setNationalityDefault: (defaultValues: Record<string, number>) => void;
  setProfileDefault: (defaultValues: Record<string, number>) => void;
  reorderPaxDemographics: () => void;
  setPaxArrivalPatternRules: (
    rules: PassengerData["pax_arrival_patterns"]["rules"]
  ) => void;
  setPaxArrivalPatternDefault: (defaultValues: {
    mean: number;
    std: number;
  }) => void;
  addPaxArrivalPatternRule: (
    rule: PassengerData["pax_arrival_patterns"]["rules"][0]
  ) => void;
  updatePaxArrivalPatternRule: (
    index: number,
    rule: PassengerData["pax_arrival_patterns"]["rules"][0]
  ) => void;
  removePaxArrivalPatternRule: (index: number) => void;
  resetPassenger: () => void;
  loadPassengerMetadata: (metadata: Record<string, unknown>) => void;
  setPassengerChartResult: (chartData: PassengerData["chartResult"]) => void;

  // ==================== Processing Procedures Actions ====================
  setProcessFlow: (flow: ProcessStep[]) => void;
  convertFromProcedures: (
    procedures: Array<{
      order: number;
      process: string;
      facility_names: string[];
    }>,
    entryType?: string
  ) => void;
  setProcessCompleted: (completed: boolean) => void;
  resetProcessFlow: () => void;
  loadProcessMetadata: (metadata: Record<string, unknown>) => void;
  setFacilitiesForZone: (
    processIndex: number,
    zoneName: string,
    count: number,
    processTimeSeconds?: number
  ) => void;
  toggleFacilityTimeBlock: (
    processIndex: number,
    zoneName: string,
    facilityId: string,
    period: string
  ) => void;
  updateTravelTime: (processIndex: number, minutes: number) => void;
  updateProcessTimeForAllZones: (
    processIndex: number,
    processTimeSeconds: number
  ) => void;
  updateFacilitySchedule: (
    processIndex: number,
    zoneName: string,
    facilityId: string,
    timeBlocks: Array<{
      period: string;
      process_time_seconds: number;
      activate?: boolean; // 시설 운영 활성화 여부
      passenger_conditions: Array<{
        field: string;
        values: string[];
      }>;
    }>
  ) => void;
  migratePercentageData: () => void;

  // TODO: 사용자가 필요한 액션들을 하나씩 추가할 예정
}

// ==================== Initial State ====================
const createInitialState = (scenarioId?: string) => ({
  context: {
    scenarioId: scenarioId || "",
    airport: "", // 기본값 제거 - 사용자가 입력해야 함
    date: new Date().toISOString().split("T")[0], // 🆕 오늘 날짜로 초기화
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
        load_factor: null, // 사용자가 설정하기 전까지 null
        flightCount: 0,
      },
    },
    pax_demographics: {
      nationality: {
        available_values: [],
        rules: [],
        default: { flightCount: 0 },
      },
      profile: {
        available_values: [],
        rules: [],
        default: { flightCount: 0 },
      },
    },
    pax_arrival_patterns: {
      rules: [],
      default: {
        mean: null, // 사용자가 설정하기 전까지 null
        std: null, // 사용자가 설정하기 전까지 null
        flightCount: 0,
      },
    },
  },
  process_flow: [],
  workflow: {
    currentStep: 1,
    step1Completed: false,
    step2Completed: false,
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

        // ✅ flight 데이터 리셋 시 passenger 데이터도 완전 초기화
        Object.assign(state.passenger, {
          settings: {
            min_arrival_minutes: null,
          },
          pax_generation: {
            rules: [],
            default: {
              load_factor: null,
              flightCount: 0,
            },
          },
          pax_demographics: {
            nationality: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
            profile: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
          },
          pax_arrival_patterns: {
            rules: [],
            default: {
              mean: null,
              std: null,
              flightCount: 0,
            },
          },
          chartResult: undefined, // 차트 결과도 초기화
        });

        // ✅ flight 데이터 리셋 시 process_flow도 완전 초기화
        state.process_flow = [];

        // ✅ flight 데이터 리셋 시 workflow도 완전 리셋 (step2, step3도 false로)
        state.workflow.step1Completed = false;
        state.workflow.step2Completed = false;
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
            type: "departure",
            conditions: [{ field, values }],
          };
        } else {
          // 같은 field가 이미 있으면 제거하고 새로 추가
          state.flight.selectedConditions.conditions =
            state.flight.selectedConditions.conditions.filter(
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
          state.flight.selectedConditions.conditions =
            state.flight.selectedConditions.conditions.filter(
              (condition) => condition.field !== field
            );
        }
      }),

    updateConditionValues: (field, values) =>
      set((state) => {
        if (!state.flight.selectedConditions) {
          state.flight.selectedConditions = {
            type: "departure",
            conditions: values.length > 0 ? [{ field, values }] : [],
          };
        } else {
          const existingCondition =
            state.flight.selectedConditions.conditions.find(
              (condition) => condition.field === field
            );

          if (existingCondition) {
            if (values.length > 0) {
              existingCondition.values = values;
            } else {
              // values가 비어있으면 조건 제거
              state.flight.selectedConditions.conditions =
                state.flight.selectedConditions.conditions.filter(
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
            type: "departure",
            conditions: [{ field, values: [value] }],
          };
        } else {
          const existingCondition =
            state.flight.selectedConditions.conditions.find(
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
                state.flight.selectedConditions.conditions =
                  state.flight.selectedConditions.conditions.filter(
                    (condition) => condition.field !== field
                  );
              }
            }
          } else {
            // 새로운 조건 추가
            state.flight.selectedConditions.conditions.push({
              field,
              values: [value],
            });
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
          appliedAt: result.appliedAt || new Date().toISOString(), // 결과에 이미 있으면 사용, 없으면 생성
          parquet_metadata: result.parquet_metadata, // 🔧 parquet_metadata 포함
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

    setStepCompleted: (step, completed) => {
      set((state) => {
        if (step === 1) state.workflow.step1Completed = completed;
        else if (step === 2) state.workflow.step2Completed = completed;
      });
      // 단계 완료 후 availableSteps 업데이트
      useSimulationStore.getState().updateAvailableSteps();
    },

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

    // checkStep2Completion 함수 제거됨
    // Generate Pax 버튼 클릭을 통해서만 Step 2 완료 처리

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
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        // 올바른 순서로 nationality 객체 재구성
        const currentRules =
          state.passenger.pax_demographics.nationality.rules || [];
        const currentDefault =
          state.passenger.pax_demographics.nationality.default || {};

        // 항목이 추가되면 무조건 default 생성 및 균등분배
        let newDefault = currentDefault;
        if (values.length > 0) {
          // 균등분배 계산 (정수 백분율)
          const equalPercentage = Math.floor(100 / values.length);
          let remainder = 100 - equalPercentage * values.length;

          const equalDistribution: Record<string, number> = {};
          values.forEach((prop, index) => {
            const percentage = equalPercentage + (index < remainder ? 1 : 0);
            equalDistribution[prop] = percentage; // 정수 그대로 저장 (50 → 50)
          });

          newDefault = equalDistribution;
        } else {
          // 항목이 모두 제거되면 default도 제거
          newDefault = {};
        }

        // 🆕 기존 rules도 새로운 properties에 맞게 균등분배로 업데이트
        const updatedRules = currentRules.map((rule) => ({
          ...rule,
          value:
            values.length > 0 && Object.keys(rule.value || {}).length > 0
              ? (() => {
                  const equalPercentage = Math.floor(100 / values.length);
                  let remainder = 100 - equalPercentage * values.length;

                  const equalDistribution: Record<string, number> = {};
                  values.forEach((prop, index) => {
                    const percentage =
                      equalPercentage + (index < remainder ? 1 : 0);
                    equalDistribution[prop] = percentage; // 정수 그대로 저장
                  });
                  return equalDistribution;
                })()
              : rule.value,
        }));

        state.passenger.pax_demographics.nationality = {
          available_values: values,
          rules: updatedRules,
          default: newDefault,
        };
      }),

    setProfileValues: (values) =>
      set((state) => {
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        // 올바른 순서로 profile 객체 재구성
        const currentRules =
          state.passenger.pax_demographics.profile.rules || [];
        const currentDefault =
          state.passenger.pax_demographics.profile.default || {};

        // 항목이 추가되면 무조건 default 생성 및 균등분배
        let newDefault = currentDefault;
        if (values.length > 0) {
          // 균등분배 계산 (정수 백분율)
          const equalPercentage = Math.floor(100 / values.length);
          let remainder = 100 - equalPercentage * values.length;

          const equalDistribution: Record<string, number> = {};
          values.forEach((prop, index) => {
            const percentage = equalPercentage + (index < remainder ? 1 : 0);
            equalDistribution[prop] = percentage; // 정수 그대로 저장 (50 → 50)
          });

          newDefault = equalDistribution;
        } else {
          // 항목이 모두 제거되면 default도 제거
          newDefault = {};
        }

        // 🆕 기존 rules도 새로운 properties에 맞게 균등분배로 업데이트 (기존 rule이 있는 경우에만)
        const updatedRules = currentRules.map((rule) => ({
          ...rule,
          value:
            values.length > 0 && Object.keys(rule.value || {}).length > 0
              ? (() => {
                  const equalPercentage = Math.floor(100 / values.length);
                  let remainder = 100 - equalPercentage * values.length;

                  const equalDistribution: Record<string, number> = {};
                  values.forEach((prop, index) => {
                    const percentage =
                      equalPercentage + (index < remainder ? 1 : 0);
                    equalDistribution[prop] = percentage; // 정수 그대로 저장
                  });
                  return equalDistribution;
                })()
              : rule.value,
        }));

        state.passenger.pax_demographics.profile = {
          available_values: values,
          rules: updatedRules,
          default: newDefault,
        };
      }),

    setPaxGenerationValues: (values) =>
      set((state) => {
        // pax_generation에는 available_values가 따로 없으므로 제거
      }),

    addPaxGenerationRule: (conditions, value, flightCount) =>
      set((state) => {
        state.passenger.pax_generation.rules.push({
          conditions,
          value: typeof value === "number" ? { load_factor: value } : value,
          flightCount,
        });
      }),

    removePaxGenerationRule: (ruleIndex) =>
      set((state) => {
        state.passenger.pax_generation.rules.splice(ruleIndex, 1);
      }),

    updatePaxGenerationValue: (ruleIndex, value) =>
      set((state) => {
        if (state.passenger.pax_generation.rules[ruleIndex]) {
          if (typeof value === "number") {
            state.passenger.pax_generation.rules[ruleIndex].value.load_factor =
              value;
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

    updatePaxGenerationRule: (ruleIndex, conditions, loadFactor, flightCount) =>
      set((state) => {
        if (state.passenger.pax_generation.rules[ruleIndex]) {
          state.passenger.pax_generation.rules[ruleIndex].conditions =
            conditions;
          state.passenger.pax_generation.rules[ruleIndex].value = {
            load_factor: loadFactor,
          };
          state.passenger.pax_generation.rules[ruleIndex].flightCount =
            flightCount;
        }
      }),

    setPaxGenerationDefault: (value) => {
      set((state) => {
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        state.passenger.pax_generation.default.load_factor = value;
      });
      // 자동 완료 제거 - Generate Pax 버튼으로만 완료
    },

    reorderPaxGenerationRules: (newOrder) =>
      set((state) => {
        state.passenger.pax_generation.rules = newOrder;
      }),

    addNationalityRule: (conditions, flightCount, value = {}) =>
      set((state) => {
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
        state.passenger.pax_demographics.nationality.rules.push({
          conditions,
          value: value,
          flightCount,
        });
      }),

    addProfileRule: (conditions, flightCount, value = {}) =>
      set((state) => {
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
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
          // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
          state.passenger.pax_demographics.nationality.rules[ruleIndex].value =
            distribution;
        }
      }),

    updateNationalityRule: (ruleIndex, conditions, flightCount, distribution) =>
      set((state) => {
        if (state.passenger.pax_demographics.nationality.rules[ruleIndex]) {
          // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
          state.passenger.pax_demographics.nationality.rules[ruleIndex] = {
            conditions,
            flightCount,
            value: distribution,
          };
        }
      }),

    reorderNationalityRules: (newOrder) =>
      set((state) => {
        state.passenger.pax_demographics.nationality.rules = newOrder;
      }),

    updateProfileDistribution: (ruleIndex, distribution) =>
      set((state) => {
        if (state.passenger.pax_demographics.profile.rules[ruleIndex]) {
          // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
          state.passenger.pax_demographics.profile.rules[ruleIndex].value =
            distribution;
        }
      }),

    updateProfileRule: (ruleIndex, conditions, flightCount, distribution) =>
      set((state) => {
        if (state.passenger.pax_demographics.profile.rules[ruleIndex]) {
          // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
          state.passenger.pax_demographics.profile.rules[ruleIndex] = {
            conditions,
            flightCount,
            value: distribution,
          };
        }
      }),

    reorderProfileRules: (newOrder) =>
      set((state) => {
        state.passenger.pax_demographics.profile.rules = newOrder;
      }),

    setNationalityDefault: (defaultValues) =>
      set((state) => {
        // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
        state.passenger.pax_demographics.nationality.default = defaultValues;
      }),

    setProfileDefault: (defaultValues) =>
      set((state) => {
        // ✅ 정수 퍼센트 값 그대로 저장 (50% → 50)
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
        // 🆕 변경 감지 시 여객 차트 결과 초기화
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }

        state.passenger.pax_arrival_patterns.default = defaultValues;
      });
      // 자동 완료 제거 - Generate Pax 버튼으로만 완료
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
              load_factor: null, // 컴포넌트에서 초기값 관리
              flightCount: 0,
            },
          },
          pax_demographics: {
            // load_factor 완전 제거! pax_generation으로 이동했음
            nationality: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
            profile: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
          },
          pax_arrival_patterns: {
            rules: [],
            default: {
              mean: null, // 사용자가 설정하기 전까지 null
              std: null, // 사용자가 설정하기 전까지 null
              flightCount: 0,
            },
          },
          chartResult: undefined, // 차트 결과도 초기화
        });

        // ✅ passenger 리셋 시 관련 workflow 상태도 초기화
        state.workflow.step2Completed = false;
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }
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
              load_factor: null, // 컴포넌트에서 초기값 관리
              flightCount: 0,
            },
          },
          pax_demographics: {
            // load_factor 완전 제거! pax_generation으로 이동했음
            nationality: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
            profile: {
              available_values: [],
              rules: [],
              default: { flightCount: 0 },
            },
          },
          pax_arrival_patterns: {
            rules: [],
            default: {
              mean: null, // 사용자가 설정하기 전까지 null
              std: null, // 사용자가 설정하기 전까지 null
              flightCount: 0,
            },
          },
          ...metadata,
        });
      }),

    setPassengerChartResult: (chartData) =>
      set((state) => {
        state.passenger.chartResult = chartData;
      }),

    // 🆕 여객 차트 결과 초기화 및 Step 2 완료 상태 해제
    clearPassengerChartResult: () =>
      set((state) => {
        state.passenger.chartResult = undefined;
        state.workflow.step2Completed = false;
        // availableSteps 업데이트 - step 3 제거
        if (state.workflow.availableSteps.includes(3)) {
          state.workflow.availableSteps = state.workflow.availableSteps.filter(
            (step) => step !== 3
          );
        }
      }),

    // ==================== Processing Procedures Actions ====================

    setProcessFlow: (flow) =>
      set((state) => {
        // 모든 프로세스 이름 정규화 및 올바른 키 순서로 저장
        state.process_flow = flow.map((process) => ({
          step: process.step,
          name: normalizeProcessName(process.name),
          travel_time_minutes: process.travel_time_minutes || 0,
          entry_conditions: process.entry_conditions || [],
          zones: process.zones || {},
        }));
      }),

    convertFromProcedures: (procedures, entryType = "Entry") =>
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
        // Process completed state removed as it's no longer needed
      }),

    resetProcessFlow: () =>
      set((state) => {
        state.process_flow = [];

        // ✅ process_flow 리셋 시 관련 workflow 상태도 초기화
      }),

    loadProcessMetadata: (metadata) =>
      set((state) => {
        // 기존 procedures 형태인 경우 자동 마이그레이션
        if (
          metadata.procedures &&
          Array.isArray(metadata.procedures) &&
          !metadata.process_flow
        ) {
          const convertedFlow = migrateProceduresToProcessFlow(
            metadata.procedures
          );
          state.process_flow = convertedFlow;
        } else {
          // 이미 새로운 형태인 경우 - 프로세스 이름 정규화 적용
          const normalizedMetadata = { ...metadata };

          if (
            normalizedMetadata.process_flow &&
            Array.isArray(normalizedMetadata.process_flow)
          ) {
            normalizedMetadata.process_flow =
              normalizedMetadata.process_flow.map((process: ProcessStep) => ({
                step: process.step,
                name: normalizeProcessName(process.name), // 기존 데이터도 정규화
                travel_time_minutes: process.travel_time_minutes || 0,
                entry_conditions: process.entry_conditions || [],
                zones: process.zones || {},
              }));

            state.process_flow =
              normalizedMetadata.process_flow as ProcessStep[];
          }
        }
      }),

    setFacilitiesForZone: (processIndex, zoneName, count, processTimeSeconds) =>
      set((state) => {
        if (
          state.process_flow[processIndex] &&
          state.process_flow[processIndex].zones[zoneName]
        ) {
          // 지정된 개수만큼 facilities 생성
          const date =
            state.context.date || new Date().toISOString().split("T")[0];

          // 여객 차트 데이터가 있으면 최초 여객 도착 시간 기준으로 운영 시간 설정
          console.log(
            "chartResult in setFacilitiesForZone:",
            state.passenger.chartResult
          );
          const period = calculateOperatingPeriodFromPassengers(
            state.passenger.chartResult,
            date
          );
          console.log("Calculated period:", period);

          const facilities = Array.from({ length: count }, (_, i) => ({
            id: `${zoneName}_${i + 1}`,
            operating_schedule: {
              time_blocks: [
                {
                  period,
                  process_time_seconds: processTimeSeconds || 6,
                  passenger_conditions: [],
                },
              ],
            },
          }));

          state.process_flow[processIndex].zones[zoneName].facilities =
            facilities;
        } else {
        }
      }),

    // 개별 시설의 특정 시간 블록만 토글
    toggleFacilityTimeBlock: (processIndex, zoneName, facilityId, period) =>
      set((state) => {
        if (
          state.process_flow[processIndex] &&
          state.process_flow[processIndex].zones[zoneName]
        ) {
          const zone = state.process_flow[processIndex].zones[zoneName];
          const facility = zone.facilities?.find(
            (f: Facility) => f.id === facilityId
          );

          if (facility) {
            // 기존 스케줄 초기화
            if (!facility.operating_schedule) {
              facility.operating_schedule = { time_blocks: [] };
            }

            const timeBlocks = facility.operating_schedule.time_blocks || [];
            const [startTime] = period.split("~");

            // 시간을 분 단위로 변환
            const timeToMinutes = (timeStr: string) => {
              const [hours, minutes] = timeStr.split(":").map(Number);
              return hours * 60 + minutes;
            };

            const targetMinutes = timeToMinutes(startTime);

            // 해당 시간이 포함된 모든 기존 블록 찾기
            const overlappingBlocks = timeBlocks.filter((block) => {
              if (!block.period) return false;
              const [blockStart, blockEnd] = block.period.split("~");
              const blockStartMinutes = timeToMinutes(blockStart);
              const blockEndMinutes =
                blockEnd === "00:00" ? 24 * 60 : timeToMinutes(blockEnd);

              return (
                targetMinutes >= blockStartMinutes &&
                targetMinutes < blockEndMinutes
              );
            });

            if (overlappingBlocks.length > 0) {
              // 겹치는 블록들이 있으면 모두 제거 (체크 해제)
              overlappingBlocks.forEach((overlappingBlock) => {
                const index = timeBlocks.findIndex(
                  (block) => block.period === overlappingBlock.period
                );
                if (index !== -1) {
                  timeBlocks.splice(index, 1);
                }
              });
            } else {
              // 겹치는 블록이 없으면 새로운 10분 블록 추가 (체크)
              // period를 API 형식으로 변환
              const date =
                useSimulationStore.getState().context.date ||
                new Date().toISOString().split("T")[0];
              const [startTime, endTime] = period.split("~");
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayStr = nextDay.toISOString().split("T")[0];

              const startDateTime = `${date} ${startTime}:00`;
              const endDateTime =
                endTime === "00:00"
                  ? `${nextDayStr} 00:00:00`
                  : `${date} ${endTime}:00`;

              timeBlocks.push({
                period: `${startDateTime}-${endDateTime}`,
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

    updateProcessTimeForAllZones: (processIndex, processTimeSeconds) =>
      set((state) => {
        if (state.process_flow[processIndex]) {
          const process = state.process_flow[processIndex];
          // 모든 zone의 모든 facility에 process_time_seconds 업데이트
          Object.keys(process.zones).forEach((zoneName) => {
            const zone = process.zones[zoneName];
            if (zone.facilities) {
              zone.facilities.forEach((facility: any) => {
                if (facility.operating_schedule?.time_blocks) {
                  facility.operating_schedule.time_blocks.forEach(
                    (block: any) => {
                      block.process_time_seconds = processTimeSeconds;
                    }
                  );
                }
              });
            }
          });
        }
      }),

    updateFacilitySchedule: (processIndex, zoneName, facilityId, timeBlocks) =>
      set((state) => {
        if (
          state.process_flow[processIndex] &&
          state.process_flow[processIndex].zones[zoneName]
        ) {
          const zone = state.process_flow[processIndex].zones[zoneName];
          const facility = zone.facilities?.find(
            (f: Facility) => f.id === facilityId
          );

          if (facility) {
            // operating_schedule이 없으면 초기화
            if (!facility.operating_schedule) {
              facility.operating_schedule = { time_blocks: [] };
            }
            // timeBlocks 직접 교체
            facility.operating_schedule.time_blocks = timeBlocks;
          }
        }
      }),

    // 🔧 백분율 데이터 마이그레이션 (소수 → 정수)
    migratePercentageData: () =>
      set((state) => {
        const convertDecimalToInteger = (value: number): number => {
          return value <= 1 ? Math.round(value * 100) : value;
        };

        const migrateDistribution = (dist: Record<string, number>) => {
          const migrated: Record<string, number> = {};
          Object.entries(dist).forEach(([key, value]) => {
            migrated[key] = convertDecimalToInteger(value);
          });
          return migrated;
        };

        // Nationality 데이터 마이그레이션
        if (state.passenger.pax_demographics.nationality) {
          // Rules 마이그레이션
          state.passenger.pax_demographics.nationality.rules =
            state.passenger.pax_demographics.nationality.rules.map((rule) => ({
              ...rule,
              value: migrateDistribution(rule.value),
            }));

          // Default 마이그레이션
          if (state.passenger.pax_demographics.nationality.default) {
            state.passenger.pax_demographics.nationality.default =
              migrateDistribution(
                state.passenger.pax_demographics.nationality.default
              );
          }
        }

        // Profile 데이터 마이그레이션
        if (state.passenger.pax_demographics.profile) {
          // Rules 마이그레이션
          state.passenger.pax_demographics.profile.rules =
            state.passenger.pax_demographics.profile.rules.map((rule) => ({
              ...rule,
              value: migrateDistribution(rule.value),
            }));

          // Default 마이그레이션
          if (state.passenger.pax_demographics.profile.default) {
            state.passenger.pax_demographics.profile.default =
              migrateDistribution(
                state.passenger.pax_demographics.profile.default
              );
          }
        }
      }),

    // TODO: 사용자가 필요한 액션들을 여기에 하나씩 추가할 예정
  }))
);

// ==================== Helpers ====================
export const getSimulationInitialState = (scenarioId?: string) =>
  createInitialState(scenarioId);
