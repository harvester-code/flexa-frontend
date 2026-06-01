import type { EntryCondition, ProcessStep } from '@/types/simulationTypes';

/** POST /api/v1/simulations/{scenario_id}/run-simulation */
export interface RunSimulationRequest {
  setting: {
    airport: string;
    date: string;
  };
  process_flow: ProcessStep[];
}

export interface RunSimulationResponse {
  message?: string;
  scenario_id?: string;
  [key: string]: unknown;
}
