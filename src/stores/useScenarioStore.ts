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
  Procedure,
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
  setTargetAirport: (airport: FlightSchedule['targetAirport']) => void;
  setTargetDate: (date: FlightSchedule['targetDate']) => void;
  setChartData: (data: FlightSchedule['chartData']) => void;
  setCriterias: (criterias: FlightSchedule['criterias']) => void;
  setSelectedCriteria: (criteria: FlightSchedule['selectedCriteria']) => void;
  setFilters: (filters: FlightSchedule['filterOptions']) => void;
  setSelectedFilters: (filters: FlightSchedule['selectedFilters']) => void;
  setIsFilterEnabled: (isEnabled: FlightSchedule['isFilterEnabled']) => void;
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
  setDistributionData: (data: PassengerSchedule['distributionData']) => void;
  setVlineData: (data: PassengerSchedule['vlineData']) => void;
  setChartData: (data: PassengerSchedule['chartData']) => void;
  setCriterias: (criterias: PassengerSchedule['criterias']) => void;
  setSelectedCriteria: (criteria: PassengerSchedule['selectedCriteria']) => void;
  setFilters: (options: PassengerSchedule['filterOptions']) => void;
  setNormalDistributionParam: (index: number, param: PassengerSchedule['normalDistributionParams'][number]) => void;
  setNormalDistributionParams: (params: PassengerSchedule['normalDistributionParams']) => void;
  setPassengerPropertyParam: (index: number, param: PassengerSchedule['passengerPropertyParams'][number]) => void;
  setPassengerPropertyParams: (params: PassengerSchedule['passengerPropertyParams']) => void;
  setIsFilterEnabled: (isEnabled: PassengerSchedule['isFilterEnabled']) => void;
  setIsPassengerPropertyEnabled: (isEnabled: PassengerSchedule['isPassengerPropertyEnabled']) => void;
  resetState: () => void; // Reset state to initial values
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
  setProcedures: (procedures: Procedure[]) => void;
  setDataConnectionCriteria: (criteria: string) => void;
  resetState: () => void; // Reset state to initial values
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
  setAllocationTables: (tables: FacilityConnection['allocationTables']) => void;
  setSelectedSecondTab: (index: number) => void;
  setSnapshot: (snapshot: FacilityConnection['snapshot']) => void;
  setAllocationConditions: (conditions: FacilityConnection['allocationConditions']) => void;
  setAllocationConditionsEnabled: (conditions: FacilityConnection['allocationConditionsEnabled']) => void;
  resetState: () => void; // Reset state to initial values
}

interface FacilityConnectionSlice {
  facilityConnection: FacilityConnection & {
    actions: FacilityConnectionSliceActions;
  };
}

// ==================== FacilityCapacity ====================
interface FacilityCapacitySliceActions {
  loadMetadata: (metadata: any) => void;
  setSelectedSecondTab: (index: number) => void;
  setSelectedNodes: (nodes: number[]) => void;
  updateSelectedNode: (tabIndex: number, nodeIndex: number) => void;
  setSettings: (settings: FacilityCapacity['settings']) => void;
  updateSetting: (tabIndex: number, nodeIndex: number, setting: Partial<FacilityCapacitySetting>) => void;
  setBarChartData: (data: FacilityCapacity['barChartData']) => void;
  resetState: () => void; // Reset state to initial values
}
interface FacilityCapacitySlice {
  facilityCapacity: FacilityCapacity & {
    actions: FacilityCapacitySliceActions;
  };
}

