import dayjs from 'dayjs';
import { create } from 'zustand';
import { ConditionState } from '@/types/conditions';
import {
  ChartData,
  FlightSchedule,
  PassengerPatternState,
  PassengerSchedule,
  ProcessingProcedures,
  ProcessingProcedureState,
  ScenarioHistory,
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

export const LineColors = [
  '#42307D',
  '#6941C6',
  '#9E77ED',
  '#D6BBFB',
  '#F4EBFF',
];

interface ScenarioMetadataZustand extends Partial<ScenarioMetadata> {
  setMetadata: (data: ScenarioMetadata) => void;

  setOverview: (overview: Partial<ScenarioOverview>, replace?: boolean) => void;
  setFlightSchedule: (flightSchedule: Partial<FlightSchedule>, replace?: boolean) => void;
  setPassengerSchedule: (passengerSchedule: Partial<PassengerSchedule>, replace?: boolean) => void;
  setPassengerAttr: (passengerSchedule: Partial<ProcessingProcedures>, replace?: boolean) => void;

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

  addHistoryItem: (item: ScenarioHistory) => set({ history: [...(get()?.history || []), item] }),

  setHistoryItem: (item: ScenarioHistory, index: number) =>
    set({ history: get()?.history?.map((val, idx) => (idx == index ? item : val)) }),
}));

export const useSimulationStore = create<{
  tabIndex: number;
  setTabIndex: (index: number) => void;

  checkpoint?: { time: string; diff: number };  
  setCheckpoint: (time: string, diff: number) => void;
}>((set, get) => ({
  tabIndex: 0,
  setTabIndex: (index) => set({ tabIndex: index }),

  checkpoint: undefined,

  setCheckpoint: (time, diff) => set({ checkpoint: { time, diff } }),
}));
