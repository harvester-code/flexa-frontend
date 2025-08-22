import {
  CreateScenarioParams,
  FlightScheduleResponse,
  FlightSchedulesParams,
  MetadataLoadResponse,
  MetadataSaveResponse,
  PassengerScheduleResponse,
  PassengerSchedulesParams,
  PassengerShowUpResponse,

} from '@/types/simulationTypes';
import { ScenariosDataResponse } from '@/types/homeTypes';
import { createAPIService } from '@/lib/axios';

const api = createAPIService('simulations');

export const createScenario = (params: CreateScenarioParams) => {
  return api.post('/', params);
};

export const fetchScenarios = () => {
  return api.get<ScenariosDataResponse>('');
};

export const modifyScenario = (
  params: { name?: string; terminal?: string; airport?: string; memo?: string },
  scenario_id: string
) => {
  return api.put(`/${scenario_id}`, params);
};

export const deleteScenario = (scenario_ids: string[]) => {
  return api.delete('/', { data: { scenario_ids } });
};

export const setMasterScenario = (scenario_id: string) => {
  return api.patch(`/${scenario_id}/master`);
};

export const getFlightSchedules = (scenario_id: string, params: FlightSchedulesParams) => {
  return api.withScenario(scenario_id).post<FlightScheduleResponse>('/flight-schedules', params);
};

export const getPassengerSchedules = (scenarioId: string, params: PassengerSchedulesParams) => {
  return api.withScenario(scenarioId).post<PassengerScheduleResponse>('/show-up-passenger', params);
};

export const createPassengerShowUp = (scenarioId: string, params: { destribution_conditions: any[] }) => {
  return api.withScenario(scenarioId).post<PassengerShowUpResponse>('/show-up-passenger', params);
};

// =======================================================================

export const saveScenarioMetadata = (scenario_id: string, metadata: any) => {
  return api.withScenario(scenario_id).post<MetadataSaveResponse>('/metadata', metadata);
};

export const loadScenarioMetadata = (scenario_id: string) => {
  return api.withScenario(scenario_id).get<MetadataLoadResponse>('/metadata');
};
