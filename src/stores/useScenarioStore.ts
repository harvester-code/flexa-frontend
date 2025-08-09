import dayjs from 'dayjs';
import { StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AirportProcessing,
  FacilityCapacity,
  FacilityCapacitySetting,
  FacilityConnection,
  FlightSchedule,
  PassengerSchedule,
  ScenarioOverview,
} from '@/types/scenarios';

// ==================== ScenarioProfile ====================
interface ScenarioProfileSliceActions {
  loadMetadata: (metadata: any) => void;
  setCheckpoint: (checkpoint: { time: string; diff: number }) => void;
  setScenarioName: (name: string) => void;
  setScenarioTerminal: (terminal: string) => void;
  setCurrentScenarioTab: (index: number) => void;
  setAvailableScenarioTab: (index: number) => void;
}

interface ScenarioProfileSlice {
  scenarioProfile: {
    checkpoint: { time: string; diff: number } | null;
    scenarioName: string;
    scenarioTerminal: string;
    scenarioHistory: {
      checkpoint: string;
      updated_at?: string;
      simulation: 'Done' | 'Yet';
      memo: string;
      error_count: number;
    }[];
    currentScenarioTab: number;
    availableScenarioTab: number;
    // ---
    actions: ScenarioProfileSliceActions;
  };
}

// ==================== ScenarioOverview ====================
interface ScenarioOverviewSliceActions {
  loadMetadata: (metadata: any) => void;
  setMatrix: (matrix: ScenarioOverview['matrix']) => void;
  resetState: () => void; // Reset state to initial values
}
interface ScenarioOverviewSlice {
  scenarioOverview: ScenarioOverview & {
    // ---
    actions: ScenarioOverviewSliceActions;
  };
}

// ==================== FlightSchedule ====================
interface FlightScheduleSliceActions {
  loadMetadata: (metadata: any) => void;
  setAirport: (airport: FlightSchedule['airport']) => void;
  setDate: (date: FlightSchedule['date']) => void;
  setAvailableConditions: (availableConditions: FlightSchedule['availableConditions']) => void;
  setSelectedConditions: (selectedConditions: FlightSchedule['selectedConditions']) => void;
  setChartData: (chartData: FlightSchedule['chartData']) => void;
  setIsCompleted: (isCompleted: boolean) => void;
}
interface FlightScheduleSlice {
  flightSchedule: FlightSchedule & {
    // ---
    actions: FlightScheduleSliceActions;
  };
}

// ==================== PassengerSchedule ====================
interface PassengerScheduleSliceActions {
  loadMetadata: (metadata: any) => void;
  setDestributionConditions: (conditions: PassengerSchedule['destribution_conditions']) => void;
  setApiResponseData: (data: PassengerSchedule['apiResponseData']) => void;
  resetState: () => void; // Reset state to initial values
  setIsCompleted: (isCompleted: boolean) => void;
}
interface PassengerScheduleSlice {
  passengerSchedule: PassengerSchedule & {
    // ---
    actions: PassengerScheduleSliceActions;
  };
}

// ==================== AirportProcessing ====================
interface AirportProcessingSliceActions {
  loadMetadata: (metadata: any) => void;
  setProcedures: (procedures: Array<{ order: number; process: string; facility_names: string[] }>) => void;
  setEntryType: (entryType: string) => void;
  resetState: () => void; // Reset state to initial values
  setIsCompleted: (isCompleted: boolean) => void;
}

interface AirportProcessingSlice {
  airportProcessing: AirportProcessing & {
    // ---
    actions: AirportProcessingSliceActions;
  };
}

// ==================== FacilityConnection ====================
interface FacilityConnectionSliceActions {
  loadMetadata: (metadata: any) => void;
  setProcesses: (processes: FacilityConnection['processes']) => void;
  generateProcessesFromProcedures: (
    procedures: Array<{ order: number; process: string; facility_names: string[] }>,
    entryType: string
  ) => void;
  resetState: () => void; // Reset state to initial values
  setIsCompleted: (isCompleted: boolean) => void;
}

interface FacilityConnectionSlice {
  facilityConnection: FacilityConnection & {
    actions: FacilityConnectionSliceActions;
  };
}

