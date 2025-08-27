import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ==================== Types ====================
export interface FacilityProcess {
  name: string;
  nodes: string[];
  source: string | null;
  destination: string | null;
  default_matrix: Record<string, Record<string, number>> | null;
  priority_matrix: Array<{
    condition: Array<{ criteria: string; operator: string; value: string[] }>;
    matrix: Record<string, Record<string, number>>;
  }> | null;
}

export interface FacilityConnectionState {
  // Data
  processes: Record<string, FacilityProcess>;
  isCompleted: boolean;

  // Actions
  setProcesses: (processes: Record<string, FacilityProcess>) => void;
  generateProcessesFromProcedures: (
    procedures: Array<{ order: number; process: string; facility_names: string[] }>,
    entryType: string
  ) => void;
  setCompleted: (completed: boolean) => void;
  resetState: () => void;
  loadMetadata: (metadata: Record<string, unknown>) => void;
}

// ==================== Initial State ====================
const initialState = {
  processes: {},
  isCompleted: false,
};

// ==================== Store ====================
export const useFacilityConnectionStore = create<FacilityConnectionState>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // Actions
    setProcesses: (processes) =>
      set((state) => {
        state.processes = processes;
      }),

    generateProcessesFromProcedures: (procedures, entryType) =>
      set((state) => {
        const processesObj: Record<string, FacilityProcess> = {};

        // Entry process (항상 인덱스 0)
        processesObj['0'] = {
          name: entryType, // 원본 이름 그대로 사용 (하드코딩 제거)
          nodes: [],
          source: null,
          destination: procedures.length > 0 ? '1' : null,
          default_matrix: null,
          priority_matrix: null,
        };

        // 사용자가 추가한 프로세스들
        procedures.forEach((procedure, index) => {
          const processIndex = (index + 1).toString();
          processesObj[processIndex] = {
            name: procedure.process, // 원본 이름 그대로 사용 (하드코딩 제거)
            nodes: procedure.facility_names,
            source: index === 0 ? '0' : index.toString(),
            destination: index === procedures.length - 1 ? null : (index + 2).toString(),
            default_matrix: {}, // 빈 객체로 초기화
            priority_matrix: null,
          };
        });

        state.processes = processesObj;
      }),

    setCompleted: (completed) =>
      set((state) => {
        state.isCompleted = completed;
      }),

    resetState: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    loadMetadata: (metadata) =>
      set((state) => {
        Object.assign(state, {
          ...initialState,
          ...metadata,
        });
      }),
  }))
);

// ==================== Helpers ====================
export const getFacilityConnectionInitialState = () => ({ ...initialState });
