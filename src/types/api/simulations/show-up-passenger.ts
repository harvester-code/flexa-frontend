import type { ChartData } from '../common';

/** POST /api/v1/simulations/{scenario_id}/show-up-passenger */

export interface PaxRule<TValue> {
  conditions: Record<string, string[]>;
  value: TValue;
  flightCount?: number;
}

export interface ShowUpPassengerSettings {
  airport: string;
  date: string;
  min_arrival_minutes: number;
}

export interface ShowUpPassengerRequest {
  settings: ShowUpPassengerSettings;
  pax_generation: {
    rules: Array<PaxRule<Record<string, number>>>;
    default: {
      load_factor: number;
      flightCount?: number;
    };
  };
  pax_demographics: {
    nationality: {
      available_values: string[];
      rules: Array<PaxRule<Record<string, number>>>;
      default: Record<string, number> & { flightCount?: number };
    };
    profile: {
      available_values: string[];
      rules: Array<PaxRule<Record<string, number>>>;
      default: Record<string, number> & { flightCount?: number };
    };
  };
  pax_arrival_patterns: {
    rules: Array<PaxRule<{ mean: number; std: number }>>;
    default: {
      mean: number | null;
      std: number | null;
      flightCount?: number;
    };
  };
}

export interface ShowUpPassengerResponse {
  airport: string;
  date: string;
  scenario_id: string;
  total: number;
  chart_x_data: string[];
  chart_y_data?: ChartData;
  summary?: {
    flights: number;
    avg_seats: number;
    load_factor: number;
    min_arrival_minutes: number;
  };
}