// ==================== FacilityCapacity ====================
interface FacilityCapacitySliceActions {
  loadMetadata: (metadata: any) => void;
  setSelectedNodes: (nodes: number[]) => void;
  setSettings: (settings: FacilityCapacity['settings']) => void;
  updateSetting: (tabIndex: number, nodeIndex: number, setting: Partial<FacilityCapacitySetting>) => void;
  resetState: () => void; // Reset state to initial values
  setIsCompleted: (isCompleted: boolean) => void;
  // UI-only actions removed: setSelectedSecondTab, updateSelectedNode, setBarChartData
}
interface FacilityCapacitySlice {
  facilityCapacity: FacilityCapacity & {
    actions: FacilityCapacitySliceActions;
  };
}

// ==================== Tab Validation ====================
interface TabValidationSlice {
  tabValidation: {
    isScenarioOverviewValid: () => boolean;
    isFlightScheduleValid: () => boolean;
    isPassengerScheduleValid: () => boolean;
    isProcessingProceduresValid: () => boolean;
    isFacilityConnectionValid: () => boolean;
    isFacilityInformationValid: () => boolean;
    isTabValid: (tabIndex: number) => boolean;
    getValidTabCount: () => number;
  };
}

// ==================== ScenarioStore ====================
type ScenarioStore = ScenarioProfileSlice &
  ScenarioOverviewSlice &
  FlightScheduleSlice &
  PassengerScheduleSlice &
  AirportProcessingSlice &
  FacilityConnectionSlice &
  FacilityCapacitySlice &
  TabValidationSlice & {
    loadCompleteS3Metadata: (s3Response: any) => void;
  };

// Ref: https://github.com/pmndrs/zustand/discussions/1796
type SliceCreator<T> = StateCreator<ScenarioStore, [['zustand/devtools', never], ['zustand/immer', never]], [], T>;

// ==================== Scenario Profile Slice Creator ====================
const initialScenarioProfile: Omit<ScenarioProfileSlice['scenarioProfile'], 'actions'> = {
  checkpoint: null,
  scenarioName: '',
  scenarioTerminal: '',
  scenarioHistory: [],
  currentScenarioTab: 0,
  // availableScenarioTab: process.env.NODE_ENV === 'development' ? 999 : 0,
  availableScenarioTab: 2, // Flight Schedule 탭(인덱스 1)까지는 항상 활성화
};

const createScenarioProfileSlice: SliceCreator<ScenarioProfileSlice> = (set, get) => ({
  scenarioProfile: {
    ...initialScenarioProfile,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.scenarioProfile = {
              ...initialScenarioProfile,
              ...metadata,
              actions: state.scenarioProfile.actions,
            };
          },
          false,
          'scenarioProfile/loadMetadata'
        ),

      setCheckpoint: (checkpoint) =>
        set(
          (state) => {
            state.scenarioProfile.checkpoint = checkpoint;
          },
          false,
          'scenarioProfile/setCheckpoint'
        ),
      setScenarioName: (name) =>
        set(
          (state) => {
            state.scenarioProfile.scenarioName = name;
          },
          false,
          'scenarioProfile/setScenarioName'
        ),
      setScenarioTerminal: (terminal) =>
        set(
          (state) => {
            state.scenarioProfile.scenarioTerminal = terminal;
          },
          false,
          'scenarioProfile/setScenarioTerminal'
        ),
      setCurrentScenarioTab: (index) =>
        set(
          (state) => {
            state.scenarioProfile.currentScenarioTab = index;
          },
          false,
          'scenarioProfile/setCurrentScenarioTab'
        ),
      setAvailableScenarioTab: (index) =>
        set(
          (state) => {
            state.scenarioProfile.availableScenarioTab = index;
          },
          false,
          'scenarioProfile/setAvailableScenarioTab'
        ),
    },
  },
});

// ==================== Senario Overview Slice Creator ====================
const initialScenarioOverview: Omit<ScenarioOverviewSlice['scenarioOverview'], 'actions'> = {
  matrix: [],
};

