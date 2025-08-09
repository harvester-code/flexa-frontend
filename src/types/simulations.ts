import { ConditionParams, ConditionState, SimplifiedCondition } from '@/types/conditions';
import { GridTableHeader, GridTableRow } from '@/app/(protected)/simulation/[id]/_components/SimulationGridTable';
import { Procedure } from './scenarios';

// =======================================================================
// Service Layer Interfaces (moved from services/simulations.ts)
// =======================================================================

export interface CreateScenarioParams {
  name: string;
  airport: string;
  terminal: string;
  editor: string;
  memo: string;
}

export interface FlightSchedulesParams {
  airport: string;
  date: string;
  condition: SimplifiedCondition[];
}

export interface PassengerSchedulesParams {
  destribution_conditions: ConditionState[];
}

export interface FacilityConnsParams extends PassengerSchedulesParams {
  processes: {
    [index: string]: {
      name: string;
      nodes: string[];
      source: string | null;
      destination: string;
      wait_time: number | null;
      default_matrix?: { [row: string]: { [col: string]: number } } | null;
      priority_matrix?: Array<{
        condition: Array<{ criteria: string; operator: string; value: string[] }>;
        matrix: { [row: string]: { [col: string]: number } };
      }> | null;
    };
  };
}

export interface SimulationParams extends FacilityConnsParams {
  scenario_id: string;
  components: Array<{
    name: string;
    nodes: Array<{
      id: number;
      name: string;
      max_queue_length: number;
      facility_count: number;
      facility_schedules: number[][];
    }>;
  }>;
}

export interface MetadataSaveResponse {
  s3_key: string;
  bucket: string;
  saved_at: string;
}

export interface MetadataLoadResponse {
  scenario_id: string;
  metadata: {
    tabs: {
      overview: any;
      flightSchedule: any;
      passengerSchedule: any;
      processingProcedures: any;
      facilityConnection: any;
      facilityInformation: any;
    };
  };
  s3_key: string;
  loaded_at: string;
}

interface ScenarioData {
  airport: string;
  created_at: string;
  editor: string;
  id: string;
  scenario_id: string;
  is_active: boolean;
  memo: string;
  name: string;
  status: 'yet' | 'running' | 'done';
  target_flight_schedule_date: string | null;
  terminal: string;
  updated_at: string;
  user_id: string;
  simulation_start_at: string | null;
  simulation_end_at: string | null;
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
  name: string;
  terminal: string;
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
  ScenarioOverview,
  ScenariosDataResponse,
  ScenarioData,
  ScenarioInfo,
};
