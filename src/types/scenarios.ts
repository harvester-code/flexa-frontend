import type { CellStyle } from '@silevis/reactgrid';
import { Condition, ConditionData } from '@/types/conditions';
import { GridTableRow } from '@/app/(protected)/simulation/[id]/_components/SimulationGridTable';

// Local Filter types for scenarios (different from conditions)
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

// ======================================================
// API 응답 타입 정의
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
  chart_y_data: {
    Airline: Array<{ name: string; order: number; y: number[] }>;
    Terminal: Array<{ name: string; order: number; y: number[] }>;
    'I/D': Array<{ name: string; order: number; y: number[] }>;
  };
}

export interface PassengerScheduleResponse {
  bar_chart_x_data: string[];
  bar_chart_y_data: {
    [key: string]: {
      name: string;
      order: number;
      y: number[];
      acc_y?: number[];
    }[];
  };
  dst_chart: unknown;
  total: number;
}

export interface PassengerShowUpResponse {
  total: number;
  summary: {
    flights: number;
    avg_seats: number;
    load_factor: number;
  };
  bar_chart_x_data: string[];
  bar_chart_y_data: {
    [key: string]: Array<{
      name: string;
      order: number;
      y: number[];
    }>;
  };
}

// ======================================================
export interface ScenarioOverview {
  matrix: {
    name: string;
    value: string | string[] | null;
  }[];
}

// ======================================================
export interface FlightSchedule {
  airport: string;
  date: string;
  availableConditions: {
    types: {
      International: Array<{ iata: string; name: string }>;
      Domestic: Array<{ iata: string; name: string }>;
    };
    terminals: {
      [terminalName: string]: Array<{ iata: string; name: string }>;
    };
    airlines: Array<{ iata: string; name: string }>;
  };
  selectedConditions: {
    types: string[];
    terminal: string[];
    selectedAirlines: Array<{ iata: string; name: string }>;
    availableAirlines: Array<{ iata: string; name: string }>;
  };
  total: number;
  chartData: FlightScheduleChartData | null;
  isCompleted: boolean;
}

// NOTE: API 서버에서 아래와 같은 형태로 응답을 제공
export interface FilterOptionsResponse {
  name: string;
  operator: string[];
  value: string[];
}

export interface FlightScheduleChartData {
  total?: number;
  x?: string[];
  data?: {
    [key: string]: Array<{ name: string; order: number; y: number[]; acc_y?: number[] }>;
  };
}

// ======================================================

export interface PassengerSchedule {
  destribution_conditions: DestributionCondition[];
  isCompleted: boolean;
  // API 응답 데이터
  apiResponseData: PassengerShowUpResponse | null;
}

export interface DestributionCondition {
  index: number;
  name: string; // 그룹 이름
  conditions: DestributionConditionItem[];
  mean: number;
  standard_deviation: number;
}

export interface DestributionConditionItem {
  criteria: string;
  operator: string;
  value: string[];
}

// ======================================================

export interface AirportProcessing {
  procedures: Array<{
    order: number;
    process: string;
    facility_names: string[];
  }>;
  entryType: string;
  isCompleted: boolean;
}

// ======================================================
export interface FacilityConnection {
  processes: Record<
    string,
    {
      name: string;
      nodes: string[];
      source: string | null;
      destination: string | null;
      default_matrix: Record<string, any> | null;
      priority_matrix: any[] | null;
    }
  >;
  isCompleted: boolean;
}

// TODO: 이름들을 개선해야한다. 현재 데이터 형태가 다름에도 같은 이름인 변수들이 있다.
export interface AllocationTable {
  title: string;
  header: AllocationTableHeader[];
  data: AllocationTableRow[] | null;
  sourceCondition: FilterOptions;
  destCondition: FilterOptions;
  waitTime: string;
  hidden?: boolean;
}

export interface AllocationTableHeader {
  name: string;
  width?: number;
  minWidth?: number;
  style?: CellStyle;
}

export interface AllocationTableRow extends GridTableRow {
  // name: string;
  // values: string[];
  // style?: CellStyle;
  // height?: number;
  // checkToNumber?: number[];
  // cellStyles?: { [index: string]: CellStyle };
  hidden?: boolean;
}

export interface AllocationCondition {
  ifConditions: Filter[];
  sourceConditions: Filter[];
  destConditions: Filter[];
  tableData: Omit<AllocationTable, 'sourceCondition' | 'destCondition' | 'waitTime'>;
}

// ======================================================
export interface FacilityCapacity {
  selectedNodes: number[];
  settings: {
    [key: string]: FacilityCapacitySetting;
  };
  isCompleted: boolean;
}

export interface FacilityCapacityBarChartData {
  [key: string]: {
    bar_chart_x_data: string[];
    bar_chart_y_data: {
      [key: string]: { total: number; y: number[] };
    };
  };
}

export interface FacilityCapacitySetting {
  numberOfEachDevices: number;
  processingTime: number;
  maximumQueuesAllowedPer: number;
  timeUnit: number;
  automaticInput: boolean;
  overviewChartVisible: boolean;
  facilityType: 'limited_facility' | 'unlimited_facility';
  // ------ 시설 기본 세팅 테이블 데이터
  defaultTableData: {
    header: AllocationTableHeader[];
    data: AllocationTableRow[];
  } | null;
  // ------ 시설 오픈 시간 테이블 데이터
  openingHoursTableData: {
    header: AllocationTableHeader[];
    data: AllocationTableRow[];
  } | null;
  // ------ 시설별 용량 라인 차트 데이터
  lineChartData: {
    x: string[];
    y: number[];
  } | null;
}

// ======================================================
// FlightSchedule 관련 추가 타입 정의

export interface AirlineInfo {
  iata: string;
  name: string;
}

export interface LocalChartData {
  total?: number;
  x?: string[];
  data?: {
    [key: string]: Array<{ name: string; order: number; y: number[]; acc_y?: number[] }>;
  };
}

export interface APIRequestLog {
  timestamp: string;
  request: any; // 다양한 API 요청 형태를 지원하기 위해 any 타입으로 변경
  response: any;
  status: 'loading' | 'success' | 'error';
  error?: string;
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
  selectedAirlines: AirlineInfo[];
}

// ======================================================