const createScenarioOverviewSlice: SliceCreator<ScenarioOverviewSlice> = (set, get) => ({
  scenarioOverview: {
    ...initialScenarioOverview,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.scenarioOverview = {
              ...initialScenarioOverview,
              ...metadata,
              actions: state.scenarioOverview.actions,
            };
          },
          false,
          'scenarioOverview/loadMetadata'
        ),

      setMatrix: (matrix) =>
        set(
          (state) => {
            state.scenarioOverview.matrix = matrix;
          },
          false,
          'scenarioOverview/setMatrix'
        ),

      resetState: () =>
        set(
          (state) => {
            state.scenarioOverview = {
              ...initialScenarioOverview,
              actions: state.scenarioOverview.actions,
            };
          },
          false,
          'scenarioOverview/resetState'
        ),
    },
  },
});

// ==================== Flight Schedule Slice Creator ====================
const initialFlightSchedule: Omit<FlightScheduleSlice['flightSchedule'], 'actions'> = {
  airport: 'ICN',
  date: dayjs().format('YYYY-MM-DD'),
  availableConditions: {
    types: { International: [], Domestic: [] },
    terminals: {},
    airlines: [],
  },
  selectedConditions: {
    types: [],
    terminal: [],
    selectedAirlines: [],
  },
  total: 0,
  chartData: null,
  isCompleted: false,
};

const createFlightScheduleSlice: SliceCreator<FlightScheduleSlice> = (set, get) => ({
  flightSchedule: {
    ...initialFlightSchedule,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.flightSchedule = {
              ...initialFlightSchedule,
              ...metadata,
              actions: state.flightSchedule.actions,
            };
          },
          false,
          'flightSchedule/loadMetadata'
        ),
      setAirport: (airport) =>
        set(
          (state) => {
            state.flightSchedule.airport = airport;
          },
          false,
          'flightSchedule/setAirport'
        ),

      setDate: (date) =>
        set(
          (state) => {
            state.flightSchedule.date = date;
          },
          false,
          'flightSchedule/setDate'
        ),

      setChartData: (chartData) =>
        set(
          (state) => {
            state.flightSchedule.chartData = chartData;
          },
          false,
          'flightSchedule/setChartData'
        ),
      setAvailableConditions: (availableConditions) =>
        set(
          (state) => {
            state.flightSchedule.availableConditions = availableConditions;

            // S3에서 로드된 경우가 아닌 초기 상태에서만 자동 계산
            // isCompleted가 이미 true라면 S3에서 로드된 것으로 간주하고 유지
            if (!state.flightSchedule.isCompleted) {
              // availableConditions에 값이 하나라도 채워져 있으면 완료 상태로 설정
              const hasData =
                availableConditions.types.International.length > 0 ||
                availableConditions.types.Domestic.length > 0 ||
                Object.keys(availableConditions.terminals).some(
                  (key) =>
                    Array.isArray(availableConditions.terminals[key]) && availableConditions.terminals[key].length > 0
                ) ||
                availableConditions.airlines.length > 0;

              state.flightSchedule.isCompleted = hasData;
            }
          },
          false,
          'flightSchedule/setAvailableConditions'
        ),
      setSelectedConditions: (selectedConditions) =>
        set(
          (state) => {
            state.flightSchedule.selectedConditions = selectedConditions;
            // 조건 변경 시에는 적용 상태를 초기화하지 않음 (Apply 후에만 상태 변경)
          },
          false,
          'flightSchedule/setSelectedConditions'
        ),
      setIsCompleted: (isCompleted) =>
        set(
          (state) => {
            const wasCompleted = state.flightSchedule.isCompleted;
            state.flightSchedule.isCompleted = isCompleted;

            // 상태가 변경되고 완료된 경우에만 후속 탭 초기화 (탭 인덱스 1: Flight Schedule)
            if (isCompleted && wasCompleted !== isCompleted) {
              // Passenger Schedule (탭 2) 초기화
              state.passengerSchedule = {
                ...initialPassengerSchedule,
                actions: state.passengerSchedule.actions,
              };

              // Processing Procedures (탭 3) 초기화
              state.airportProcessing = {
                ...initialAirportProcessing,
                actions: state.airportProcessing.actions,
              };

              // Facility Connection (탭 4) 초기화
              state.facilityConnection = {
                ...initialFacilityConnection,
                actions: state.facilityConnection.actions,
              };

              // Facility Information (탭 5) 초기화
              state.facilityCapacity = {
                ...initialFacilityCapacity,
                actions: state.facilityCapacity.actions,
              };
            }
          },
          false,
          'flightSchedule/setIsCompleted'
        ),
    },
  },
});

