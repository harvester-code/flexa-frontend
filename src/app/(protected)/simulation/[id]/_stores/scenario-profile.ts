import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ==================== Types ====================
export interface ScenarioProfileState {
  // Data
  checkpoint: string;
  scenarioName: string;
  scenarioTerminal: string;
  scenarioHistory: string[];
  currentScenarioTab: number;
  availableScenarioTab: number[];
  isCompleted: boolean;

  // Actions
  setCheckpoint: (checkpoint: string) => void;
  setScenarioName: (name: string) => void;
  setScenarioTerminal: (terminal: string) => void;
  setScenarioHistory: (history: string[]) => void;
  setCurrentScenarioTab: (tab: number) => void;
  setAvailableScenarioTab: (tabs: number[]) => void;
  setCompleted: (completed: boolean) => void;
  resetState: () => void;
  loadMetadata: (metadata: Record<string, unknown>) => void;
}

// ==================== Initial State ====================
const initialState = {
  checkpoint: '',
  scenarioName: '',
  scenarioTerminal: '',
  scenarioHistory: [],
  currentScenarioTab: 0,
  availableScenarioTab: [],
  isCompleted: false,
};

// ==================== Store ====================
export const useScenarioProfileStore = create<ScenarioProfileState>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // Actions
    setCheckpoint: (checkpoint) =>
      set((state) => {
        state.checkpoint = checkpoint;
      }),

    setScenarioName: (name) =>
      set((state) => {
        state.scenarioName = name;
      }),

    setScenarioTerminal: (terminal) =>
      set((state) => {
        state.scenarioTerminal = terminal;
      }),

    setScenarioHistory: (history) =>
      set((state) => {
        state.scenarioHistory = history;
      }),

    setCurrentScenarioTab: (tab) =>
      set((state) => {
        state.currentScenarioTab = tab;
      }),

    setAvailableScenarioTab: (tabs) =>
      set((state) => {
        state.availableScenarioTab = tabs;
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
export const getScenarioProfileInitialState = () => ({ ...initialState });
