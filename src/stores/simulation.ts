import dayjs from 'dayjs';
import { create } from 'zustand';
import { ConditionData, ConditionState } from '@/types/conditions';
import {
  Capacities,
  FacilityConnection,
  FacilityInformation,
  FlightSchedule,
  Overview,
  PassengerPatternState,
  PassengerSchedule,
  ProcessingProcedureState,
  ProcessingProcedures,
  ScenarioHistory,
  ScenarioInfo,
  ScenarioMetadata,
  ScenarioOverview,
  SimulationResponse,
} from '@/types/simulations';

export const BarColors = {
  DEFAULT: [
    ...[
      "#6E55E0",
      "#4C84BC",
      "#B48CF2",
      "#042440",
      "#69D6D6",
      "#545CA1",
      "#65AFFF",
      "#FF5C7A",
      "#1F2C93",
      "#F2789F",
      "#5C3C9F",
      "#FFA600",
      "#4CAF50",
      "#FF6E40",
      "#C0CA33",
      "#00B8D4",
      "#D3D3D3",
      "#7A7A7A",
    ],
    '#4C84BC',
  ],
  // '2': ['#D6BBFB', '#6941C6'],
  // '3': ['#D6BBFB', '#9E77ED', '#6941C6'],
  // '4': ['#D6BBFB', '#B692F6', '#9E77ED', '#6941C6'],
  // '5': ['#D6BBFB', '#B692F6', '#9E77ED', '#7F56D9', '#6941C6'],
  ETC: "#7A7A7A"
};

export const LineColors = ['#42307D', '#6941C6', '#9E77ED', '#D6BBFB', '#F4EBFF'];

export const SankeyColors = [
  '#F9F5FF',
  '#F4EBFF',
  '#E9D7FE',
  '#D6BBFB',
  '#B692F6',
  '#9E77ED',
  '#7F56D9',
  '#6941C6',
  '#53389E',
  '#42307D',
];

interface ScenarioMetadataZustand extends Partial<ScenarioMetadata> {
  setMetadata: (data: ScenarioMetadata) => void;
  resetMetadata: () => void;

  setOverview: (overview: Partial<ScenarioOverview>, replace?: boolean) => void;
  setFlightSchedule: (flightSchedule: Partial<FlightSchedule>, replace?: boolean) => void;
  setPassengerSchedule: (passengerSchedule: Partial<PassengerSchedule>, replace?: boolean) => void;
  setPassengerAttr: (passenger_attr: Partial<ProcessingProcedures>, replace?: boolean) => void;
  setFacilityConnection: (facility_conn: Partial<FacilityConnection>, replace?: boolean) => void;
  setFacilityInformation: (facility_info: Partial<FacilityInformation>, replace?: boolean) => void;
  setSimulation: (simulation: Partial<SimulationResponse>, replace?: boolean) => void;

  addHistoryItem: (item: ScenarioHistory) => void;
  setHistoryItem: (item: ScenarioHistory, index: number) => void;
}

export const useSimulationMetadata = create<ScenarioMetadataZustand>((set, get) => ({
  scenario_id: '',

  setMetadata: (data) => set({ ...data }),

  resetMetadata: () =>
    set({ history: get()?.history }),

  setOverview: (overview, replace) =>
    set(
      replace ? { overview } : { overview: { ...(get().overview || ({} as ScenarioOverview)), ...overview } }
    ),

  setFlightSchedule: (flight_sch, replace) =>
    set(
      replace
        ? { flight_sch }
        : { flight_sch: { ...(get().flight_sch || ({} as FlightSchedule)), ...flight_sch } }
    ),

  setPassengerSchedule: (passenger_sch, replace) =>
    set(
      replace
        ? { passenger_sch }
        : { passenger_sch: { ...(get().passenger_sch || ({} as PassengerSchedule)), ...passenger_sch } }
    ),

  setPassengerAttr: (passenger_attr, replace) =>
    set(
      replace
        ? { passenger_attr }
        : { passenger_attr: { ...(get().passenger_attr || ({} as ProcessingProcedures)), ...passenger_attr } }
    ),

  setFacilityConnection: (facility_conn, replace) =>
    set(
      replace
        ? { facility_conn }
        : { facility_conn: { ...(get().facility_conn || ({} as FacilityConnection)), ...facility_conn } }
    ),

  setFacilityInformation: (facility_info, replace) =>
    set(
      replace
        ? { facility_info }
        : { facility_info: { ...(get().facility_info || ({} as FacilityConnection)), ...facility_info } }
    ),

  setSimulation: (simulation, replace) =>
    set(
      replace
        ? { simulation }
        : { simulation: { ...(get().simulation || ({} as SimulationResponse)), ...simulation } }
    ),

  addHistoryItem: (item: ScenarioHistory) => set({ history: [...(get()?.history || []), item] }),

  setHistoryItem: (item: ScenarioHistory, index: number) =>
    set({ history: get()?.history?.map((val, idx) => (idx == index ? item : val)) }),
}));

export const useSimulationStore = create<{
  tabIndex: number;
  setTabIndex: (index: number) => void;

  availableTabIndex: number;
  setAvailableTabIndex: (index: number) => void;

  checkpoint?: { time: string; diff: number };
  setCheckpoint: (time: string, diff: number) => void;

  scenarioInfo?: ScenarioInfo;
  setScenarioInfo: (scenarioInfo: ScenarioInfo) => void;

  conditions?: ConditionData;
  setConditions: (conditions: ConditionData) => void;

  priorities?: ConditionData;
  setPriorities: (priorities: ConditionData) => void;

  facilityConnCapacities?: Capacities;
  setFacilityConnCapacities: (capacities?: Capacities) => void;

  flightScheduleTime: number;
  setFlightScheduleTime: (time: number) => void;

  processingProcedureTime: number;
  setProcessingProcedureTime: (time: number) => void;

}>((set, get) => ({
  tabIndex: 0,
  setTabIndex: (index) => {
    set({ tabIndex: index, availableTabIndex: Math.max(index, get().availableTabIndex) });
  },

  availableTabIndex: 1,
  setAvailableTabIndex: (index) => set({ availableTabIndex: index }),

  checkpoint: undefined,
  setCheckpoint: (time, diff) => set({ checkpoint: { time, diff } }),

  scenarioInfo: undefined,
  setScenarioInfo: (scenarioInfo) => set({ scenarioInfo }),

  conditions: undefined,
  setConditions: (conditions) => set({ conditions }),

  priorities: undefined,
  setPriorities: (priorities) => set({ priorities }),

  facilityConnCapacities: undefined,
  setFacilityConnCapacities: (capacities) => set({ facilityConnCapacities: capacities }),

  flightScheduleTime: 0,
  setFlightScheduleTime: (time) => set({ flightScheduleTime: time }),

  processingProcedureTime: 0,
  setProcessingProcedureTime: (time) => set({ processingProcedureTime: time }),
}));