// ==================== Passenger Schedule Slice Creator ====================
const initialPassengerSchedule: Omit<PassengerScheduleSlice['passengerSchedule'], 'actions'> = {
  destribution_conditions: [],
  isCompleted: false,
  apiResponseData: null,
};

const createPassengerScheduleSlice: SliceCreator<PassengerScheduleSlice> = (set, get) => ({
  passengerSchedule: {
    ...initialPassengerSchedule,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.passengerSchedule = {
              ...initialPassengerSchedule,
              ...metadata,
              actions: state.passengerSchedule.actions,
            };
          },
          false,
          'passengerSchedule/loadMetadata'
        ),

      setDestributionConditions: (conditions) =>
        set(
          (state) => {
            state.passengerSchedule.destribution_conditions = conditions;
          },
          false,
          'passengerSchedule/setDestributionConditions'
        ),

      setApiResponseData: (data) =>
        set(
          (state) => {
            state.passengerSchedule.apiResponseData = data;
          },
          false,
          'passengerSchedule/setApiResponseData'
        ),

      resetState: () =>
        set(
          (state) => {
            state.passengerSchedule = {
              ...initialPassengerSchedule,
              actions: state.passengerSchedule.actions,
            };
          },
          false,
          'passengerSchedule/resetState'
        ),
      setIsCompleted: (isCompleted) =>
        set(
          (state) => {
            const wasCompleted = state.passengerSchedule.isCompleted;
            state.passengerSchedule.isCompleted = isCompleted;

            // 상태가 변경되고 완료된 경우에만 후속 탭 초기화 (탭 인덱스 2: Passenger Schedule)
            if (isCompleted && wasCompleted !== isCompleted) {
              // Processing Procedures (탭 3) 초기화
              state.airportProcessing = {
                ...initialAirportProcessing,
                actions: state.airportProcessing.actions,
              };

              // Facility Connection (탭 4) 초기화
              state.facilityConnection = {
                ...initialFacilityConnection,
                actions: state.facilityConnection.actions,
              };

              // Facility Information (탭 5) 초기화
              state.facilityCapacity = {
                ...initialFacilityCapacity,
                actions: state.facilityCapacity.actions,
              };
            }
          },
          false,
          'passengerSchedule/setIsCompleted'
        ),
    },
  },
});

// ==================== Airport Processing Slice Creator ====================

const initialAirportProcessing: Omit<AirportProcessingSlice['airportProcessing'], 'actions'> = {
  procedures: [],
  entryType: 'Airline',
  isCompleted: false,
};

const createAirportProcessingSlice: SliceCreator<AirportProcessingSlice> = (set, get) => ({
  airportProcessing: {
    ...initialAirportProcessing,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.airportProcessing = {
              ...initialAirportProcessing,
              ...metadata,
              actions: state.airportProcessing.actions,
            };
          },
          false,
          'airportProcessing/loadMetadata'
        ),
      setProcedures: (procedures) =>
        set(
          (state) => {
            state.airportProcessing.procedures = procedures;
          },
          false,
          'airportProcessing/setProcedures'
        ),

      setEntryType: (entryType) =>
        set(
          (state) => {
            state.airportProcessing.entryType = entryType;
          },
          false,
          'airportProcessing/setEntryType'
        ),

      resetState: () =>
        set(
          (state) => {
            state.airportProcessing = {
              ...initialAirportProcessing,
              actions: state.airportProcessing.actions,
            };
          },
          false,
          'airportProcessing/resetState'
        ),
      setIsCompleted: (isCompleted) =>
        set(
          (state) => {
            const wasCompleted = state.airportProcessing.isCompleted;
            state.airportProcessing.isCompleted = isCompleted;

            // 상태가 변경되고 완료된 경우에만 후속 탭 초기화 (탭 인덱스 3: Processing Procedures)
            if (isCompleted && wasCompleted !== isCompleted) {
              // Facility Connection (탭 4) 초기화
              state.facilityConnection = {
                ...initialFacilityConnection,
                actions: state.facilityConnection.actions,
              };

              // Facility Information (탭 5) 초기화
              state.facilityCapacity = {
                ...initialFacilityCapacity,
                actions: state.facilityCapacity.actions,
              };
            }
          },
          false,
          'airportProcessing/setIsCompleted'
        ),
    },
  },
});

