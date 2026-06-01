import type { ChartData } from '../common';
import type { SimplifiedCondition } from './metadata';

/** POST /api/v1/simulations/{scenario_id}/flight-schedules */
export interface FlightSchedulesRequest {
  airport: string;
  date: string;
  conditions: SimplifiedCondition[];
}

export interface AirlineInfo {
  iata: string;
  name: string;
}

export interface FlightScheduleResponse {
  total: number;
  types: {
    International: AirlineInfo[];
    Domestic: AirlineInfo[];
  };
  terminals: Record<string, AirlineInfo[]>;
  chart_x_data: string[];
  chart_y_data: ChartData;
  parquet_metadata: {
    columns: Array<{
      name: string;
      unique_values: string[];
      count: number;
    }>;
  };
}
