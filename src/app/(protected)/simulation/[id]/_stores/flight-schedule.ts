import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ==================== Types ====================
export interface AvailableConditions {
  types: {
    International: Array<{ iata: string; name: string }>;
    Domestic: Array<{ iata: string; name: string }>;
  };
  terminals: Record<string, Array<{ iata: string; name: string }>>;
  airlines: Array<{ iata: string; name: string }>;
}

export interface SelectedConditions {
  types: string[];
  terminal: string[];
  selectedAirlines: Array<{ iata: string; name: string }>;
}

export interface FlightScheduleState {
  // Data
  airport: string;
  date: string;
  type: string;
  availableConditions: AvailableConditions;
  selectedConditions: SelectedConditions;
  chartData: Record<string, unknown> | null;
  total: number;
  isCompleted: boolean;

  // Actions
  setAirport: (airport: string) => void;
  setDate: (date: string) => void;
  setType: (type: string) => void;
  setAvailableConditions: (conditions: AvailableConditions) => void;
  setSelectedConditions: (conditions: SelectedConditions) => void;
  setChartData: (data: Record<string, unknown> | null) => void;
  setTotal: (total: number) => void;
  setCompleted: (completed: boolean) => void;
  resetState: () => void;
  loadMetadata: (metadata: Record<string, unknown>) => void;
}

// ==================== Initial State ====================
const initialState = {
  airport: '',
  date: new Date().toISOString().split('T')[0], // 오늘 날짜 (YYYY-MM-DD 형식)
  type: 'departure',
  availableConditions: {
    types: {
      International: [],
      Domestic: [],
    },
    terminals: {},
    airlines: [],
  },
  selectedConditions: {
    types: [],
    terminal: [],
    selectedAirlines: [],
  },
  chartData: null,
  total: 0,
  isCompleted: false,
};

// ==================== Store ====================
export const useFlightScheduleStore = create<FlightScheduleState>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // Actions
    setAirport: (airport) =>
      set((state) => {
        state.airport = airport;
      }),

    setDate: (date) =>
      set((state) => {
        state.date = date;
      }),

    setType: (type) =>
      set((state) => {
        state.type = type;
      }),

    setAvailableConditions: (conditions) =>
      set((state) => {
        state.availableConditions = conditions;
      }),

    setSelectedConditions: (conditions) =>
      set((state) => {
        state.selectedConditions = conditions;
      }),

    setChartData: (data) =>
      set((state) => {
        state.chartData = data;
      }),

    setTotal: (total) =>
      set((state) => {
        state.total = total;
      }),

    setCompleted: (completed) =>
      set((state) => {
        state.isCompleted = completed;
      }),

    resetState: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    loadMetadata: (metadata) =>
      set((state) => {
        Object.assign(state, {
          ...initialState,
          ...metadata,
        });
      }),
  }))
);

// ==================== Helpers ====================
export const getFlightScheduleInitialState = () => ({ ...initialState });