// ==================== Facility Connection Slice Creator ====================
const initialFacilityConnection: Omit<FacilityConnectionSlice['facilityConnection'], 'actions'> = {
  processes: {},
  isCompleted: false,
};

const createFacilityConnectionSlice: SliceCreator<FacilityConnectionSlice> = (set, get) => ({
  facilityConnection: {
    ...initialFacilityConnection,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.facilityConnection = {
              ...initialFacilityConnection,
              ...metadata,
              actions: state.facilityConnection.actions,
            };
          },
          false,
          'facilityConnection/loadMetadata'
        ),
      setProcesses: (processes) =>
        set(
          (state) => {
            state.facilityConnection.processes = processes;
          },
          false,
          'facilityConnection/setProcesses'
        ),

      generateProcessesFromProcedures: (procedures, entryType) =>
        set(
          (state) => {
            console.log('🔧 generateProcessesFromProcedures called:', { procedures, entryType });

            const processesObj: Record<string, any> = {};

            // Entry process (항상 인덱스 0)
            processesObj['0'] = {
              name: entryType,
              nodes: [],
              source: null,
              destination: procedures.length > 0 ? '1' : null,
              default_matrix: null,
              priority_matrix: null,
            };

            // 사용자가 추가한 프로세스들
            procedures.forEach((procedure, index) => {
              const processIndex = (index + 1).toString();
              processesObj[processIndex] = {
                name: procedure.process.toLowerCase().replace(/\s+/g, '_'),
                nodes: procedure.facility_names,
                source: index === 0 ? '0' : index.toString(),
                destination: index === procedures.length - 1 ? null : (index + 2).toString(),
                default_matrix: {}, // 빈 객체로 초기화
                priority_matrix: null,
              };
            });

            console.log('🚀 Generated processes:', processesObj);
            state.facilityConnection.processes = processesObj;
          },
          false,
          'facilityConnection/generateProcessesFromProcedures'
        ),

      resetState: () =>
        set(
          (state) => {
            state.facilityConnection = {
              ...initialFacilityConnection,
              actions: state.facilityConnection.actions,
            };
          },
          false,
          'facilityConnection/resetState'
        ),
      setIsCompleted: (isCompleted) =>
        set(
          (state) => {
            const wasCompleted = state.facilityConnection.isCompleted;
            state.facilityConnection.isCompleted = isCompleted;

            // 상태가 변경되고 완료된 경우에만 후속 탭 초기화 (탭 인덱스 4: Facility Connection)
            if (isCompleted && wasCompleted !== isCompleted) {
              // Facility Information (탭 5) 초기화
              state.facilityCapacity = {
                ...initialFacilityCapacity,
                actions: state.facilityCapacity.actions,
              };
            }
          },
          false,
          'facilityConnection/setIsCompleted'
        ),
    },
  },
});

// ==================== Facility Capacity Slice Creator ====================

const initialFacilityCapacity: Omit<FacilityCapacitySlice['facilityCapacity'], 'actions'> = {
  selectedNodes: [],
  settings: {},
  isCompleted: false,
};

