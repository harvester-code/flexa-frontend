import axios from '@/lib/axios';

export interface IConditionData {
  name: string;
  operator: string [];
  value: string [];
};

export interface IChartData {
  [name: string]: Array<{
    name: string;
    order: number;
    y: Array<number>;
    acc_y?: Array<number>;
  }>;
}

export interface IFlightScheduleResponse {
  add_conditions: Array<IConditionData>,
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