// ==================== ScenarioStore ====================
type ScenarioStore = ScenarioProfileSlice &
  ScenarioOverviewSlice &
  FlightScheduleSlice &
  PassengerScheduleSlice &
  AirportProcessingSlice &
  FacilityConnectionSlice &
  FacilityCapacitySlice;

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
  availableScenarioTab: 1,
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
  datasource: 0,
  targetAirport: { iata: 'ICN', name: '', searchText: '' },
  targetDate: dayjs().format('YYYY-MM-DD'),
  //
  isFilterEnabled: false,
  filterOptions: null,
  selectedFilters: [],
  //
  criterias: [],
  selectedCriteria: '',
  chartData: null,
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
      setTargetAirport: (airport) =>
        set(
          (state) => {
            state.flightSchedule.targetAirport = airport;
          },
          false,
          'flightSchedule/setTargetAirport'
        ),

      setTargetDate: (date) =>
        set(
          (state) => {
            state.flightSchedule.targetDate = date;
          },
          false,
          'flightSchedule/setTargetDate'
        ),

      setChartData: (chartData) =>
        set(
          (state) => {
            state.flightSchedule.chartData = chartData;
          },
          false,
          'flightSchedule/setChartData'
        ),

      setCriterias: (criterias) =>
        set(
          (state) => {
            state.flightSchedule.criterias = criterias;
          },
          false,
          'flightSchedule/setCriterias'
        ),

      setSelectedCriteria: (selectedCriteria) =>
        set(
          (state) => {
            state.flightSchedule.selectedCriteria = selectedCriteria;
          },
          false,
          'flightSchedule/setSelectedCriteria'
        ),

      setFilters: (filters) =>
        set(
          (state) => {
            state.flightSchedule.filterOptions = filters;
          },
          false,
          'flightSchedule/setFilters'
        ),

      setSelectedFilters: (selectedFilters) =>
        set(
          (state) => {
            state.flightSchedule.selectedFilters = selectedFilters;
          },
          false,
          'flightSchedule/setSelectedFilters'
        ),

      setIsFilterEnabled: (isEnabled) =>
        set(
          (state) => {
            state.flightSchedule.isFilterEnabled = isEnabled;
          },
          false,
          'flightSchedule/setIsFilterEnabled'
        ),
    },
  },
});

// ==================== Passenger Schedule Slice Creator ====================
const initialPassengerSchedule: Omit<PassengerScheduleSlice['passengerSchedule'], 'actions'> = {
  filterOptions: null,
  criterias: [],
  selectedCriteria: '',
  //
  isFilterEnabled: false,
  normalDistributionParams: [{ conditions: [], mean: 120, stddev: 30 }],
  //
  isPassengerPropertyEnabled: false,
  passengerPropertyParams: [],
  //
  distributionData: null,
  vlineData: null,
  chartData: null,
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

      setDistributionData: (distributionData) =>
        set(
          (state) => {
            state.passengerSchedule.distributionData = distributionData;
          },
          false,
          'passengerSchedule/setDistributionData'
        ),

      setVlineData: (vlineData) =>
        set(
          (state) => {
            state.passengerSchedule.vlineData = vlineData;
          },
          false,
          'passengerSchedule/setVlineData'
        ),

      setChartData: (chartData) =>
        set(
          (state) => {
            state.passengerSchedule.chartData = chartData;
          },
          false,
          'passengerSchedule/setChartData'
        ),

      setCriterias: (criterias) =>
        set(
          (state) => {
            state.passengerSchedule.criterias = criterias;
          },
          false,
          'passengerSchedule/setCriterias'
        ),

      setSelectedCriteria: (selectedCriteria) =>
        set(
          (state) => {
            state.passengerSchedule.selectedCriteria = selectedCriteria;
          },
          false,
          'passengerSchedule/setSelectedCriteria'
        ),

      setIsFilterEnabled: (isEnabled) =>
        set(
          (state) => {
            state.passengerSchedule.isFilterEnabled = isEnabled;
          },
          false,
          'passengerSchedule/setIsFilterEnabled'
        ),

      setFilters: (filterOptions) =>
        set(
          (state) => {
            state.passengerSchedule.filterOptions = filterOptions;
          },
          false,
          'passengerSchedule/setFilterOptions'
        ),

      setNormalDistributionParam: (index, param) =>
        set(
          (state) => {
            if (index >= 0 && index < state.passengerSchedule.normalDistributionParams.length) {
              state.passengerSchedule.normalDistributionParams[index] = param;
            }
          },
          false,
          'passengerSchedule/setNormalDistributionParam'
        ),

      setNormalDistributionParams: (params) =>
        set(
          (state) => {
            state.passengerSchedule.normalDistributionParams = params;
          },
          false,
          'passengerSchedule/setNormalDistributionParams'
        ),

      setIsPassengerPropertyEnabled: (isEnabled) =>
        set(
          (state) => {
            state.passengerSchedule.isPassengerPropertyEnabled = isEnabled;
          },
          false,
          'passengerSchedule/setIsPassengerPropertyEnabled'
        ),

      setPassengerPropertyParam: (index, param) =>
        set(
          (state) => {
            if (index >= 0 && index < state.passengerSchedule.passengerPropertyParams.length) {
              state.passengerSchedule.passengerPropertyParams[index] = param;
            }
          },
          false,
          'passengerSchedule/setPassengerPropertyParam'
        ),

      setPassengerPropertyParams: (params) =>
        set(
          (state) => {
            state.passengerSchedule.passengerPropertyParams = params;
          },
          false,
          'passengerSchedule/setPassengerPropertyParams'
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
    },
  },
});

