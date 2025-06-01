import { StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ConditionData, ConditionState } from '@/types/conditions';
import {
  Capacities,
  ChartData,
  FacilityConnection,
  FacilityInformation,
  FlightSchedule,
  PassengerSchedule,
  ProcessingProcedures,
  ScenarioHistory,
  ScenarioInfo,
  ScenarioMetadata,
  ScenarioOverview,
  SimulationResponse,
} from '@/types/simulations';

function mergeOrReplace<T>(target: T | undefined, source: Partial<T>, replace?: boolean): T | Partial<T> {
  return replace ? source : { ...target, ...source };
}

interface ScenarioSlice {
  tabIndex: number;
  setTabIndex: (index: number) => void;

  availableTabIndex: number;
  setAvailableTabIndex: (index: number) => void;

  checkpoint?: { time: string; diff: number };
  setCheckpoint: (time: string, diff: number) => void;

  scenarioInfo?: ScenarioInfo;
  setScenarioInfo: (scenarioInfo: ScenarioInfo) => void;

  conditionFilters?: ConditionData;
  setConditionFilters: (conditions?: ConditionData) => void;

  isConditionFilterEnabled: boolean;
  setIsConditionFilterEnabled: (enabled: boolean) => void;

  selectedConditions: ConditionState[];
  setSelectedConditions: (conditions: ConditionState[]) => void;

  priorities?: ConditionData;
  setPriorities: (priorities: ConditionData) => void;

  facilityConnCapacities?: Capacities;
  setFacilityConnCapacities: (capacities?: Capacities) => void;

  flightScheduleTime: number;
  setFlightScheduleTime: (time: number) => void;

  processingProcedureTime: number;
  setProcessingProcedureTime: (time: number) => void;
}

interface MetadataSlice extends Partial<ScenarioMetadata> {
  resetMetadata: () => void;
  setMetadata: (data: ScenarioMetadata) => void;

  setOverview: (overview: Partial<ScenarioOverview>, replace?: boolean) => void;

  setFlightSchedule: (flightSchedule: Partial<FlightSchedule>, replace?: boolean) => void;

  setPassengerSchedule: (passengerSchedule: Partial<PassengerSchedule>, replace?: boolean) => void;

  setPassengerAttr: (passenger_attr: Partial<ProcessingProcedures>, replace?: boolean) => void;

  setFacilityConnection: (facility_conn: Partial<FacilityConnection>, replace?: boolean) => void;

  setFacilityInformation: (facility_info: Partial<FacilityInformation>, replace?: boolean) => void;

  setSimulation: (simulation: Partial<SimulationResponse>, replace?: boolean) => void;

  addHistoryItem: (item: ScenarioHistory) => void;
  setHistoryItem: (item: ScenarioHistory, index: number) => void;

  setColorCriteria: (value: string) => void;
  setTargetDate: (value: string) => void;
  setChartData: (value: { total: number; x: string[]; data: ChartData } | undefined) => void;
}

type ScenarioStore = ScenarioSlice & MetadataSlice;

// Ref: https://github.com/pmndrs/zustand/discussions/1796
type SliceCreator<T> = StateCreator<ScenarioStore, [['zustand/devtools', never], ['zustand/immer', never]], [], T>;

// TODO: ScenarioStore와 MetadataStore가 논리적으로 정확히 분리되어 있지 않음.
const createScenarioSlice: SliceCreator<ScenarioSlice> = (set, get) => ({
  tabIndex: 0,
  setTabIndex: (index) =>
    set(
      (state) => {
        state.tabIndex = index;
        state.availableTabIndex = Math.max(index, state.availableTabIndex);
      },
      false,
      'scenario/setTabIndex'
    ),

  availableTabIndex: 1,
  setAvailableTabIndex: (index) =>
    set(
      (state) => {
        state.availableTabIndex = index;
      },
      false,
      'scenario/setAvailableTabIndex'
    ),

  checkpoint: undefined,
  setCheckpoint: (time, diff) =>
    set(
      (state) => {
        state.checkpoint = { time, diff };
      },
      false,
      'scenario/setCheckpoint'
    ),

  scenarioInfo: undefined,
  setScenarioInfo: (info) =>
    set(
      (state) => {
        state.scenarioInfo = info;
      },
      false,
      'scenario/setScenarioInfo'
    ),

  conditionFilters: undefined,
  setConditionFilters: (conditionFilters) =>
    set(
      (state) => {
        state.conditionFilters = conditionFilters;
      },
      false,
      'scenario/setConditions'
    ),

  isConditionFilterEnabled: false,
  setIsConditionFilterEnabled: (enabled) =>
    set(
      (state) => {
        state.isConditionFilterEnabled = enabled;
      },
      false,
      'scenario/setIsConditionFilterEnabled'
    ),

  selectedConditions: [],
  setSelectedConditions: (conditions) =>
    set(
      (state) => {
        state.selectedConditions = conditions;
        state.isConditionFilterEnabled = conditions.length > 0;
      },
      false,
      'scenario/setSelectedConditions'
    ),

  priorities: undefined,
  setPriorities: (priorities) =>
    set(
      (state) => {
        state.priorities = priorities;
      },
      false,
      'scenario/setPriorities'
    ),

  facilityConnCapacities: undefined,
  setFacilityConnCapacities: (capacities) =>
    set(
      (state) => {
        state.facilityConnCapacities = capacities;
      },
      false,
      'scenario/setFacilityConnCapacities'
    ),

  flightScheduleTime: 0,
  setFlightScheduleTime: (time) =>
    set(
      (state) => {
        state.flightScheduleTime = time;
      },
      false,
      'scenario/setFlightScheduleTime'
    ),

  processingProcedureTime: 0,
  setProcessingProcedureTime: (time) =>
    set(
      (state) => {
        state.processingProcedureTime = time;
      },
      false,
      'scenario/setProcessingProcedureTime'
    ),
});

