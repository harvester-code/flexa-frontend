import { ConditionData, ConditionParams, ConditionState } from '@/types/conditions';

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

interface ScenariosDataResponse {
  master_scenario: ScenarioData[];
  user_scenario: ScenarioData[];
}

interface ScenarioOverview {
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

interface ScenarioHistory {
  checkpoint: string;
  updated_at?: string;
  simulation: 'Done' | 'Yet';
  memo: string;
  error_count: number;
}

interface ScenarioMetadata {
  id: number;
  scenario_id: string;
  overview: Partial<ScenarioOverview>;
  flight_sch: Partial<FlightSchedule>;
  passenger_sch: Partial<PassengerSchedule>;
  passenger_attr: Partial<ProcessingProcedures>;
  facility_conn: { [key: string]: any };
  facility_info: { [key: string]: any };
  history: ScenarioHistory[];
}

interface ScenarioMetadataResponse {
  checkpoint: string;
  metadata: ScenarioMetadata;
}

interface FlightSchedule {
  add_conditions: ConditionData;
  add_priorities: ConditionData;

  color_criteria: string;
  conditions: ConditionState[];
  airport: string;
  date: Date;
  conditions_visible: boolean;

  params: any;
}

interface PassengerPatternState {
  conditions?: ConditionState[];
  mean?: string;
  variance?: string;  
}

interface PassengerSchedule {
  priorities: PassengerPatternState[];
  other_passenger_state: PassengerPatternState;
  params: any;
}

interface ProcessingProcedureData {
  id: string;
  name: string;
  nodes: string[];
}

interface ProcessingProcedureState extends ProcessingProcedureData {
  nameText?: string;
  nodesText?: string;
  editable?: boolean;
}

interface ProcessingProcedures {
  data_connection_criteria: string;
  procedures: ProcessingProcedureData [];
}

interface ChartData {
  [name: string]: Array<{
    name: string;
    order: number;
    y: Array<number>;
    acc_y?: Array<number>;
  }>;
}

interface FlightSchedulesResponse {
  add_conditions: Array<ConditionParams>;
  add_priorities: Array<ConditionParams>;
  chart_x_data: string[];
  chart_y_data: ChartData;
  total: number;
}

interface PassengerScheduleResponse {
  bar_chart_x_data: string[];
  bar_chart_y_data: ChartData;
  dst_chart: any;
  total: number;
}

interface ProcessingProceduresResponse {
  process: ProcessingProcedureData [];
}

export type {
  ChartData,
  FlightSchedule,
  FlightSchedulesResponse,
  PassengerPatternState,
  PassengerSchedule,
  PassengerScheduleResponse,
  ProcessingProcedureData,
  ProcessingProcedureState,
  ProcessingProcedures,
  ProcessingProceduresResponse,
  ScenarioHistory,
  ScenarioMetadata,
  ScenarioMetadataResponse,
  ScenarioOverview,
  ScenariosDataResponse,
  ScenarioData,
};
