import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { APIRequestLog } from '@/types/simulationTypes';

// ==================== Modern Types ====================
export interface FiltersData {
  airport: string;
  date: string;
  filters: {
    departure_terminal: string[];
    arrival_terminal: string[];
    operating_carrier_name: string[];
    flight_type: string[];
    arrival_country_code: string[];
    arrival_region: string[];
  };
}

export interface ApplyFilterResponse {
  total: number;
  chart_x_data: string[];
  chart_y_data: {
    [category: string]: Array<{
      name: string;
      order: number;
      y: number[];
      acc_y?: number[];
    }>;
  };
  parquet_metadata?: {
    columns: string[];
  };
}

export interface FlightScheduleV2State {
  // ==================== Basic Parameters ====================
  airport: string;
  date: string;
  isCompleted: boolean;

  // ==================== Filter System ====================
  filtersData: FiltersData | null;

  // ==================== Loading States ====================
  loadingFlightSchedule: boolean;
  loadError: boolean;
  applyFilterLoading: boolean;

  // ==================== Apply Filter Results ====================
  applyFilterData: ApplyFilterResponse | null;
  applyFilterError: string | null;

  // ==================== API Request Log ====================
  apiRequestLog: APIRequestLog | null;

  // ==================== Legacy Chart Data (for migration) ====================
  chartData: Record<string, unknown> | null;

  // ==================== Actions ====================
  // Basic setters
  setAirport: (airport: string) => void;
  setDate: (date: string) => void;
  setCompleted: (completed: boolean) => void;

  // Filter system
  setFiltersData: (filtersData: FiltersData | null) => void;

  // Loading states
  setLoadingFlightSchedule: (loading: boolean) => void;
  setLoadError: (error: boolean) => void;
  setApplyFilterLoading: (loading: boolean) => void;

  // Apply filter results
  setApplyFilterData: (data: ApplyFilterResponse | null) => void;
  setApplyFilterError: (error: string | null) => void;
  clearApplyFilterState: () => void;

  // API logging
  setApiRequestLog: (log: APIRequestLog | null) => void;

  // Legacy support
  setChartData: (data: Record<string, unknown> | null) => void;

  // Utility actions
  resetState: () => void;
  resetApplyFilterState: () => void;
}

// ==================== Initial State ====================
const initialState = {
  // Basic parameters
  airport: '',
  date: new Date().toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
  isCompleted: false,

  // Filter system
  filtersData: null,

  // Loading states
  loadingFlightSchedule: false,
  loadError: false,
  applyFilterLoading: false,

  // Apply filter results
  applyFilterData: null,
  applyFilterError: null,

  // API request log
  apiRequestLog: null,

  // Legacy chart data
  chartData: null,
};

// ==================== Store ====================
export const useFlightScheduleV2Store = create<FlightScheduleV2State>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // ==================== Basic Setters ====================
    setAirport: (airport) =>
      set((state) => {
        state.airport = airport;
      }),

    setDate: (date) =>
      set((state) => {
        state.date = date;
      }),

    setCompleted: (completed) =>
      set((state) => {
        state.isCompleted = completed;
      }),

    // ==================== Filter System ====================
    setFiltersData: (filtersData) =>
      set((state) => {
        state.filtersData = filtersData;
      }),

    // ==================== Loading States ====================
    setLoadingFlightSchedule: (loading) =>
      set((state) => {
        state.loadingFlightSchedule = loading;
      }),

    setLoadError: (error) =>
      set((state) => {
        state.loadError = error;
      }),

    setApplyFilterLoading: (loading) =>
      set((state) => {
        state.applyFilterLoading = loading;
      }),

    // ==================== Apply Filter Results ====================
    setApplyFilterData: (data) =>
      set((state) => {
        state.applyFilterData = data;
        // Clear error when new data is set
        if (data) {
          state.applyFilterError = null;
        }
      }),

    setApplyFilterError: (error) =>
      set((state) => {
        state.applyFilterError = error;
        // Clear data when error is set
        if (error) {
          state.applyFilterData = null;
        }
      }),

    clearApplyFilterState: () =>
      set((state) => {
        state.applyFilterData = null;
        state.applyFilterError = null;
        state.applyFilterLoading = false;
      }),

    // ==================== API Logging ====================
    setApiRequestLog: (log) =>
      set((state) => {
        state.apiRequestLog = log;
      }),

    // ==================== Legacy Support ====================
    setChartData: (data) =>
      set((state) => {
        state.chartData = data;
      }),

    // ==================== Utility Actions ====================
    resetState: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    resetApplyFilterState: () =>
      set((state) => {
        state.applyFilterData = null;
        state.applyFilterError = null;
        state.applyFilterLoading = false;
        state.apiRequestLog = null;
      }),
  }))
);

// ==================== Selectors ====================
export const flightScheduleV2Selectors = {
  // Basic data
  getBasicParams: (state: FlightScheduleV2State) => ({
    airport: state.airport,
    date: state.date,
    isCompleted: state.isCompleted,
  }),

  // Loading states
  getLoadingStates: (state: FlightScheduleV2State) => ({
    loadingFlightSchedule: state.loadingFlightSchedule,
    loadError: state.loadError,
    applyFilterLoading: state.applyFilterLoading,
  }),

  // Apply filter states
  getApplyFilterStates: (state: FlightScheduleV2State) => ({
    data: state.applyFilterData,
    error: state.applyFilterError,
    loading: state.applyFilterLoading,
  }),

  // Check if any loading is in progress
  isAnyLoading: (state: FlightScheduleV2State) => state.loadingFlightSchedule || state.applyFilterLoading,

  // Check if ready for next step
  isReadyForNextStep: (state: FlightScheduleV2State) =>
    state.isCompleted && !state.loadingFlightSchedule && !state.applyFilterLoading,
};

// ==================== Helpers ====================
export const getFlightScheduleV2InitialState = () => ({ ...initialState });
