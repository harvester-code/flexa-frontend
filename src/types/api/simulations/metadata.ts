import type { ParquetMetadataItem } from '@/types/parquet';
import type { ProcessStep } from '@/types/simulationTypes';
import type { PaxRule } from './show-up-passenger';
import type { FlightFiltersResponse } from './flight-filters';
import type { ChartData } from '../common';

export interface SimplifiedCondition {
  field: string;
  values: string[];
}

/** UI profile persisted inside legacy metadata.tabs */
export interface ScenarioProfileMetadata {
  checkpoint?: string;
  scenarioName?: string;
  scenarioTerminal?: string;
  scenarioHistory?: string[];
  availableScenarioTab?: number;
  currentScenarioTab?: number;
}

export interface ScenarioContextMetadata {
  scenarioId: string;
  airport: string;
  terminal?: string;
  date: string;
  lastSavedAt: string | null;
}

export interface ScenarioFlightMetadata {
  total_flights: number | null;
  airlines: Record<string, string> | null;
  filters: FlightFiltersResponse['filters'] | Record<string, unknown> | null;
  selectedConditions: {
    type: 'departure' | 'arrival';
    conditions: SimplifiedCondition[];
    expected_flights?: {
      selected: number;
      total: number;
    };
    originalLocalState?: Record<string, unknown>;
  } | null;
  appliedFilterResult: {
    total: number;
    chart_x_data: string[];
    chart_y_data: ChartData;
    appliedAt?: string;
    parquet_metadata?: ParquetMetadataItem[];
  } | null;
}

export interface ScenarioPassengerMetadata {
  settings: {
    min_arrival_minutes: number | null;
  };
  pax_generation: {
    rules: Array<PaxRule<Record<string, number>>>;
    default: {
      load_factor: number | null;
      flightCount?: number;
    };
  };
  pax_demographics: {
    nationality: {
      available_values: string[];
      rules: Array<PaxRule<Record<string, number>>>;
      default: Record<string, number> & { flightCount?: number };
    };
    profile: {
      available_values: string[];
      rules: Array<PaxRule<Record<string, number>>>;
      default: Record<string, number> & { flightCount?: number };
    };
  };
  pax_arrival_patterns: {
    rules: Array<PaxRule<{ mean: number; std: number }>>;
    default: {
      mean: number | null;
      std: number | null;
      flightCount?: number;
    };
  };
  chartResult?: {
    total: number;
    chart_x_data: string[];
    chart_y_data?: ChartData;
    summary?: {
      flights: number;
      avg_seats: number;
      load_factor: number;
      min_arrival_minutes: number;
    };
  };
}

export interface ScenarioWorkflowMetadata {
  currentStep: number;
  step1Completed: boolean;
  step2Completed: boolean;
  availableSteps: number[];
}

export interface ScenarioTerminalLayoutMetadata {
  imageUrl?: string | null;
  zoneAreas: Record<
    string,
    {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  >;
}

/** POST /api/v1/simulations/{scenario_id}/metadata request body */
export interface ScenarioMetadataPayload {
  context: ScenarioContextMetadata;
  flight: ScenarioFlightMetadata;
  passenger: ScenarioPassengerMetadata;
  process_flow: ProcessStep[];
  terminalLayout: ScenarioTerminalLayoutMetadata;
  workflow: ScenarioWorkflowMetadata;
  schedule_interval_minutes?: number | null;
  savedAt?: string;
  /** Legacy nested tab snapshots (still read on load) */
  tabs?: {
    overview?: Record<string, unknown>;
    flightSchedule?: Record<string, unknown>;
    passengerSchedule?: Record<string, unknown>;
    processingProcedures?: Record<string, unknown>;
    scenarioProfile?: ScenarioProfileMetadata;
  };
}

/** GET /api/v1/simulations/{scenario_id}/metadata */
export interface MetadataLoadResponse {
  scenario_id: string;
  metadata: ScenarioMetadataPayload;
  s3_key: string;
  loaded_at: string;
  is_new_scenario?: boolean;
}

/** POST /api/v1/simulations/{scenario_id}/metadata */
export interface MetadataSaveResponse {
  s3_key: string;
  bucket: string;
  saved_at: string;
}
