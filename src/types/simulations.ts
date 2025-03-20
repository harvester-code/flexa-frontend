import { IConditionData, IConditionParams, IConditionState } from '@/types/conditions';

interface ScenarioData {
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
  master_scenario: ScenarioData[];
  user_scenario: ScenarioData[];
}

interface IScenarioOverview {
  date: string;
  terminal: string;
  analysis_type: string;
  data_source: string;
  flights: string;
  passengers: string;
  passengers_pattern: string;
  generation_method: string;
  check_in: string;
  boarding_pass: string;
  security: string;
  passport: string;
}

interface IScenarioHistory {
  checkpoint: string;
  updated_at?: string;
  simulation: 'Done' | 'Yet';
  memo: string;
  error_count: number;
}

interface IScenarioMetadata {
  id: number;
  simulation_id: string;
  overview: Partial<IScenarioOverview>;
  flight_sch: Partial<IFlightSchedule>;
  passenger_sch: { [key: string]: any };
  passenger_attr: { [key: string]: any };
  facility_conn: { [key: string]: any };
  facility_info: { [key: string]: any };
  history: IScenarioHistory[];
}

interface IScenarioMetadataResponse {
  checkpoint: string;
  metadata: IScenarioMetadata;
}

interface IFlightSchedule {
  add_conditions: IConditionData;
  add_priorities: IConditionData;

  color_criteria: string;
  conditions: IConditionState[];
  airport: string;
  date: Date;
  conditions_visible: boolean;
}

interface IChartData {
  [name: string]: Array<{
    name: string;
    order: number;
    y: Array<number>;
    acc_y?: Array<number>;
  }>;
}

interface IFlightScheduleResponse {
  add_conditions: Array<IConditionParams>;
  add_priorities: Array<IConditionParams>;
  chart_x_data: string[];
  chart_y_data: IChartData;
  total: number;
}

export type {
  IChartData,
  IFlightSchedule,
  IFlightScheduleResponse,
  IScenarioHistory,
  IScenarioMetadata,
  IScenarioMetadataResponse,
  IScenarioOverview,
  IScenariosDataResponse,
  ScenarioData,
};
