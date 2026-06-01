/** JSON-serializable primitive values */
export type JsonPrimitive = string | number | boolean | null;

/** JSON-serializable value (API payloads, logs, metadata) */
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/** Plotly / simulation chart series grouped by category */
export interface ChartSeries {
  name: string;
  order: number;
  y: number[];
  acc_y?: number[];
}

export interface ChartData {
  [category: string]: ChartSeries[];
}

/** Generic API log payload (request/response bodies) */
export type ApiLogPayload = unknown;
