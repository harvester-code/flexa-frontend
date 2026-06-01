'use client';

import { create } from 'zustand';
import { countUnreadNotificationGroups } from '@/lib/notificationGroups';

export interface SimulationNotification {
  id: string;
  scenario_id: string;
  scenario_name: string | null;
  status: 'completed' | 'failed';
  /** L1 parquet = simulation, L2 home JSON = analysis. Legacy rows default to analysis. */
  phase?: 'simulation' | 'analysis' | null;
  error_message: string | null;
  simulation_start_at: string | null;
  simulation_end_at: string | null;
  created_at: string;
  read_at: string | null;
}

interface NotificationState {
  notifications: SimulationNotification[];
  isLoaded: boolean;
  unreadCount: number;

  setNotifications: (notifications: SimulationNotification[]) => void;
  prependNotification: (notification: SimulationNotification) => void;
  markAllRead: () => void;
  getLatestByScenarioId: (scenarioId: string) => SimulationNotification | undefined;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoaded: false,
  unreadCount: 0,

  setNotifications: (notifications) => {
    set({
      notifications,
      isLoaded: true,
      unreadCount: countUnreadNotificationGroups(notifications),
    });
  },

  prependNotification: (notification) => {
    const exists = get().notifications.some((n) => n.id === notification.id);
    if (exists) return;
    const next = [notification, ...get().notifications];
    set({
      notifications: next,
      unreadCount: countUnreadNotificationGroups(next),
    });
  },

  markAllRead: () => {
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.read_at ? n : { ...n, read_at: now }
      ),
      unreadCount: 0,
    }));
  },

  getLatestByScenarioId: (scenarioId: string) => {
    // notifications are ordered newest first
    return get().notifications.find((n) => n.scenario_id === scenarioId);
  },
}));
