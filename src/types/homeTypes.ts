// Home 도메인에서 사용하는 공통 타입들
export interface Option {
  label: string;
  value: string;
  [key: string]: string | undefined;
}

// Home 도메인에서 사용하는 시나리오 데이터 타입
export interface ScenarioData {
  airport: string;
  created_at: string;
  id: string;
  scenario_id: string;
  is_active: boolean;
  memo: string;
  name: string;
  target_flight_schedule_date: string | null;
  terminal: string;
  updated_at: string;
  user_id: string;
  simulation_status: 'pending' | 'processing' | 'completed' | 'failed';
  home_cache_status?: 'pending' | 'processing' | 'completed' | 'failed';
  metadata_updated_at: string | null;
  has_simulation_data?: boolean; // S3에 simulation-pax.parquet 파일 존재 여부
  has_home_static_cache?: boolean; // S3에 home-static-response JSON 존재 여부
}

/** 홈 분석 API 호출 가능 여부 (시뮬 parquet + home static JSON 준비 완료) */
export function isHomeAnalysisReady(scenario: ScenarioData | null | undefined): boolean {
  if (!scenario) return false;
  return (
    scenario.simulation_status === 'completed' &&
    scenario.home_cache_status === 'completed' &&
    scenario.has_simulation_data !== false &&
    scenario.has_home_static_cache !== false
  );
}

/** Home 시나리오 선택 UI 상태 */
export type HomeScenarioSelectState = 'ready' | 'processing' | 'unavailable';

export function getHomeScenarioSelectState(
  scenario: ScenarioData | null | undefined
): HomeScenarioSelectState {
  if (!scenario) return 'unavailable';
  if (isHomeAnalysisReady(scenario)) return 'ready';
  if (isSimulationPipelineActive(scenario)) return 'processing';
  return 'unavailable';
}

/** Run simulation 파이프라인 진행 중 (시뮬 또는 홈 캐시) */
export function isSimulationPipelineActive(scenario: {
  simulation_status?: string;
  home_cache_status?: string;
}): boolean {
  if (scenario.simulation_status === 'failed' || scenario.home_cache_status === 'failed') {
    return false;
  }
  if (scenario.home_cache_status === 'completed') return false;
  return (
    scenario.simulation_status === 'processing' || scenario.home_cache_status === 'processing'
  );
}

// Home 도메인에서 사용하는 시나리오 응답 타입 (단순화됨)
export type ScenariosDataResponse = Array<ScenarioData>;

export interface FacilityChartSeries {
  label: string;
  values: number[];
}

export interface FacilityChartSummary {
  totalInflow: number;
  totalOutflow: number;
  maxCapacity: number;
  averageCapacity: number;
  bottleneckTimes: string[];
}

export interface FacilityChartData {
  step: string;
  facilityId: string;
  zoneId: string;
  zoneName: string;
  intervalMinutes: number;
  timeRange: string[];
  capacity: number[];
  inflowSeries: FacilityChartSeries[];
  outflowSeries: FacilityChartSeries[];
  totalInflow: number[];
  totalOutflow: number[];
  facilityInfo: string;
  summary: FacilityChartSummary;
}

export interface FacilityChartsStep {
  step: string;
  facilityCharts: FacilityChartData[];
}

interface FacilityChartsResponse {
  steps: FacilityChartsStep[];
}

export interface PassengerSummaryTotals {
  passengers: number;
  flightDates: string[];
  showUpWindow: {
    start: string | null;
    end: string | null;
  };
}

export interface PassengerTopDestination {
  airport: string | null | undefined;
  city: string | null | undefined;
  country: string | null | undefined;
  passengers: number;
  share: number;
}

export interface CarrierPassengerSummary {
  label: string | null | undefined;
  passengers: number;
  flights: number;
  destinations: number;
  topDestination: PassengerTopDestination;
}

export interface DestinationPassengerSummary {
  label: string | null | undefined;
  country: string | null | undefined;
  passengers: number;
  airports: number;
}

