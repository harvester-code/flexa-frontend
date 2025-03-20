import { useQuery } from '@tanstack/react-query';
import { IScenarioMetadata } from '@/store/zustand/simulation';
import { instanceWithAuth } from '@/lib/axios';

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

const BASE_URL = '/api/v1/simulations';

export const getScenarioList = (group_id?: number) =>
  instanceWithAuth.get<IScenariosDataResponse>(`${BASE_URL}/scenario?group_id=${group_id}`);

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
}) => instanceWithAuth.post(`${BASE_URL}/scenario`, params);

export const modifyScenario = (params: { id: string; simulation_name?: string; memo?: string }) =>
  instanceWithAuth.patch(`${BASE_URL}/scenario`, params);

export const deleteScenario = (params: { scenario_id: string }) =>
  instanceWithAuth.patch(`${BASE_URL}/scenario/deactivate?${new URLSearchParams(params).toString()}`);

export const deleteScenarioMulti = (params: { scenario_ids: string[] }) =>
  instanceWithAuth.patch(`${BASE_URL}/scenario/deactivate/multiple`, params);

export const duplicateScenario = (params: { scenario_id: string; editor: string }) =>
  instanceWithAuth.post(`${BASE_URL}/scenario/duplicate?${new URLSearchParams(params).toString()}`);

export const setMasterScenario = (params: { group_id: string; scenario_id: string }) =>
  instanceWithAuth.patch(`${BASE_URL}/scenario/master?${new URLSearchParams(params).toString()}`);

interface IScenarioMetadataResponse {
  checkpoint: string;
  metadata: IScenarioMetadata;
}

export const getScenarioMetadata = (params: { simulation_id: string }) =>
  instanceWithAuth.get<IScenarioMetadataResponse>(
    `${BASE_URL}/scenario/metadata?${new URLSearchParams(params).toString()}`
  );

export const setScenarioMetadata = (params: Partial<Omit<IScenarioMetadata, 'id'>>) =>
  instanceWithAuth.put(`${BASE_URL}/scenario/metadata`, params);

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
  instanceWithAuth.post<IFlightScheduleResponse>(
    `${BASE_URL}/flight-schedule?simulation_id=${simulation_id}`,
    params
  );
