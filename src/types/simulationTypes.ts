import type { CellStyle } from '@silevis/reactgrid';

// =======================================================================
// Common Types
// =======================================================================

export interface Option {
  label: string;
  value: string;
  [key: string]: string | undefined;
}

// =======================================================================
// Condition Types
// =======================================================================

export interface DropdownItem {
  id: string;
  text: string;
  fullText?: string;
  tooltip?: {
    title?: string;
    text: string;
  };
}

export interface OperatorItem extends DropdownItem {
  multiSelect: boolean;
}

export interface ConditionData {
  logicItems: DropdownItem[];
  criteriaItems: DropdownItem[];
  operatorItems: { [criteriaId: string]: OperatorItem[] };
  valueItems: { [criteriaId: string]: DropdownItem[] };
}

export interface ConditionParams {
  name: string;
  operator: string[];
  value: string[];
}

export interface Condition {
  logic: string;
  criteria: string;
  operator: string;
  value: string[];
}

export interface SimplifiedCondition {
  field: string;
  values: string[];
}

export interface ConditionState {
  index?: number;
  conditions: Condition[];
  mean?: number;
  standard_deviation?: number;
}

// =======================================================================
// Service Layer Interfaces
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
  type: string;
  conditions: SimplifiedCondition[];
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
    };
  };
  s3_key: string;
  loaded_at: string;
}

// =======================================================================
// Scenario Response Types
// =======================================================================

export interface FlightScheduleResponse {
  total: number;
  types: {
    International: Array<{ iata: string; name: string }>;
    Domestic: Array<{ iata: string; name: string }>;
  };
  terminals: {
    [terminalName: string]: Array<{ iata: string; name: string }>;
  };
  chart_x_data: string[];
  chart_y_data: ChartData;
}

export interface PassengerScheduleResponse {
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

export interface PassengerShowUpResponse {
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

export interface ChartData {
  [name: string]: Array<{
    name: string;
    order: number;
    y: Array<number>;
    acc_y?: Array<number>;
  }>;
}

// =======================================================================
// Domain Types
// =======================================================================

export interface ScenarioOverview {
  matrix: Array<{
    name: string;
    value: string;
  }>;
}

export interface FlightSchedule {
  airport: string;
  date: string;
  type: 'departure' | 'arrival';
  availableConditions: AvailableConditions;
  selectedConditions: SelectedConditions;
  total: number;
  chartData: ChartData | null;
  isCompleted: boolean;
}

export interface AvailableConditions {
  types: {
    International: AirlineInfo[];
    Domestic: AirlineInfo[];
  };
  terminals: {
    [terminalName: string]: AirlineInfo[];
  };
  airlines: AirlineInfo[];
}

export interface SelectedConditions {
  types: string[];
  terminal: string[];
  selectedAirlines: string[];
}

export interface AirlineInfo {
  iata: string;
  name: string;
}

// New JSON structure for show_up_pax.json
export interface PassengerScheduleShowUpPax {
  settings: Record<string, any>;
  pax_demographics: Record<string, any>;
  pax_arrival_patterns: {
    rules: Array<{
      conditions: {
        operating_carrier_iata: string[];
      };
      mean: number;
      std: number;
    }>;
    default: {
      mean: number;
      std: number;
    };
  };

  apiResponseData: PassengerScheduleResponse | null;
  isCompleted: boolean;
}

export interface AirportProcessing {
  process_flow: ProcessStep[];
  isCompleted: boolean;
}

export interface ProcessStep {
  step: number;
  name: string;
  travel_time_minutes: number | null;
  entry_conditions: EntryCondition[];
  zones: Record<string, Zone>;
}

export interface Zone {
  facilities: Facility[];
}

export interface Facility {
  id: string;
  operating_schedule: Record<string, {
    time_blocks: TimeBlock[];
  }>;
}

export interface TimeBlock {
  period: string;
  process_time_seconds: number;
  passenger_conditions: PassengerCondition[];
}

export interface EntryCondition {
  field: string;
  values: string[];
}

export interface PassengerCondition {
  field: string;
  values: string[];
}



export interface FacilityCapacity {
  selectedNodes: number[];
  settings: Record<string, FacilityCapacitySetting>;
  isCompleted: boolean;
}

export interface FacilityCapacitySetting {
  max_queue_length: number;
  facility_count: number;
  facility_schedules: number[][];
}

// =======================================================================
// Filter Types
// =======================================================================

export interface Filter {
  logic: string;
  criteria: string;
  operator: string;
  value: string[];
}

export interface FilterOptions {
  logicItems: Array<{ id: string; text: string; fullText?: string }>;
  criteriaItems: Array<{ id: string; text: string; fullText?: string }>;
  operatorItems: { [key: string]: Array<{ id: string; text: string; multiSelect: boolean }> };
  valueItems: { [key: string]: Array<{ id: string; text: string; fullText?: string }> };
}

// =======================================================================
// Grid Types
// =======================================================================

export interface AllocationTableHeader {
  text: string;
  value: string;
  width: number;
  resizable: boolean;
  style?: CellStyle;
}

export interface AllocationTableRow {
  id: string;
  data: { [key: string]: string | number };
}

// =======================================================================
// API Log Types
// =======================================================================

export interface APIRequestLog {
  timestamp: string;
  endpoint: string;
  method: string;
  requestBody?: any;
  responseData?: any;
  status: 'loading' | 'success' | 'error';
  duration?: number;
  errorMessage?: string;
}