const createMetadataSlice: SliceCreator<MetadataSlice> = (set, get) => ({
  scenario_id: '',

  setMetadata: (data) =>
    set(
      (state) => {
        Object.assign(state, data);
      },
      false,
      'metadata/setMetadata'
    ),

  resetMetadata: () =>
    set(
      (state) => {
        const history = state.history;
        // Object.keys(state).forEach((key) => {
        //   if (key !== 'history') {
        //     state[key] = undefined;
        //   }
        // });
        state.history = history;
      },
      false,
      'metadata/resetMetadata'
    ),

  setOverview: (overview, replace) =>
    set(
      (state) => {
        state.overview = mergeOrReplace(state.overview, overview, replace);
      },
      false,
      'metadata/setOverview'
    ),

  setFlightSchedule: (flight_sch, replace) =>
    set(
      (state) => {
        state.flight_sch = mergeOrReplace(state.flight_sch, flight_sch, replace);
      },
      false,
      'metadata/setFlightSchedule'
    ),

  setPassengerSchedule: (passenger_sch, replace) =>
    set(
      (state) => {
        state.passenger_sch = mergeOrReplace(state.passenger_sch, passenger_sch, replace);
      },
      false,
      'metadata/setPassengerSchedule'
    ),

  setPassengerAttr: (passenger_attr, replace) =>
    set(
      (state) => {
        state.passenger_attr = mergeOrReplace(state.passenger_attr, passenger_attr, replace);
      },
      false,
      'metadata/setPassengerAttr'
    ),

  setFacilityConnection: (facility_conn, replace) =>
    set(
      (state) => {
        state.facility_conn = mergeOrReplace(state.facility_conn, facility_conn, replace);
      },
      false,
      'metadata/setFacilityConnection'
    ),

  setFacilityInformation: (facility_info, replace) =>
    set(
      (state) => {
        state.facility_info = mergeOrReplace(state.facility_info, facility_info, replace);
      },
      false,
      'metadata/setFacilityInformation'
    ),

  setSimulation: (simulation, replace) =>
    set(
      (state) => {
        state.simulation = mergeOrReplace(state.simulation, simulation, replace);
      },
      false,
      'metadata/setSimulation'
    ),

  addHistoryItem: (item) =>
    set(
      (state) => {
        state.history = [...(state.history || []), item];
      },
      false,
      'metadata/addHistoryItem'
    ),

  setHistoryItem: (item, index) =>
    set(
      (state) => {
        if (state.history && state.history[index]) {
          state.history[index] = item;
        }
      },
      false,
      'metadata/setHistoryItem'
    ),

  setColorCriteria: (value) =>
    set(
      (state) => {
        state.flight_sch ??= {};
        state.flight_sch.snapshot ??= {};
        state.flight_sch.snapshot.selColorCriteria = value;
      },
      false,
      'metadata/setColorCriteria'
    ),

  setTargetDate: (value) =>
    set(
      (state) => {
        state.flight_sch ??= {};
        state.flight_sch.params ??= {};
        state.flight_sch.params.date = value;
      },
      false,
      'metadata/setTargetDate'
    ),

  setChartData: (value) =>
    set(
      (state) => {
        state.flight_sch ??= {};
        state.flight_sch.snapshot ??= {};
        state.flight_sch.snapshot.chartData = value;
      },
      false,
      'metadata/setChartData'
    ),
});

export const useScenarioStore = create<ScenarioStore>()(
  devtools(
    immer((...a) => ({
      ...createScenarioSlice(...a),
      ...createMetadataSlice(...a),
    })),
    { name: 'ScenarioStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
