import { createAPIService } from "@/lib/axios";

const api = createAPIService("ai-agent");

export interface ExecuteCommandRequest {
  content: string;
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