interface PassengerSummaryResponse {
  totals: PassengerSummaryTotals;
  dimensions: {
    carrier: CarrierPassengerSummary[];
    city: DestinationPassengerSummary[];
    country: DestinationPassengerSummary[];
  };
}

export interface FlightSummaryTotals {
  flights: number;
  passengers: number;
  carriers: number;
  dateRange: string[];
  firstDeparture: string | null;
  lastDeparture: string | null;
}

export interface FlightHourCarrierSummary {
  label: string;
  flights: number;
}

export interface FlightHourSummary {
  hour: number;
  label: string;
  flights: number;
  carriers: FlightHourCarrierSummary[];
}

export interface FlightClassDistribution {
  class: string;
  label: string;
  flights: number;
  ratio: number;
}

export interface FlightCarrierSummary {
  label: string;
  flights: number;
  passengers: number;
  topDestination: {
    airport: string | null;
    city: string | null;
    country: string | null;
    flights: number;
  };
  topAircraft: Array<{
    type: string;
    flights: number;
    code?: string | null;
    class?: string;
    manufacturer?: string | null;
  }>;
}

export interface FlightDetailSummary {
  flightNumber: string | null;
  carrier: string;
  departure: {
    airport: string | null;
    city: string | null;
    country: string | null;
    datetime: string | null;
  };
  arrival: {
    airport: string | null;
    city: string | null;
    country: string | null;
    datetime: string | null;
  };
  aircraft: string;
  aircraftCode: string | null;
  aircraftClass: string;
  aircraftManufacturer: string | null;
  passengers: number;
  totalSeats: number | null;
}

export interface TimeHMS {
  hour: number;
  minute: number;
  second: number;
}

export interface TimeMetrics {
  metric: string; // "mean" or "p{percentile}" (e.g., "p30")
  open_wait: TimeHMS;
  queue_wait: TimeHMS;
  total_wait: TimeHMS;
  process_time: TimeHMS;
}

export interface DwellTimes {
  commercial_dwell_time: TimeHMS;
  airport_dwell_time: TimeHMS;
}

interface FlightSummaryResponse {
  totals: FlightSummaryTotals;
  hours: FlightHourSummary[];
  classDistribution: FlightClassDistribution[];
  carriers: FlightCarrierSummary[];
  flights: FlightDetailSummary[];
  timeMetrics?: TimeMetrics;
  dwellTimes?: DwellTimes;
}

// ============================================================
// KPI 선택 공용 타입
// ============================================================

export interface KpiValue {
  type: 'mean' | 'top';
  percentile?: number;
  cumulative?: boolean;
}

// ============================================================
// Home API 응답 타입 (/homes/{scenarioId}/static)
// ============================================================

export interface HomeStaticData {
  flow_chart?: Record<string, unknown>;
  histogram?: Record<string, unknown>;
  sankey_diagram?: Record<string, unknown>;
}

// ============================================================
// Home API 응답 타입 (/homes/{scenarioId}/metrics)
// ============================================================

/** 프로세스별 대기시간 정보 */
export interface ProcessWaitingTime {
  total: TimeHMS;
  open_wait: TimeHMS;
  queue_wait: TimeHMS;
}

/** 승객 경험 (Pax Experience) */
export interface PaxExperience {
  waiting_time: Record<string, ProcessWaitingTime>;
  queue_length: Record<string, number>;
}

/** 시설 메트릭 (Efficiency) */
export interface FacilityMetric {
  process: string;
  operating_rate: number;
  utilization_rate: number;
  total_rate: number;
  zones?: Record<string, unknown>;
}

/** 승객 요약 (Throughputs) */
export interface PassengerSummary {
  total: number;
  completed: number;
  missed: number;
}

/** GDP 데이터 */
export interface GdpData {
  formatted: string;
  year: number;
}

