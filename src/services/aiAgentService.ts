import { createAPIService } from '@/lib/axios';
import type {
  ExecuteCommandRequest,
  ExecuteCommandResponse,
} from '@/types/api/ai-agent/execute-command';

export type {
  AiAgentMessage as Message,
  AiAgentSimulationState as SimulationState,
  ExecuteCommandRequest,
  ExecuteCommandResponse,
} from '@/types/api/ai-agent/execute-command';

const api = createAPIService("ai-agent");

export const executeCommand = (
  scenarioId: string,
  request: ExecuteCommandRequest
) => {
  return api.post<ExecuteCommandResponse>(
    `/scenario/${scenarioId}/execute-command`,
    request
  );
};