const createFacilityCapacitySlice: SliceCreator<FacilityCapacitySlice> = (set, get) => ({
  facilityCapacity: {
    ...initialFacilityCapacity,

    actions: {
      loadMetadata: (metadata) =>
        set(
          (state) => {
            state.facilityCapacity = {
              ...initialFacilityCapacity,
              ...metadata,
              actions: state.facilityCapacity.actions,
            };
          },
          false,
          'facilityCapacity/loadMetadata'
        ),
      // UI-only actions removed: setSelectedSecondTab, updateSelectedNode

      setSelectedNodes: (nodes) =>
        set(
          (state) => {
            state.facilityCapacity.selectedNodes = nodes;
          },
          false,
          'facilityCapacity/setSelectedNodes'
        ),

      setSettings: (settings) =>
        set(
          (state) => {
            state.facilityCapacity.settings = settings;
          },
          false,
          'facilityCapacity/setSettings'
        ),

      updateSetting: (tabIndex, nodeIndex, setting) =>
        set(
          (state) => {
            const settings = state.facilityCapacity.settings;
            const targetKey = `${tabIndex}_${nodeIndex}`;

            if (settings) settings[targetKey] = { ...settings[targetKey], ...setting };
          },
          false,
          'facilityCapacity/updateSetting'
        ),

      // UI-only action removed: setBarChartData

      resetState: () =>
        set(
          (state) => {
            state.facilityCapacity = {
              ...initialFacilityCapacity,
              actions: state.facilityCapacity.actions,
            };
          },
          false,
          'facilityCapacity/resetState'
        ),
      setIsCompleted: (isCompleted) =>
        set(
          (state) => {
            const wasCompleted = state.facilityCapacity.isCompleted;
            state.facilityCapacity.isCompleted = isCompleted;

            // 마지막 탭이므로 후속 탭 초기화 없음 (탭 인덱스 5: Facility Information)
            if (isCompleted && wasCompleted !== isCompleted) {
            }
          },
          false,
          'facilityCapacity/setIsCompleted'
        ),
    },
  },
});

// ==================== Tab Validation Slice Creator ====================
const createTabValidationSlice: SliceCreator<TabValidationSlice> = (set, get) => ({
  tabValidation: {
    isScenarioOverviewValid: () => {
      const state = get();
      return !!(state.scenarioProfile.scenarioName && state.scenarioProfile.scenarioTerminal);
    },

    isFlightScheduleValid: () => {
      // Flight Schedule 탭은 항상 활성화
      return true;
    },

    isPassengerScheduleValid: () => {
      const state = get();
      const ps = state.passengerSchedule;
      return (
        ps.destribution_conditions.length > 0 &&
        ps.destribution_conditions.every((p) => p.mean > 0 && p.standard_deviation > 0)
      );
    },

    isProcessingProceduresValid: () => {
      const state = get();
      const ap = state.airportProcessing;
      // procedures 배열에 프로세스가 있는지 확인
      return ap.procedures.length > 0;
    },

    isFacilityConnectionValid: () => {
      const state = get();
      const fc = state.facilityConnection;
      return fc.allocationTables.length > 0;
    },

    isFacilityInformationValid: () => {
      const state = get();
      const fi = state.facilityCapacity;
      return fi.selectedNodes.length > 0 && Object.keys(fi.settings).length > 0;
    },

    isTabValid: (tabIndex: number) => {
      const validation = get().tabValidation;
      const validationMap = {
        0: validation.isScenarioOverviewValid,
        1: validation.isFlightScheduleValid,
        2: validation.isPassengerScheduleValid,
        3: validation.isProcessingProceduresValid,
        4: validation.isFacilityConnectionValid,
        5: validation.isFacilityInformationValid,
        6: () => true, // Simulation tab - always available if reached
      };
      return validationMap[tabIndex]?.() || false;
    },

    getValidTabCount: () => {
      const validation = get().tabValidation;
      for (let i = 0; i < 7; i++) {
        if (!validation.isTabValid(i)) {
          return i;
        }
      }
      return 7; // All tabs valid
    },
  },
});

