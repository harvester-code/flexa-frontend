import dayjs from 'dayjs';
import {
  FacilityConnectionResponse,
  FacilityInfoLineChartResponse,
  FlightSchedulesResponse,
  PassengerScheduleResponse,
  ProcessingProceduresResponse,
  ScenarioHistory,
  ScenarioMetadataResponse,
  ScenariosDataResponse,
  SimulationOverviewResponse,
  SimulationResponse,
} from '@/types/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import { instanceWithAuth } from '@/lib/axios';

const BASE_URL = 'api/v1/simulations';

interface CreateScenarioParams {
  simulation_name: string;
  airport: string;
  terminal: string;
  editor: string;
  memo: string;
  group_id: string;
}

const createScenario = (params: CreateScenarioParams) => {
  return instanceWithAuth.post(`${BASE_URL}/scenarios`, params);
};

const fetchScenarios = (group_id?: number, page: number = 1) => {
  return instanceWithAuth.get<ScenariosDataResponse>(`${BASE_URL}/scenarios/group-id/${group_id}`, {
    params: { page },
  });
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
  return instanceWithAuth.patch(`${BASE_URL}/scenarios/masters/group-id/${group_id}/scenario-id/${scenario_id}`);
};

// =======================================================================

const getScenarioMetadata = (scenario_id: string) => {
  return instanceWithAuth.get<ScenarioMetadataResponse>(`${BASE_URL}/scenarios/metadatas/scenario-id/${scenario_id}`);
};

const updateScenarioMetadata = (addHistory: boolean = true) => {
  const store = useSimulationStore.getState();
  const states = useSimulationMetadata.getState();
  const checkpoint = dayjs()
    .add((store.checkpoint?.diff || 0) * -1, 'millisecond')
    .format('YYYY-MM-DD HH:mm:ss Z');

  const historyItem: ScenarioHistory = {
    checkpoint,
    error_count: 0,
    memo: '',
    simulation: states?.simulation?.chart ? 'Done' : 'Yet',
  };

  const history = addHistory ? [...(states.history || []), historyItem] : states.history || [];

  const params = {
    overview: states.overview || {},
    flight_sch: states.flight_sch || {},
    passenger_sch: states.passenger_sch || {},
    passenger_attr: states.passenger_attr || {},
    facility_conn: states.facility_conn || {},
    facility_info: states.facility_info || {},
    history,
  };
  if (addHistory) states.addHistoryItem(historyItem);
  return instanceWithAuth.put(`${BASE_URL}/scenarios/metadatas/scenario-id/${states.scenario_id}`, params);
};

// =======================================================================

interface FlightSchedulesParams {
  first_load: boolean;
  airport: string;
  date: string;
  condition: Array<{
    criteria: string;
    operator: string;
    value: string[];
  }>;
}

const getFlightSchedules = (scenario_id: string, params: FlightSchedulesParams) => {
  return instanceWithAuth.post<FlightSchedulesResponse>(
    `${BASE_URL}/flight-schedules/scenario-id/${scenario_id}`,
    params
  );
};

interface PassengerSchedulesParams {
  flight_schedule: FlightSchedulesParams;
  destribution_conditions: Array<{
    index: number;
    conditions: Array<{
      criteria: string;
      operator: string;
      value: string[];
    }>;
    mean: number;
    standard_deviation: number;
  }>;
}

const getPassengerSchedules = (scenario_id: string, params: PassengerSchedulesParams) => {
  return instanceWithAuth.post<PassengerScheduleResponse>(
    `${BASE_URL}/passenger-schedules/scenario-id/${scenario_id}`,
    params
  );
};

const getProcessingProcedures = () => {
  return instanceWithAuth.post<ProcessingProceduresResponse>(`${BASE_URL}/processing-procedures`);
};

interface FacilityConnsParams extends PassengerSchedulesParams {
  processes: {
    [index: string]: {
      name: string;
      nodes: string[];
      source?: string;
      destination?: string;
      wait_time: number;
      default_matrix?: {
        [row: string]: {
          [col: string]: number;
        };
      };
      priority_matrix?: Array<{
        condition: Array<{
          criteria: string;
          operator: string;
          value: string[];
        }>;
        matrix: {
          [row: string]: {
            [col: string]: number;
          };
        };
      }>;
    };
  };
}

const getFacilityConns = (scenario_id: string, params: FacilityConnsParams) => {
  return instanceWithAuth.post<FacilityConnectionResponse>(
    `${BASE_URL}/facility-conns/scenario-id/${scenario_id}`,
    params
  );
};

const getFacilityInfoLineChartData = (params: { time_unit?: number; facility_schedules?: number[][] }) => {
  return instanceWithAuth.post<FacilityInfoLineChartResponse>(`${BASE_URL}/facility-info/charts/line`, params);
};

interface SimulationParams extends FacilityConnsParams {
  scenario_id: string;
  components: Array<{
    name: string;
    nodes: Array<{
      id: number;
      name: string;
      facility_count: number;
      max_queue_length: number;
      facility_schedules: number[][];
    }>;
  }>;
}

const getSimulationOverview = (scenario_id: string, params: SimulationParams) => {
  return instanceWithAuth.post<SimulationOverviewResponse>(
    `${BASE_URL}/run-simulation/overview/scenario-id/${scenario_id}`,
    params
  );
};

const requestSimulation = (scenario_id: string, params: SimulationParams) => {
  return instanceWithAuth.post<SimulationResponse>(`${BASE_URL}/request-simulation/scenario-id/${scenario_id}`, params);
};

const fetchSimulation = (scenario_id: string) => {
  return instanceWithAuth.get<SimulationResponse>(`${BASE_URL}/request-simulation/scenario-id/${scenario_id}`);
};

const runSimulation = (params: SimulationParams) => {
  return instanceWithAuth.post<SimulationResponse>(`${BASE_URL}/run-simulation/temp`, params);
};

export {
  createScenario,
  deleteScenario,
  duplicateScenario,
  fetchScenarios,
  fetchSimulation,
  getFacilityConns,
  getFacilityInfoLineChartData,
  getFlightSchedules,
  getPassengerSchedules,
  getProcessingProcedures,
  getScenarioMetadata,
  getSimulationOverview,
  modifyScenario,
  requestSimulation,
  runSimulation,
  setMasterScenario,
  updateScenarioMetadata,
};
