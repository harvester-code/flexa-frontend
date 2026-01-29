import { createAPIService } from "@/lib/axios";

const api = createAPIService("ai-agent");

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SimulationState {
  airport: string;
  date: string;
  flight_selected: number;
  flight_total: number;
  airline_names: string[];
  airlines_mapping: Record<string, string>;
  passenger: {
    total: number;
    configured: boolean;
    pax_generation: any;  // rules 포함한 전체 구조
    pax_demographics: any;  // nationality, profile rules 포함
    pax_arrival_patterns: any;  // rules 포함
    chartResult: any;  // chart_x_data, chart_y_data 포함
  };
  process_count: number;
  process_names: string[];
  process_flow: any[];  // 전체 process_flow 데이터 (zones, facilities, time_blocks 포함)
  workflow: {
    flights_completed: boolean;
    passengers_completed: boolean;
    current_step: number;
  };
}

export interface ExecuteCommandRequest {
  content: string;
  conversation_history?: Message[];
  simulation_state?: SimulationState;
  model?: string;
  temperature?: number;
}

export interface ExecuteCommandResponse {
  success: boolean;
  message: string;
  action: string | null;
  data: any;
  error: string | null;
}

/**
 * AI Agent에게 명령 실행 요청
 * @param scenarioId - 시나리오 ID
 * @param request - 명령 내용
 * @returns 실행 결과
 */
export const executeCommand = (
  scenarioId: string,
  request: ExecuteCommandRequest
) => {
  return api.post<ExecuteCommandResponse>(
    `/scenario/${scenarioId}/execute-command`,
    request
  );
};
