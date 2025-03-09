import dayjs from 'dayjs';
import { create } from 'zustand';
import { IChartData } from '@/api/simulations';
import { IConditionData, IConditionState } from '@/components/Conditions';

export interface IScenarioHistory {
  checkpoint: string;
  updated_at?: string;
  simulation: 'Done' | 'Yet';
  memo: string;
  error_count: number;
}

export interface IScenarioOverview {
  date: string;
  terminal: string;
  analysis_type: string;
  data_source: string;
  flights: string;
  passengers: string;
  passengers_pattern: string;
  generation_method: string;
  check_in: string;
  boarding_pass: string;
  security: string;
  passport: string;
}

export interface IFlightSchedule {
  add_conditions: IConditionData;
  add_priorities: IConditionData;

  color_criteria: string;
  conditions: IConditionState[];
  airport: string;
  date: Date;
  conditions_visible: boolean;
}

export interface IScenarioMetadata {
  id: number;
  simulation_id: string;
  overview: Partial<IScenarioOverview>;
  flight_sch: Partial<IFlightSchedule>;
  passenger_sch: { [key: string]: any };
  passenger_attr: { [key: string]: any };
  facility_conn: { [key: string]: any };
  facility_info: { [key: string]: any };
  history: IScenarioHistory[];
}

interface IScenarioMetadataZustand extends Partial<IScenarioMetadata> {
  setMetadata: (data: IScenarioMetadata) => void;

  setOverview: (overview: Partial<IScenarioOverview>, replace?: boolean) => void;
  setFlightSchedule: (flightSchedule: Partial<IFlightSchedule>, replace?: boolean) => void;

  addHistoryItem: (item: IScenarioHistory) => void;
  setHistoryItem: (item: IScenarioHistory, index: number) => void;
}

export const useSimulationMetadata = create<IScenarioMetadataZustand>((set, get) => ({
  setMetadata: (data) => set({ ...data }),

  setOverview: (overview, replace) =>
    set(
      replace ? { overview } : { overview: { ...(get().overview || ({} as IScenarioOverview)), ...overview } }
    ),
  setFlightSchedule: (flight_sch, replace) =>
    set(
      replace
        ? { flight_sch }
        : { flight_sch: { ...(get().flight_sch || ({} as IFlightSchedule)), ...flight_sch } }
    ),

  addHistoryItem: (item: IScenarioHistory) => set({ history: [...(get()?.history || []), item] }),
  setHistoryItem: (item: IScenarioHistory, index: number) =>
    set({ history: get()?.history?.map((val, idx) => (idx == index ? item : val)) }),
}));

export const useSimulationStore = create<{
  tabIndex: number;
  checkpoint?: { time: string; diff: number };

  setTabIndex: (index: number) => void;
  setCheckpoint: (time: string, diff: number) => void;
}>((set, get) => ({
  tabIndex: 0,
  checkpoint: undefined,

  setTabIndex: (index) => set({ tabIndex: index }),
  setCheckpoint: (time, diff) => set({ checkpoint: { time, diff } }),
}));

export const useSimulationFlighScheduleStore = create<{
  chartData?: { total: number; x: string[]; data: IChartData };
  setChartData: (data: { total: number; x: string[]; data: IChartData }) => void;

  selColorCriteria: string;
  setSelColorCriteria: (selColorCriteria: string) => void;

  addConditionsVisible: boolean;
  setAddConditionsVisible: (addConditionsVisible: boolean) => void;

  selDate: Date;
  setSelDate: (selDate: Date) => void;

  selAirport: string;
  setSelAirport: (selAirport: string) => void;

  selConditions: IConditionState[];
  setSelConditions: (selConditions: IConditionState[]) => void;
}>((set, get) => ({
  chartData: undefined,
  setChartData: (chartData) => set({ chartData }),

  selColorCriteria: 'Airline',
  setSelColorCriteria: (selColorCriteria) => set({ selColorCriteria }),

  addConditionsVisible: false,
  setAddConditionsVisible: (addConditionsVisible) => set({ addConditionsVisible }),

  selDate: dayjs().add(-1, 'day').toDate(),
  setSelDate: (selDate) => set({ selDate }),

  selAirport: 'ICN',
  setSelAirport: (selAirport) => set({ selAirport }),

  selConditions: [],
  setSelConditions: (selConditions) => set({ selConditions }),
}));