// ==================== Airport Processing Slice Creator ====================

const initialAirportProcessing: Omit<AirportProcessingSlice['airportProcessing'], 'actions'> = {
  dataConnectionCriteria: '',
  procedures: [],
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

      setDataConnectionCriteria: (criteria) =>
        set(
          (state) => {
            state.airportProcessing.dataConnectionCriteria = criteria;
          },
          false,
          'airportProcessing/setDataConnectionCriteria'
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
    },
  },
});

// ==================== Facility Connection Slice Creator ====================
const initialFacilityConnection: Omit<FacilityConnectionSlice['facilityConnection'], 'actions'> = {
  selectedSecondTab: 0,
  activedSecondTab: process.env.NODE_ENV === 'development' ? 999 : 0,
  allocationTables: [],
  allocationConditions: [],
  allocationConditionsEnabled: [],
  snapshot: null,
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
      setAllocationTables: (tables) =>
        set(
          (state) => {
            state.facilityConnection.allocationTables = tables;
          },
          false,
          'facilityConnection/setAllocations'
        ),
      setSelectedSecondTab: (index) =>
        set(
          (state) => {
            state.facilityConnection.selectedSecondTab = index;
          },
          false,
          'facilityConnection/setSelectedSecondTab'
        ),
      setSnapshot: (snapshot) =>
        set(
          (state) => {
            state.facilityConnection.snapshot = snapshot;
          },
          false,
          'facilityConnection/setSnapshot'
        ),
      setAllocationConditions: (conditions) =>
        set(
          (state) => {
            state.facilityConnection.allocationConditions = conditions;
          },
          false,
          'facilityConnection/setAllocationConditions'
        ),
      setAllocationConditionsEnabled: (conditionsEnabled) =>
        set(
          (state) => {
            state.facilityConnection.allocationConditionsEnabled = conditionsEnabled;
          },
          false,
          'facilityConnection/setAllocationConditionsEnabled'
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
    },
  },
});

// ==================== Facility Capacity Slice Creator ====================

const initialFacilityCapacity: Omit<FacilityCapacitySlice['facilityCapacity'], 'actions'> = {
  selectedSecondTab: 0,
  availableSecondTab: process.env.NODE_ENV === 'development' ? 999 : 0,
  selectedNodes: [],
  settings: {},
  barChartData: null,
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
      setSelectedSecondTab: (index) =>
        set(
          (state) => {
            state.facilityCapacity.selectedSecondTab = index;
          },
          false,
          'facilityCapacity/setSelectedSecondTab'
        ),

      setSelectedNodes: (nodes) =>
        set(
          (state) => {
            state.facilityCapacity.selectedNodes = nodes;
          },
          false,
          'facilityCapacity/setSelectedNodes'
        ),

      updateSelectedNode: (tabIndex, nodeIndex) =>
        set(
          (state) => {
            const selectedNodes = state.facilityCapacity.selectedNodes;
            if (selectedNodes[tabIndex] !== nodeIndex) {
              selectedNodes[tabIndex] = nodeIndex;
            } else {
              selectedNodes[tabIndex] = -1; // 선택 해제
            }
          },
          false,
          'facilityCapacity/updateSelectedNode'
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

      setBarChartData: (data) =>
        set(
          (state) => {
            state.facilityCapacity.barChartData = data;
          },
          false,
          'facilityCapacity/setBarChartData'
        ),

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
    })),
    { name: 'ScenarioStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
