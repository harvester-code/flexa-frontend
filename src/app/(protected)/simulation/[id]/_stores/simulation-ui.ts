'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// UI 전용 상태 인터페이스
export interface SimulationUIState {
  // 각 탭별 UI 상태
  flightSchedule: Record<string, unknown>;
  passengerSchedule: {
    parquetMetadata?: {
      columns: Array<{
        name: string;
        unique_values: string[];
        count: number;
      }>;
    } | null;
  } & Record<string, unknown>;  
  processingProcedures: Record<string, unknown>;

  // Actions
  setFlightScheduleUI: (data: Record<string, unknown>) => void;
  setPassengerScheduleUI: (data: Record<string, unknown>) => void;
  setProcessingProceduresUI: (data: Record<string, unknown>) => void;
  resetUI: () => void;
}

const initialState = {
  flightSchedule: {},
  passengerSchedule: {},
  processingProcedures: {},
};

export const useSimulationUIStore = create<SimulationUIState>()(
  immer((set) => ({
    // Initial state
    ...initialState,

    // Actions
    setFlightScheduleUI: (data) =>
      set((state) => {
        state.flightSchedule = { ...state.flightSchedule, ...data };
      }),

    setPassengerScheduleUI: (data) =>
      set((state) => {
        state.passengerSchedule = { ...state.passengerSchedule, ...data };
      }),

    setProcessingProceduresUI: (data) =>
      set((state) => {
        state.processingProcedures = { ...state.processingProcedures, ...data };
      }),

    resetUI: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);
