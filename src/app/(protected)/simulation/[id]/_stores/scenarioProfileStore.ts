"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ScenarioProfileState {
  scenarioName: string;
  scenarioHistory: string[];
  currentScenarioTab: number;
  setScenarioName: (name: string) => void;
  setScenarioHistory: (history: string[]) => void;
  setCurrentScenarioTab: (tab: number) => void;
  loadMetadata: (metadata: any) => void;
  reset: () => void;
}

const initialState = {
  scenarioName: "",
  scenarioHistory: [],
  currentScenarioTab: 0,
};

export const useScenarioProfileStore = create<ScenarioProfileState>()(
  immer((set) => ({
    ...initialState,

    setScenarioName: (name) =>
      set((state) => {
        state.scenarioName = name;
      }),

    setScenarioHistory: (history) =>
      set((state) => {
        state.scenarioHistory = history;
      }),

    setCurrentScenarioTab: (tab) =>
      set((state) => {
        state.currentScenarioTab = tab;
      }),

    loadMetadata: (metadata) =>
      set((state) => {
        if (metadata.scenarioName) state.scenarioName = metadata.scenarioName;
        if (metadata.scenarioHistory) state.scenarioHistory = metadata.scenarioHistory;
        if (typeof metadata.currentScenarioTab === "number") state.currentScenarioTab = metadata.currentScenarioTab;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);