// ==================== Scenario Store ====================
export const useScenarioStore = create<ScenarioStore>()(
  devtools(
    immer((set, get, ...rest) => ({
      ...createScenarioProfileSlice(set, get, ...rest),
      ...createScenarioOverviewSlice(set, get, ...rest),
      ...createFlightScheduleSlice(set, get, ...rest),
      ...createPassengerScheduleSlice(set, get, ...rest),
      ...createAirportProcessingSlice(set, get, ...rest),
      ...createFacilityConnectionSlice(set, get, ...rest),
      ...createFacilityCapacitySlice(set, get, ...rest),
      ...createTabValidationSlice(set, get, ...rest),

      // ==================== Global S3 Metadata Loader ====================
      loadCompleteS3Metadata: (s3Response: any) => {
        set(
          (state) => {
            const metadata = s3Response?.metadata || {};
            const tabs = metadata?.tabs || {};

            // ScenarioProfile 데이터 로드
            const overview = tabs.overview || {};
            if (overview.scenarioName) state.scenarioProfile.scenarioName = overview.scenarioName;
            if (overview.scenarioTerminal) state.scenarioProfile.scenarioTerminal = overview.scenarioTerminal;
            if (typeof overview.currentScenarioTab === 'number')
              state.scenarioProfile.currentScenarioTab = overview.currentScenarioTab;
            if (typeof overview.availableScenarioTab === 'number')
              state.scenarioProfile.availableScenarioTab = overview.availableScenarioTab;
            if (overview.scenarioHistory) state.scenarioProfile.scenarioHistory = overview.scenarioHistory;
            if (overview.checkpoint) state.scenarioProfile.checkpoint = overview.checkpoint;

            // ScenarioOverview 데이터 로드
            if (overview.matrix) state.scenarioOverview.matrix = overview.matrix;

            // FlightSchedule 데이터 로드
            const flightSchedule = tabs.flightSchedule || {};
            if (flightSchedule.airport) state.flightSchedule.airport = flightSchedule.airport;
            if (flightSchedule.date) state.flightSchedule.date = flightSchedule.date;
            if (flightSchedule.availableConditions)
              state.flightSchedule.availableConditions = flightSchedule.availableConditions;
            if (flightSchedule.selectedConditions)
              state.flightSchedule.selectedConditions = flightSchedule.selectedConditions;
            if (flightSchedule.chartData) state.flightSchedule.chartData = flightSchedule.chartData;
            if (typeof flightSchedule.isCompleted === 'boolean')
              state.flightSchedule.isCompleted = flightSchedule.isCompleted;

            // PassengerSchedule 데이터 로드
            const passengerSchedule = tabs.passengerSchedule || {};
            if (passengerSchedule.destribution_conditions)
              state.passengerSchedule.destribution_conditions = passengerSchedule.destribution_conditions;
            if (passengerSchedule.apiResponseData)
              state.passengerSchedule.apiResponseData = passengerSchedule.apiResponseData;
            if (typeof passengerSchedule.isCompleted === 'boolean')
              state.passengerSchedule.isCompleted = passengerSchedule.isCompleted;

            // AirportProcessing 데이터 로드
            const processingProcedures = tabs.processingProcedures || {};
            if (processingProcedures.procedures) state.airportProcessing.procedures = processingProcedures.procedures;
            if (processingProcedures.entryType) state.airportProcessing.entryType = processingProcedures.entryType;
            if (typeof processingProcedures.isCompleted === 'boolean')
              state.airportProcessing.isCompleted = processingProcedures.isCompleted;

            // FacilityConnection 데이터 로드
            const facilityConnection = tabs.facilityConnection || {};
            if (facilityConnection.processes) state.facilityConnection.processes = facilityConnection.processes;
            if (typeof facilityConnection.isCompleted === 'boolean')
              state.facilityConnection.isCompleted = facilityConnection.isCompleted;

            // FacilityCapacity 데이터 로드
            const facilityInformation = tabs.facilityInformation || {};
            if (facilityInformation.selectedNodes)
              state.facilityCapacity.selectedNodes = facilityInformation.selectedNodes;
            if (facilityInformation.settings) state.facilityCapacity.settings = facilityInformation.settings;
            if (typeof facilityInformation.isCompleted === 'boolean')
              state.facilityCapacity.isCompleted = facilityInformation.isCompleted;
          },
          false,
          'loadCompleteS3Metadata'
        );
      },
    })),
    { name: 'ScenarioStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
