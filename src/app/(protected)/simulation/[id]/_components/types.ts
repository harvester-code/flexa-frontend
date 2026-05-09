import { APIRequestLog } from "@/types/simulationTypes";

export interface SimulationTabProps {
  simulationId: string;
  visible: boolean;
  apiRequestLog: APIRequestLog | null;
  setApiRequestLog: (log: APIRequestLog | null) => void;
}

export type FacilityItem = {
  name: string;
  isActive: boolean;
};
