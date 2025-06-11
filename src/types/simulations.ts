import { ConditionParams, ConditionState } from '@/types/conditions';
import { GridTableHeader, GridTableRow } from '@/app/(protected)/simulation/[id]/_components/GridTable';
import { Procedure } from './scenarios';

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
  page: number;
  total_count: number;
  user_scenario: ScenarioData[];
  scenarios?: ScenarioData[];
}

type ScenarioOverview = {
  matric: Overview[];
  snapshot: unknown;
};

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
  facility_conn: Partial<FacilityConnection>;
  facility_info: Partial<FacilityInformation>;
  simulation: Partial<SimulationResponse>;
  history: ScenarioHistory[];
}

interface ScenarioInfo {
  editor: string;
  memo: string;
  simulation_name: string;
  terminal: string;
}

interface ScenarioMetadataResponse {
  checkpoint: string;
  metadata: ScenarioMetadata;
  scenario_info: ScenarioInfo;
}

interface FlightSchedule {
  params: unknown;
  snapshot: unknown;
}

interface PassengerPatternState {
  conditions?: ConditionState[];
  mean?: string;
  stddev?: string;
}

interface PassengerSchedule {
  params: unknown;
  snapshot: unknown;
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
  procedures: ProcessingProcedureData[];
  snapshot: unknown;
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
  dst_chart: unknown;
  total: number;
  total_sub_obj: Array<{
    title: string;
    value: string;
    unit?: string;
  }>;
}

interface FacilityConnection {
  params: unknown;
  snapshot: unknown;
}

interface FacilityInformation {
  params: unknown;
  snapshot: unknown;
}

interface FacilityConnectionResponse {
  [procedure: string]: Capacity;
}

interface FacilityInfoLineChartResponse {
  x: string[];
  y: number[];
}

interface ProcessingProceduresResponse {
  process: Procedure[];
}

interface ConditionTableData {
  title?: string;
  header: GridTableHeader[];
  data: GridTableRow[];
  hidden?: boolean;
}

interface FacilitiesConnectionState {
  sourceConditions?: ConditionState[];
  ifConditions?: ConditionState[];
  destConditions?: ConditionState[];
  tableData?: ConditionTableData;
}

interface Capacity {
  bar_chart_x_data: string[];
  bar_chart_y_data: {
    [name: string]: {
      total: number;
      y: number[];
    };
  };
}

interface Capacities {
  [procedure: string]: Capacity;
}

interface Overview {
  name: string;
  value: string;
}

interface ProcedureInfo {
  text: string;
  number?: number;
}

interface SimulationResponse {
  simulation_completed: Array<{
    title: string;
    value: number;
  }>;
  chart: Array<{
    node: string;
    process: string;
    inbound: {
      chart_x_data: string[];
      chart_y_data: ChartData;
    };
    outbound: {
      chart_x_data: string[];
      chart_y_data: ChartData;
    };
    queing: {
      chart_x_data: string[];
      chart_y_data: ChartData;
    };
    waiting: {
      chart_x_data: string[];
      chart_y_data: number[];
    };
  }>;
  kpi: Array<{
    node: string;
    process: string;
    kpi: Array<{
      title: string;
      value: number;
      unit?: string;
    }>;
  }>;
  sankey: {
    label: string[];
    link: {
      source: number[];
      target: number[];
      value: number[];
    };
  };
  total: {
    [id: string]: number[];
  };
  line_chart: Array<{
    node: string;
    process: string;
    y: number[];
  }>;
}

interface SimulationOverviewResponse {
  sankey: {
    label: string[];
    link: {
      source: number[];
      target: number[];
      value: number[];
    };
  };
  matric: Array<Overview>;
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
  ConditionTableData,
  FacilitiesConnectionState,
  FacilityConnection,
  FacilityConnectionResponse,
  FacilityInformation,
  FacilityInfoLineChartResponse,
  Capacity,
  Capacities,
  Overview,
  ProcedureInfo,
  SimulationResponse,
  SimulationOverviewResponse,
  ScenarioHistory,
  ScenarioMetadata,
  ScenarioMetadataResponse,
  ScenarioOverview,
  ScenariosDataResponse,
  ScenarioData,
  ScenarioInfo,
};
