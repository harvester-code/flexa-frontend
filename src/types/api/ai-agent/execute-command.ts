import type { ProcessStep } from '@/types/simulationTypes';
import type { ChartData } from '@/types/api/common';

/** POST /api/v1/ai-agent/scenario/{scenario_id}/execute-command */
export interface AiAgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiAgentPassengerState {
  total: number;
  configured: boolean;
  settings?: {
    airport?: string;
    date?: string;
    min_arrival_minutes?: number;
  };
  pax_generation: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: Record<string, number>;
      flightCount?: number;
    }>;
    default: {
      load_factor: number | null;
      flightCount?: number;
    };
  };
  pax_demographics: {
    nationality: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
        flightCount?: number;
      }>;
      default: Record<string, number> & { flightCount?: number };
    };
    profile: {
      available_values: string[];
      rules: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
        flightCount?: number;
      }>;
      default: Record<string, number> & { flightCount?: number };
    };
  };
  pax_arrival_patterns: {
    rules: Array<{
      conditions: Record<string, string[]>;
      value: { mean: number; std: number };
      flightCount?: number;
    }>;
    default: {
      mean: number | null;
      std: number | null;
      flightCount?: number;
    };
  };
  chartResult?: {
    total: number;
    chart_x_data: string[];
    chart_y_data?: ChartData;
    summary?: {
      flights: number;
      avg_seats: number;
      load_factor: number;
      min_arrival_minutes: number;
    };
  } | null;
}

export interface AiAgentSimulationState {
  airport: string;
  date: string;
  flight_selected: number;
  flight_total: number;
  airline_names: string[];
  airlines_mapping: Record<string, string>;
  passenger: AiAgentPassengerState;
  process_count: number;
  process_names: string[];
  process_flow: ProcessStep[];
  workflow: {
    flights_completed: boolean;
    passengers_completed: boolean;
    current_step: number;
  };
}

export interface ExecuteCommandRequest {
  content: string;
  conversation_history?: AiAgentMessage[];
  simulation_state?: AiAgentSimulationState;
  model?: string;
  temperature?: number;
}

export interface ExecuteCommandResponse {
  success: boolean;
  message: string;
  action: string | null;
  data: Record<string, unknown> | null;
  error: string | null;
}
