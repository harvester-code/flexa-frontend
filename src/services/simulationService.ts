import { ScenariosDataResponse } from "@/types/homeTypes";
import {
  CreateScenarioParams,
  FlightScheduleResponse,
  FlightSchedulesParams,
  MetadataLoadResponse,
  MetadataSaveResponse,
  PassengerScheduleResponse,
  PassengerShowUpResponse,
} from "@/types/simulationTypes";
import { createAPIService } from "@/lib/axios";

const api = createAPIService("simulations");

export const createScenario = (params: CreateScenarioParams) => {
  return api.post("", params);
};

export const fetchScenarios = () => {
  return api.get<ScenariosDataResponse>("");
};

export const modifyScenario = (
  params: { name?: string; terminal?: string; airport?: string; memo?: string },
  scenario_id: string
) => {
  return api.put(`/${scenario_id}`, params);
};

export const deleteScenario = (scenario_ids: string[]) => {
  return api.delete("", { data: { scenario_ids } });
};

export const copyScenario = (scenario_id: string, name?: string) => {
  return api.post(`/${scenario_id}/copy`, { name });
};

export const getFlightSchedules = (
  scenario_id: string,
  params: FlightSchedulesParams
) => {
  return api
    .withScenario(scenario_id)
    .post<FlightScheduleResponse>("/flight-schedules", params);
};

// 새로운 GET flight-filters 엔드포인트
export const getFlightFilters = (
  scenario_id: string,
  airport: string,
  date: string
) => {
  return api
    .withScenario(scenario_id)
    .get(`/flight-filters?airport=${airport}&date=${date}`);
};

export const createPassengerShowUp = (scenarioId: string, params: any) => {
  return api
    .withScenario(scenarioId)
    .post<PassengerShowUpResponse>("/show-up-passenger", params);
};

// =======================================================================

export const saveScenarioMetadata = (scenario_id: string, metadata: any) => {
  return api
    .withScenario(scenario_id)
    .post<MetadataSaveResponse>("/metadata", metadata);
};

export const loadScenarioMetadata = (scenario_id: string) => {
  return api.withScenario(scenario_id).get<MetadataLoadResponse>("/metadata");
};

export const deleteScenarioMetadata = (scenario_id: string) => {
  return api.withScenario(scenario_id).delete("/metadata");
};

export const runSimulation = (
  scenario_id: string,
  processFlow: any[],
  airport: string,
  date: string
) => {
  return api.withScenario(scenario_id).post("/run-simulation", {
    setting: {
      airport,
      date,
    },
    process_flow: processFlow,
  });
};
