'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'flexa-simulation-notifications';

interface PendingSimulation {
  scenarioId: string;
  startedAt: string;
}

interface SimulationNotificationState {
  pending: PendingSimulation[];
  addPending: (scenarioId: string) => void;
  removePending: (scenarioId: string) => void;
  clearAll: () => void;
}

/**
 * 실행 중인 시뮬레이션을 추적하는 글로벌 스토어.
 * localStorage + 탭 간 동기화로, 어떤 탭에서 시뮬레이션을 실행해도
 * 다른 탭의 SimulationWatcher가 자동으로 polling을 시작함.
 */
export const useSimulationNotificationStore = create<SimulationNotificationState>()(
  persist(
    (set, get) => ({
      pending: [],

      addPending: (scenarioId: string) => {
        const existing = get().pending.find((s) => s.scenarioId === scenarioId);
        if (existing) return;
        set((state) => ({
          pending: [...state.pending, { scenarioId, startedAt: new Date().toISOString() }],
        }));
      },

      removePending: (scenarioId: string) => {
        set((state) => ({
          pending: state.pending.filter((s) => s.scenarioId !== scenarioId),
        }));
      },

      clearAll: () => set({ pending: [] }),
    }),
    { name: STORAGE_KEY }
  )
);

// 다른 탭에서 localStorage가 변경되면 이 탭의 스토어를 자동으로 동기화
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      useSimulationNotificationStore.persist.rehydrate();
    }
  });
}
