export interface TimelineStepInfo {
  name: string;
  travel_minutes: number;
}

export interface TimelineZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** [on_pred_offset, start_offset, done_offset, zone_key, facility_id] – null when skipped */
export type PassengerStepEvent = [number, number, number, string, string] | null;

/** [show_up_offset, step_events[]] – show_up_offset is seconds from base_time, -1 if unavailable */
export type PassengerEntry = [number, (PassengerStepEvent | null)[]];

/** [start_offset_sec, end_offset_sec, activate] – offsets from base_time */
export type FacilityTimeBlock = [number, number, boolean];

export interface PassengerTimelineData {
  base_time: string | null;
  duration_seconds: number;
  steps: TimelineStepInfo[];
  zones: Record<string, TimelineZone>;
  zone_facilities: Record<string, string[]>;
  facility_schedules: Record<string, FacilityTimeBlock[]>;
  zone_max_queue: Record<string, number>;
  passengers: PassengerEntry[];
}

export const STEP_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4",
] as const;
