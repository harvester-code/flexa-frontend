import {
  IFlightScheduleResponse,
  IScenarioMetadata,
  IScenarioMetadataResponse,
  IScenariosDataResponse,
} from '@/types/simulations';
import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = 'api/v1/simulations';

const createScenario = (params: {
  simulation_name: string;
  terminal: string;
  editor: string;
  memo: string;
  group_id: string;
}) => {
  return instanceWithAuth.post(`${BASE_URL}/scenario`, params);
};

const fetchScenarios = (group_id?: number) => {
  return instanceWithAuth.get<IScenariosDataResponse>(`${BASE_URL}/scenarios/group-id/${group_id}`);
};

const modifyScenario = (params: { id: string; simulation_name?: string; memo?: string }) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenario`, params);
};

const deleteScenario = (params: { scenario_id: string }) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenario/deactivate?${new URLSearchParams(params).toString()}`);
};

const deleteScenarioMulti = (params: { scenario_ids: string[] }) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenario/deactivate/multiple`, params);
};

const duplicateScenario = (params: { scenario_id: string; editor: string }) => {
  return instanceWithAuth.post(`${BASE_URL}/scenario/duplicate?${new URLSearchParams(params).toString()}`);
};

const setMasterScenario = (params: { group_id: string; scenario_id: string }) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenario/master?${new URLSearchParams(params).toString()}`);
};

// =======================================================================

const getScenarioMetadata = (params: { simulation_id: string }) => {
  return instanceWithAuth.get<IScenarioMetadataResponse>(
    `${BASE_URL}/scenario/metadata?${new URLSearchParams(params).toString()}`
  );
};

const setScenarioMetadata = (params: Partial<Omit<IScenarioMetadata, 'id'>>) => {
  return instanceWithAuth.put(`${BASE_URL}/scenario/metadata`, params);
};

// =======================================================================

const getFlightSchedule = (
  simulation_id: string,
  params: {
    first_load: boolean;
    airport: string;
    date: string;
    condition: Array<{
      criteria: string;
      operator: string;
      value: string[];
    }>;
  }
) => {
  return instanceWithAuth.post<IFlightScheduleResponse>(
    `${BASE_URL}/flight-schedule?simulation_id=${simulation_id}`,
    params
  );
};

export {
  createScenario,
  deleteScenario,
  deleteScenarioMulti,
  duplicateScenario,
  fetchScenarios,
  getFlightSchedule,
  getScenarioMetadata,
  modifyScenario,
  setMasterScenario,
  setScenarioMetadata,
};
