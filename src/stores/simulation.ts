import dayjs from 'dayjs';
import { create } from 'zustand';
import { ConditionData, ConditionState } from '@/types/conditions';
import {
  Capacity,
  ChartData,
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
} from '@/types/simulations';

export const BarColors = {
  DEFAULT: [
    '#B9C0D4',
    '#F4EBFF',
    '#E9D7FE',
    '#D6BBFB',
    '#B692F6',
    '#9E77ED',
    '#7F56D9',
    '#6941C6',
    '#53389E',
    '#42307D',
  ],
  '2': ['#D6BBFB', '#6941C6'],
  '3': ['#D6BBFB', '#9E77ED', '#6941C6'],
  '4': ['#D6BBFB', '#B692F6', '#9E77ED', '#6941C6'],
  '5': ['#D6BBFB', '#B692F6', '#9E77ED', '#7F56D9', '#6941C6'],
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

  setOverview: (overview: Partial<ScenarioOverview>, replace?: boolean) => void;
  setFlightSchedule: (flightSchedule: Partial<FlightSchedule>, replace?: boolean) => void;
  setPassengerSchedule: (passengerSchedule: Partial<PassengerSchedule>, replace?: boolean) => void;
  setPassengerAttr: (passenger_attr: Partial<ProcessingProcedures>, replace?: boolean) => void;
  setFacilityConnection: (facility_conn: Partial<FacilityConnection>, replace?: boolean) => void;
  setFacilityInformation: (facility_info: Partial<FacilityInformation>, replace?: boolean) => void;

  addHistoryItem: (item: ScenarioHistory) => void;
  setHistoryItem: (item: ScenarioHistory, index: number) => void;
}

export const useSimulationMetadata = create<ScenarioMetadataZustand>((set, get) => ({
  scenario_id: '',

  setMetadata: (data) => set({ ...data }),

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

  facilityConnCapacity?: Capacity;
  setFacilityConnCapacity: (capacity?: Capacity) => void;

  overviews?: Overview[];
  setOverviews: (overviews?: Overview[]) => void;

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

  facilityConnCapacity: undefined,
  setFacilityConnCapacity: (capacity) => set({ facilityConnCapacity: capacity }),

  overviews: undefined,
  setOverviews: (overviews) => set({ overviews }),
}));
