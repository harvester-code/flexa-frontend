import { create } from "zustand";
import type { PassengerTimelineData } from "@/types/viewerTypes";

interface ViewerState {
  timelineData: PassengerTimelineData | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  maxTime: number;
  scenarioId: string | null;

  setTimelineData: (data: PassengerTimelineData) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (time: number) => void;
  tick: (deltaSec: number) => void;
  reset: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  timelineData: null,
  isPlaying: false,
  playbackSpeed: 1,
  currentTime: 0,
  maxTime: 0,
  scenarioId: null,

  setTimelineData: (data) =>
    set({
      timelineData: data,
      maxTime: data.duration_seconds,
      currentTime: 0,
      isPlaying: false,
    }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  seekTo: (time) => {
    const { maxTime } = get();
    set({ currentTime: Math.max(0, Math.min(time, maxTime)) });
  },

  tick: (deltaSec) => {
    const { isPlaying, playbackSpeed, currentTime, maxTime } = get();
    if (!isPlaying) return;
    const next = currentTime + deltaSec * playbackSpeed;
    if (next >= maxTime) {
      set({ currentTime: maxTime, isPlaying: false });
    } else {
      set({ currentTime: next });
    }
  },

  reset: () =>
    set({
      timelineData: null,
      isPlaying: false,
      playbackSpeed: 1,
      currentTime: 0,
      maxTime: 0,
      scenarioId: null,
    }),
}));