/** 공항 컨텍스트 (Economic Impact 출처 정보) */
export interface AirportContext {
  country_name: string;
  gdp_ppp?: GdpData;
  gdp?: GdpData;
  gdp_ppp_per_capita?: GdpData;
  gdp_per_capita?: GdpData;
}

/** 경제적 영향 (Monetary Value of Time) */
export interface EconomicImpact {
  total_wait_value: number;
  process_time_value: number;
  commercial_dwell_value: number;
  airport_context?: AirportContext;
}

/** metrics API 전체 응답 (summary) */
export interface HomeSummaryData {
  pax_experience?: PaxExperience;
  timeMetrics?: TimeMetrics;
  dwellTimes?: DwellTimes;
  facility_metrics?: FacilityMetric[];
  passenger_summary?: PassengerSummary;
  economic_impact?: EconomicImpact;
}

// ============================================================
// Home API 응답 타입 - Facility Details
// ============================================================

/** 시설 세부 컴포넌트 */
export interface FacilityDetailComponent {
  title: string;
  throughput: number;
  queuePax: number;
  waitTime: TimeHMS;
  facility_effi: number;
  workforce_effi: number;
  opened: [number, number];
}

/** 시설 세부 카테고리 개요 */
export interface FacilityDetailOverview {
  throughput: number;
  queuePax: number;
  waitTime: TimeHMS;
  facility_effi: number;
  workforce_effi: number;
  opened: [number, number];
}

/** 시설 세부 카테고리 */
export interface FacilityDetailCategory {
  category: string;
  overview: FacilityDetailOverview;
  components: FacilityDetailComponent[];
}

/** metrics API 전체 응답 */
export interface HomeMetricsData {
  summary: HomeSummaryData;
  facility_details: FacilityDetailCategory[];
}

// ============================================================
// Missed Flights Analysis
// ============================================================

export interface StepSaturation {
  total_counters: number;
  occupied_counters: number;
  all_occupied: boolean;
  competing_pax: number;
}

export interface FacilityBreakdownItem {
  pax_count: number;
  zone: string | null;
  first_served: string | null;         // "HH:MM" 실제 첫 처리 시작 (parquet 실측)
  last_served: string | null;          // "HH:MM" 실제 마지막 처리 완료 (parquet 실측)
  process_time_s: number | null;       // seconds per pax
  avg_queue_wait_s: number | null;     // 이 시설 이용 승객의 평균 큐 대기시간 (초)
  arrival_range: { earliest: string; latest: string } | null;  // _no_counter only
}

export interface MissedFlightStepStats {
  missed_avg_seconds: number | null;
  completed_avg_seconds: number | null;
  avg_margin_after_s: number | null;
  failure_type: 'no_facility' | 'cascading' | null;
  no_facility_count: number;           // 이전 호환 (no_counter + timing)
  no_counter_count: number;            // ② 시간 있음, 카운터 없음
  timing_count: number;                // ③ 도착했으나 출발 전 처리 불가
  cascading_count: number;             // ① 이전 스텝 실패로 진입 불가
  arrival_range: { earliest: string; latest: string } | null;
  no_counter_arrival: { earliest: string; latest: string } | null;
  timing_arrival: { earliest: string; latest: string } | null;
  eligible_count: number | null;
  saturation: StepSaturation | null;
  facility_breakdown: Record<string, FacilityBreakdownItem>;
}

export interface MissedFlightItem {
  flight_key: string;
  carrier: string;
  carrier_name: string | null;
  flight_number: string | null;
  departure_time: string | null;
  departure_date: string | null;
  total: number;
  failed: number;
  failed_rate: number;
  risk_level: 'high' | 'medium' | 'low';
  time_budget_seconds: number | null;
  steps: Record<string, MissedFlightStepStats>;
  bottleneck_step: string | null;
  first_failed_step: string | null;
  no_facility_count: number;
  cascading_count: number;
}

export interface MissedFlightsData {
  flights: MissedFlightItem[];
}
