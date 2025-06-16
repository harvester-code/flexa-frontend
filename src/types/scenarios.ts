import type { CellStyle } from '@silevis/reactgrid';
import { GridTableRow } from '@/app/(protected)/simulation/[id]/_components/GridTable';

// ======================================================
// API 응답 타입 정의
export interface FlightScheduleResponse {
  add_conditions: FilterOptionsResponse[];
  add_priorities: FilterOptionsResponse[];
  chart_x_data: string[];
  chart_y_data: FlightScheduleChartData;
  total: number;
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
  total_sub_obj: { title: string; value: string; unit: string }[];
}

export interface ScenarioMetadataResponse {
  checkpoint: string;
  metadata: ScenarioMetadata;
  scenario_info: ScenarioInformation;
}

// ======================================================
export interface ScenarioOverview {
  matrix: {
    name: string;
    value: string | string[] | null;
  }[];
}

interface ScenarioMetadata {
  id: number;
  scenario_id: string;
  overview: unknown;
  flight_schedule: unknown;
  passenger_schedule: unknown;
  processing_procedures: unknown;
  facility_connection: unknown;
  facility_information: unknown;
  history: unknown[];
}

interface ScenarioInformation {
  name: string;
  memo: string;
  editor: string;
  terminal: string;
}

// ======================================================
export interface Tooltip {
  title: string;
  text: string;
}

export interface Option {
  id: string;
  text: string;
  fullText?: string;
  tooltip?: Tooltip;
}

// export interface OperatorItem extends Omit<Option, 'tooltip'> {
export interface OperatorItem extends Option {
  multiSelect: boolean;
}

// export interface ValueItem extends Omit<Option, 'tooltip'> {
export interface ValueItem extends Option {
  fullText?: string;
}

export interface FilterOptions {
  logicItems: Option[];
  criteriaItems: Option[];
  operatorItems: { [key: string]: OperatorItem[] };
  valueItems: { [key: string]: ValueItem[] };
}

export interface Filter {
  logic: string;
  // logicVisible?: boolean;
  criteria: string;
  operator: string;
  value: string[];
}

// ======================================================
export interface FlightSchedule {
  datasource: number;

  targetAirport: { iata: string; name: string; searchText: string };
  targetDate: string;

  isFilterEnabled: boolean;
  filterOptions: FilterOptions | null;
  selectedFilters: Filter[];

  criterias: string[];
  selectedCriteria: string;

  chartData: {
    total: number;
    x: string[];
    data: FlightScheduleChartData;
  } | null;
}

// NOTE: API 서버에서 아래와 같은 형태로 응답을 제공
export interface FilterOptionsResponse {
  name: string;
  operator: string[];
  value: string[];
}

export interface FlightScheduleChartData {
  [key: string]: {
    name: string;
    order: number;
    y: number[];
    acc_y?: number[];
  }[];
}

// ======================================================

export interface PassengerSchedule {
  isFilterEnabled: boolean;

  filterOptions: FilterOptions | null;

  normalDistributionParams: NormalDistributionParam[];

  distributionData: Plotly.Data[] | null;
  vlineData: { x: number; minY: number; maxY: number; color: string }[] | null;

  chartData: {
    total: number;
    total_sub_obj: { title: string; value: string; unit: string }[];
    x: string[];
    data: {
      [key: string]: { name: string; order: number; y: number[] }[];
    };
  } | null;

  criterias: string[];

  selectedCriteria: string;
}

export interface NormalDistributionParam {
  conditions: Filter[];
  mean: number;
  stddev: number;
}

// ======================================================

export interface AirportProcessing {
  dataConnectionCriteria: string;
  procedures: Procedure[];
}

export interface Procedure {
  id: string;
  name: string;
  nameText?: string;
  nodes: string[];
  nodesText?: string;
  editable?: boolean;
}

// ======================================================
export interface FacilityConnection {
  selectedSecondTab: number;
  activedSecondTab: number;
  // activedSecondTabs: number[];

  allocationTables: AllocationTable[];

  allocationConditions: AllocationCondition[][];
  allocationConditionsEnabled: boolean[];

  snapshot: string | null;
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
  selectedSecondTab: number;
  availableSecondTab: number;

  selectedNodes: number[];

  settings: {
    [key: string]: FacilityCapacitySetting;
  };

  // ------ 시설별 여객 바 차트 데이터
  barChartData: FacilityCapacityBarChartData | null;
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
