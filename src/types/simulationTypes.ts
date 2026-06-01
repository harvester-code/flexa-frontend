import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiLogPayload, ChartData, ChartSeries } from '@/types/api/common';

export type {
  CreateScenarioRequest as CreateScenarioParams,
  FlightSchedulesRequest as FlightSchedulesParams,
  MetadataSaveResponse,
  MetadataLoadResponse,
  FlightScheduleResponse,
  ShowUpPassengerResponse as PassengerShowUpResponse,
  SimplifiedCondition,
  ScenarioMetadataPayload,
} from '@/types/api/simulations';

export type { ChartData, ChartSeries };

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

export interface Condition {
  logic: string;
  criteria: string;
  operator: string;
  value: string[];
}

// =======================================================================
// Domain Types
// =======================================================================

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

export interface ProcessStep {
  step: number;
  name: string;
  travel_time_minutes: number | null;
  process_time_seconds?: number | null;
  entry_conditions: EntryCondition[];
  zones: Record<string, Zone>;
}

export interface Zone {
  facilities: Facility[];
}

export interface Facility {
  id: string;
  operating_schedule: {
    time_blocks: TimeBlock[];
  };
}

export interface TimeBlock {
  period: string;
  process_time_seconds: number;
  passenger_conditions: PassengerCondition[];
  activate?: boolean;
}

export interface EntryCondition {
  field: string;
  values: string[];
}

export interface PassengerCondition {
  field: string;
  values: string[];
}

export interface FacilityCapacitySetting {
  max_queue_length: number;
  facility_count: number;
  facility_schedules: number[][];
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

// =======================================================================
// API Log Types
// =======================================================================

export interface APIRequestLog {
  timestamp: string;
  endpoint?: string;
  method?: string;
  request?: ApiLogPayload;
  response?: ApiLogPayload;
  requestBody?: ApiLogPayload;
  responseData?: ApiLogPayload;
  status: 'loading' | 'success' | 'error';
  duration?: number;
  error?: string;
  errorMessage?: string;
}

export interface HttpErrorLike {
  response?: {
    status?: number;
    data?: { detail?: string; message?: string };
  };
  message?: string;
}

export type AxiosRetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};
