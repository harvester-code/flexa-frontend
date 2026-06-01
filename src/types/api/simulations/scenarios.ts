import type { ScenariosDataResponse } from '@/types/homeTypes';

/** POST /api/v1/simulations */
export interface CreateScenarioRequest {
  name: string;
  airport: string | null;
  terminal: string | null;
  memo: string | null;
}

/** PUT /api/v1/simulations/{scenario_id} */
export interface UpdateScenarioRequest {
  name?: string;
  terminal?: string;
  airport?: string;
  memo?: string;
}

/** DELETE /api/v1/simulations */
export interface DeleteScenariosRequest {
  scenario_ids: string[];
}

/** POST /api/v1/simulations/{scenario_id}/copy */
export interface CopyScenarioRequest {
  name?: string;
}

export type ListScenariosResponse = ScenariosDataResponse;

/** POST /api/v1/simulations — response body */
export interface CreateScenarioResponse {
  scenario_id: string;
  name?: string;
  airport?: string | null;
  terminal?: string | null;
  memo?: string | null;
}
