import { ScenariosDataResponse } from "@/types/homeTypes";
import {
  CreateScenarioParams,
  CreateScenarioResponse,
  FlightSchedulesParams,
  MetadataSaveResponse,
  MetadataLoadResponse,
  FlightScheduleResponse,
  ShowUpPassengerRequest,
  ShowUpPassengerResponse,
  RunSimulationRequest,
  ScenarioMetadataPayload,
  FlightFiltersResponse,
} from "@/types/api/simulations";
import { createAPIService } from "@/lib/axios";

const api = createAPIService("simulations");

export const createScenario = (params: CreateScenarioParams) => {
  return api.post<CreateScenarioResponse>("", params);
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

export const getFlightFilters = (
  scenario_id: string,
  airport: string,
  date: string
) => {
  return api
    .withScenario(scenario_id)
    .get<FlightFiltersResponse>(`/flight-filters?airport=${airport}&date=${date}`);
};

export const createPassengerShowUp = (
  scenarioId: string,
  params: ShowUpPassengerRequest
) => {
  return api
    .withScenario(scenarioId)
    .post<ShowUpPassengerResponse>("/show-up-passenger", params);
};

export const saveScenarioMetadata = (
  scenario_id: string,
  metadata: ScenarioMetadataPayload
) => {
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
  processFlow: RunSimulationRequest["process_flow"],
  airport: string,
  date: string
) => {
  const body: RunSimulationRequest = {
    setting: { airport, date },
    process_flow: processFlow,
  };
  return api.withScenario(scenario_id).post("/run-simulation", body);
};
