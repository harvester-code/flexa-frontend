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

export interface PassengerTimelineData {
  base_time: string | null;
  duration_seconds: number;
  steps: TimelineStepInfo[];
  zones: Record<string, TimelineZone>;
  zone_facilities: Record<string, string[]>;
  passengers: PassengerStepEvent[][];
}
