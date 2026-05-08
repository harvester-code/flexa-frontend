'use client';

import { create } from 'zustand';

export interface SimulationNotification {
  id: string;
  scenario_id: string;
  scenario_name: string | null;
  status: 'completed' | 'failed';
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
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoaded: false,
  unreadCount: 0,

  setNotifications: (notifications) => {
    set({
      notifications,
      isLoaded: true,
      unreadCount: notifications.filter((n) => !n.read_at).length,
    });
  },

  prependNotification: (notification) => {
    const exists = get().notifications.some((n) => n.id === notification.id);
    if (exists) return;
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read_at ? 0 : 1),
    }));
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
}));
