import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { IScenarioMetadata } from '@/store/zustand/simulation';

export interface IConditionParams {
  name: string;
  operator: string[];
  value: string[];
}

export interface IChartData {
  [name: string]: Array<{
    name: string;
    order: number;
    y: Array<number>;
    acc_y?: Array<number>;
  }>;
}

export interface IScenarioData {
  created_at: string;
  editor: string;
  id: string;
  is_active: boolean;
  memo: string;
  simulation_date?: string;
  simulation_name: string;
  simulation_url?: string;
  size?: number;
  terminal: string;
  updated_at?: string;
  user_id?: string;
}

interface IScenariosDataResponse {
  master_scenario: IScenarioData[];
  user_scenario: IScenarioData[];
}

export const getScenarioList = (group_id?: number) =>
  axios.get<IScenariosDataResponse>(`/api/v1/simulations/scenario?group_id=${group_id}`);

export const useScenarioList = (group_id?: number) => {
  const response = useQuery({
    queryKey: ['ScenarioList'],
    queryFn: () =>
      getScenarioList(group_id).then<IScenarioData[]>((response) => {
        const masterScenarios = {};
        for (const rowCur of response?.data?.master_scenario || [])
          if (rowCur?.id) masterScenarios[rowCur.id] = rowCur;
        return [
          ...(response?.data?.master_scenario.filter((val) => val != null) || []),
          ...(response?.data?.user_scenario?.filter((val) => val.id in masterScenarios == false) || []),
        ];
      }),
    enabled: group_id ? true : false,
  });

  return {
    ...response,
    scenarioList: response?.data || [],
  };
};

export const createScenario = (params: {
  simulation_name: string;
  terminal: string;
  editor: string;
  memo: string;
  group_id: string;
}) => axios.post('/api/v1/simulations/scenario', params);

export const modifyScenario = (params: { id: string; simulation_name?: string; memo?: string }) =>
  axios.patch('/api/v1/simulations/scenario', params);

export const deleteScenario = (params: { scenario_id: string }) =>
  axios.patch(`/api/v1/simulations/scenario/deactivate?${new URLSearchParams(params).toString()}`);

export const deleteScenarioMulti = (params: { scenario_ids: string[] }) =>
  axios.patch(`/api/v1/simulations/scenario/deactivate/multiple`, params);

export const duplicateScenario = (params: { scenario_id: string; editor: string }) =>
  axios.post(`/api/v1/simulations/scenario/duplicate?${new URLSearchParams(params).toString()}`);

export const setMasterScenario = (params: { group_id: string; scenario_id: string }) =>
  axios.patch(`/api/v1/simulations/scenario/master?${new URLSearchParams(params).toString()}`);

interface IScenarioMetadataResponse {
  checkpoint: string;
  metadata: IScenarioMetadata;
}

export const getScenarioMetadata = (params: { simulation_id: string }) =>
  axios.get<IScenarioMetadataResponse>(
    `/api/v1/simulations/scenario/metadata?${new URLSearchParams(params).toString()}`
  );

export const setScenarioMetadata = (params: Partial<Omit<IScenarioMetadata, 'id'>>) =>
  axios.put(`/api/v1/simulations/scenario/metadata`, params);

export interface IFlightScheduleResponse {
  add_conditions: Array<IConditionParams>;
  add_priorities: Array<IConditionParams>;
  chart_x_data: string[];
  chart_y_data: IChartData;
  total: number;
}

export const getFlightSchedule = (
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
) =>
  axios.post<IFlightScheduleResponse>(
    `/api/v1/simulations/flight-schedule?simulation_id=${simulation_id}`,
    params
  );
