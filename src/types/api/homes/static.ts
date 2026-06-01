/** Sankey node/link payload from GET /homes/{scenarioId}/static */
export interface HomeSankeyDiagramData {
  process_info?: Record<
    string,
    {
      facilities?: string[];
      pax_count?: number;
    }
  >;
  label?: string[];
  link: {
    source: number[];
    target: number[];
    value: number[];
  };
}

export interface HistogramBin {
  range: (number | null)[];
  value: number;
}

export interface HistogramChartSlice {
  bins: HistogramBin[];
  range_unit: string;
  value_unit?: string;
}

/** GET /homes/{scenarioId}/static */
export interface HomeStaticData {
  flow_chart?: Record<string, Record<string, Record<string, number[]>>>;
  histogram?: Record<string, Record<string, Record<string, HistogramChartSlice>>>;
  sankey_diagram?: HomeSankeyDiagramData;
}

/** Hourly trends chart metric series */
export interface FlowChartMetricSeries {
  inflow?: number[];
  outflow?: number[];
  queue_length?: number[];
  waiting_time?: number[];
  capacity?: number[];
}

/** Zone-level or airline/flight nested chart data */
export interface FlowChartZoneData extends FlowChartMetricSeries {
  airlines?: Record<string, FlowChartMetricSeries>;
  flights?: Record<string, FlowChartMetricSeries>;
  sub_facilities?: string[];
  facility_data?: Record<string, FlowChartZoneData>;
}

/** Facility group wrapper in hourly trends UI */
export interface FlowChartFacilityGroup {
  data?: Record<string, FlowChartZoneData>;
  facilities?: string[];
  airline_names?: Record<string, string>;
  flight_airline_map?: Record<string, string>;
}

export type HomeHourlyTrendsData = Record<
  string,
  FlowChartFacilityGroup | FlowChartZoneData
> & {
  times?: string[];
};
