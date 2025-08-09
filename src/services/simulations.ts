import { FlightScheduleResponse, PassengerScheduleResponse, PassengerShowUpResponse } from '@/types/scenarios';
import {
  CreateScenarioParams,
  FacilityConnectionResponse,
  FacilityConnsParams,
  FacilityInfoLineChartResponse,
  FlightSchedulesParams,
  MetadataLoadResponse,
  MetadataSaveResponse,
  PassengerSchedulesParams,
  ScenariosDataResponse,
  SimulationOverviewResponse,
  SimulationParams,
  SimulationResponse,
} from '@/types/simulations';
import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = '/api/v1/simulations';

export const createScenario = (params: CreateScenarioParams) => {
  return instanceWithAuth.post(`${BASE_URL}/`, params);
};

export const fetchScenarios = () => {
  return instanceWithAuth.get<ScenariosDataResponse>(`${BASE_URL}/`);
};

export const modifyScenario = (
  params: { name?: string; terminal?: string; airport?: string; memo?: string },
  scenario_id: string
) => {
  return instanceWithAuth.put(`${BASE_URL}/${scenario_id}`, params);
};

export const deleteScenario = (scenario_ids: string[]) => {
  return instanceWithAuth.delete(`${BASE_URL}/`, { data: { scenario_ids } });
};

export const setMasterScenario = (scenario_id: string) => {
  return instanceWithAuth.patch(`${BASE_URL}/${scenario_id}/master`);
};

export const getFlightSchedules = (scenario_id: string, params: FlightSchedulesParams) => {
  return instanceWithAuth.post<FlightScheduleResponse>(`${BASE_URL}/${scenario_id}/flight-schedules`, params);
};

export const getPassengerSchedules = (scenarioId: string, params: PassengerSchedulesParams) => {
  return instanceWithAuth.post<PassengerScheduleResponse>(`${BASE_URL}/${scenarioId}/show-up-passenger`, params);
};

export const createPassengerShowUp = (scenarioId: string, params: { destribution_conditions: any[] }) => {
  return instanceWithAuth.post<PassengerShowUpResponse>(`${BASE_URL}/${scenarioId}/show-up-passenger`, params);
};

export const getFacilityConns = (scenario_id: string, params: FacilityConnsParams) => {
  return instanceWithAuth.post<FacilityConnectionResponse>(
    `${BASE_URL}/facility-conns/scenario-id/${scenario_id}`,
    params
  );
};

export const getFacilityInfoLineChartData = (params: {
  time_unit: number;
  facility_schedules: (number | null)[][];
}) => {
  return instanceWithAuth.post<FacilityInfoLineChartResponse>(`${BASE_URL}/facility-info/charts/line`, params);
};

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

// =======================================================================

export const saveScenarioMetadata = (scenario_id: string, metadata: any) => {
  return instanceWithAuth.post<MetadataSaveResponse>(`${BASE_URL}/${scenario_id}/metadata`, metadata);
};

export const loadScenarioMetadata = (scenario_id: string) => {
  return instanceWithAuth.get<MetadataLoadResponse>(`${BASE_URL}/${scenario_id}/metadata`);
};
