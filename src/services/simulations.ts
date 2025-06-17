import dayjs from 'dayjs';
import { Condition, ConditionState } from '@/types/conditions';
import { FlightScheduleResponse, PassengerScheduleResponse, ScenarioMetadataResponse } from '@/types/scenarios';
import {
  FacilityConnectionResponse,
  FacilityInfoLineChartResponse,
  ProcessingProceduresResponse,
  ScenarioHistory,
  ScenariosDataResponse,
  SimulationOverviewResponse,
  SimulationResponse,
} from '@/types/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = 'api/v1/simulations';

interface CreateScenarioParams {
  name: string;
  airport: string;
  terminal: string;
  editor: string;
  memo: string;
}

export const createScenario = (params: CreateScenarioParams) => {
  return instanceWithAuth.post(`${BASE_URL}/scenarios`, params);
};

export const fetchScenarios = (group_id?: number, page: number = 1) => {
  return instanceWithAuth.get<ScenariosDataResponse>(`${BASE_URL}/scenarios/group-id/${group_id}`, {
    params: { page },
  });
};

export const modifyScenario = (params: { simulation_name?: string; memo?: string }, scenario_id: string) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/scenario-id/${scenario_id}/edit`, params);
};

export const deleteScenario = (scenario_ids: string[]) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/deactivate`, { scenario_ids });
};

export const duplicateScenario = (params: { editor: string }, scenario_id: string) => {
  return instanceWithAuth.post(`${BASE_URL}/scenarios/scenario-id/${scenario_id}/duplicate`, params);
};

export const setMasterScenario = (group_id: string, scenario_id: string) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/masters/group-id/${group_id}/scenario-id/${scenario_id}`);
};

// =======================================================================

export const getScenarioMetadata = (scenario_id: string) => {
  return instanceWithAuth.get<ScenarioMetadataResponse>(`${BASE_URL}/scenarios/metadatas/scenario-id/${scenario_id}`);
};

export const updateScenarioMetadata = (
  scenario_id: string,
  params: {
    overview: unknown;
    history: {
      checkpoint: string;
      error_count: number;
      memo: string;
      simulation: string; // FIXME: simulation: 'done' | 'yet';
    }[];
    flight_schedule: unknown;
    passenger_schedule: unknown;
    processing_procedures: unknown;
    facility_connection: unknown;
    facility_information: unknown;
  }
) => {
  return instanceWithAuth.put(`${BASE_URL}/scenarios/metadatas/scenario-id/${scenario_id}`, params);
};

// =======================================================================

interface FlightSchedulesParams {
  airport: string;
  date: string;
  condition: Condition[];
}

export const getFlightSchedules = (scenario_id: string, params: FlightSchedulesParams) => {
  return instanceWithAuth.post<FlightScheduleResponse>(
    `${BASE_URL}/flight-schedules/scenario-id/${scenario_id}`,
    params
  );
};

export interface PassengerSchedulesParams {
  flight_schedule: FlightSchedulesParams;
  destribution_conditions: ConditionState[];
}

export const getPassengerSchedules = (scenarioId: string, params: PassengerSchedulesParams) => {
  return instanceWithAuth.post<PassengerScheduleResponse>(
    `${BASE_URL}/passenger-schedules/scenario-id/${scenarioId}`,
    params
  );
};

export const getProcessingProcedures = () => {
  return instanceWithAuth.post<ProcessingProceduresResponse>(`${BASE_URL}/processing-procedures`);
};

interface FacilityConnsParams extends PassengerSchedulesParams {
  processes: {
    [index: string]: {
      name: string;
      nodes: string[];
      source: string | null;
      destination: string;
      wait_time: number | null;
      default_matrix?: { [row: string]: { [col: string]: number } } | null;
      priority_matrix?: Array<{
        condition: Array<{ criteria: string; operator: string; value: string[] }>;
        matrix: { [row: string]: { [col: string]: number } };
      }> | null;
    };
  };
}

export const getFacilityConns = (scenario_id: string, params: FacilityConnsParams) => {
  return instanceWithAuth.post<FacilityConnectionResponse>(
    `${BASE_URL}/facility-conns/scenario-id/${scenario_id}`,
    params
  );
};

export const getFacilityInfoLineChartData = (params: { time_unit?: number; facility_schedules?: number[][] }) => {
  return instanceWithAuth.post<FacilityInfoLineChartResponse>(`${BASE_URL}/facility-info/charts/line`, params);
};

interface SimulationParams extends FacilityConnsParams {
  scenario_id: string;
  components: Array<{
    name: string;
    nodes: Array<{
      id: number;
      name: string;
      max_queue_length: number;
      facility_count: number;
      facility_schedules: number[][];
    }>;
  }>;
}

export const getSimulationOverview = (scenario_id: string, params: SimulationParams) => {
  return instanceWithAuth.post<SimulationOverviewResponse>(
    `${BASE_URL}/run-simulation/overview/scenario-id/${scenario_id}`,
    params
  );
};

export const requestSimulation = (scenario_id: string, params: SimulationParams) => {
  return instanceWithAuth.post<SimulationResponse>(`${BASE_URL}/request-simulation/scenario-id/${scenario_id}`, params);
};

export const fetchSimulation = (scenario_id: string) => {
  return instanceWithAuth.get<SimulationResponse>(`${BASE_URL}/request-simulation/scenario-id/${scenario_id}`);
};

export const runSimulation = (params: SimulationParams) => {
  return instanceWithAuth.post<SimulationResponse>(`${BASE_URL}/run-simulation/temp`, params);
};
