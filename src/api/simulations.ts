import { useQuery } from 'react-query';
import axios from '@/lib/axios';

export interface IConditionData {
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

export interface IFlightScheduleResponse {
  add_conditions: Array<IConditionData>;
  chart_x_data: string[];
  chart_y_data: IChartData;
  total: number;
}

export const getFlightSchedule = (params: {
  first_load: boolean;
  user_id: string;
  airport: string;
  date: string;
  condition: Array<{
    criteria: string;
    operator: string;
    value: string[];
  }>;
}) => axios.post<IFlightScheduleResponse>('/api/v1/simulations/flight-schedule', params);

export interface IScenarioData {
  created_at: string;
  editor: string;
  id: string;
  is_active: boolean;
  note: string;
  simulation_date?: string;
  simulation_name: string;
  simulation_url?: string;
  size?: number;
  terminal: string;
  updated_at?: string;
  user_id?: string;
}

export const getScenarioList = () => axios.get<IScenarioData[]>('/api/v1/simulations/scenario');

export const useScenarioList = () => {
  const response = useQuery('ScenarioList', () => getScenarioList().then<IScenarioData[]>(response => response?.data));

  return {
      ...response,
      scenarioList: response?.data || [],
  };
};

export const createScenario = (params: {
  simulation_name: string;
  terminal: string;
  editor: string;
  note: string;
}) => axios.post('/api/v1/simulations/scenario', params);
