import {
  FlightSchedulesResponse,
  PassengerScheduleResponse,
  ProcessingProceduresResponse,
  ScenarioMetadata,
  ScenarioMetadataResponse,
  ScenariosDataResponse,
} from '@/types/simulations';
import { instanceWithAuth } from '@/lib/axios';
import { useSimulationMetadata } from '@/stores/simulation';

const BASE_URL = 'api/v1/simulations';

const createScenario = (params: {
  simulation_name: string;
  terminal: string;
  editor: string;
  memo: string;
  group_id: string;
}) => {
  return instanceWithAuth.post(`${BASE_URL}/scenarios`, params);
};

const fetchScenarios = (group_id?: number) => {
  return instanceWithAuth.get<ScenariosDataResponse>(`${BASE_URL}/scenarios/group-id/${group_id}`);
};

const modifyScenario = (params: { simulation_name?: string; memo?: string }, scenario_id: string) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/scenario-id/${scenario_id}/edit`, params);
};

const deleteScenario = (scenario_ids: string[]) => {
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/deactivate`, { scenario_ids });
};

const duplicateScenario = (params: { editor: string }, scenario_id: string) => {
  return instanceWithAuth.post(`${BASE_URL}/scenarios/scenario-id/${scenario_id}/duplicate`, params);
};

const setMasterScenario = (group_id: string, scenario_id: string) => {
  return instanceWithAuth.patch(
    `${BASE_URL}/scenarios/masters/group-id/${group_id}/scenario-id/${scenario_id}`
  );
};

// =======================================================================

const getScenarioMetadata = (scenario_id: string) => {
  return instanceWithAuth.get<ScenarioMetadataResponse>(
    `${BASE_URL}/scenarios/metadatas/scenario-id/${scenario_id}`
  );
};

const updateScenarioMetadata = () => {
  const states = useSimulationMetadata.getState();
  const params = {
    overview: states.overview || {},
    flight_sch: states.flight_sch || {},
    passenger_sch: states.passenger_sch || {},
    passenger_attr: states.passenger_attr || {},
    facility_conn: states.facility_conn || {},
    facility_info: states.facility_info || {},
    history: states.history || {},
  };
  return instanceWithAuth.put(`${BASE_URL}/scenarios/metadatas/scenario-id/${states.scenario_id}`, params);
};

// =======================================================================

const getFlightSchedules = (
  scenario_id: string,
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
  return instanceWithAuth.post<FlightSchedulesResponse>(
    `${BASE_URL}/flight-schedules/scenario-id/${scenario_id}`,
    params
  );
};

const getPassengerSchedules = (params: {
  flight_schedule: {
    first_load: boolean;
    airport: string;
    date: string;
    condition: Array<{
      criteria: string;
      operator: string;
      value: string[];
    }>;
  },
  destribution_conditions: Array<{
    index: number;
    conditions: Array<{
      criteria: string;
      operator: string;
      value: string[];
    }>;
    mean: number;
    standard_deviation: number;
  }>
}) => {
  return instanceWithAuth.post<PassengerScheduleResponse>(`${BASE_URL}/passenger-schedules`, params);
};

const getProcessingProcedures = () => {
  return instanceWithAuth.post<ProcessingProceduresResponse>(`${BASE_URL}/processing-procedures`);
}

export {
  createScenario,
  deleteScenario,
  duplicateScenario,
  fetchScenarios,
  getFlightSchedules,
  getPassengerSchedules,
  getProcessingProcedures,
  getScenarioMetadata,
  modifyScenario,
  setMasterScenario,
  updateScenarioMetadata,
};
