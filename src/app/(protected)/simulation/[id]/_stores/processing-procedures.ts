import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProcessStep } from '@/types/simulationTypes';

// ==================== Types ====================
export interface ProcessingProceduresState {
  // Data
  process_flow: ProcessStep[];
  isCompleted: boolean;

  // Actions
  setProcessFlow: (flow: ProcessStep[]) => void;
  convertFromProcedures: (
    procedures: Array<{ order: number; process: string; facility_names: string[] }>,
    entryType?: string
  ) => void;
  setCompleted: (completed: boolean) => void;
  resetState: () => void;
  loadMetadata: (metadata: Record<string, unknown>) => void;
  setFacilitiesForZone: (processIndex: number, zoneName: string, count: number) => void;
}

// ==================== Initial State ====================
const initialState = {
  process_flow: [],
  isCompleted: false,
};

// ==================== Store ====================
export const useProcessingProceduresStore = create<ProcessingProceduresState>()(
  immer((set) => ({
    // Initial data
    ...initialState,

    // Actions
    setProcessFlow: (flow) =>
      set((state) => {
        state.process_flow = flow;
      }),

    convertFromProcedures: (procedures, entryType = 'Entry') =>
      set((state) => {
        const convertedFlow = procedures
          .sort((a, b) => a.order - b.order) // order 기준 정렬
          .map((procedure, index) => {
            const processStep = {
              step: index,
              name: procedure.process.toLowerCase().replace(/-/g, '_'), // "Visa-Check" -> "visa_check"
              travel_time_minutes: null,
              entry_conditions: [],
              zones: {} as Record<string, any>,
            };

            // facility_names를 zones로 변환 (범용적 처리)
            procedure.facility_names.forEach((facilityName: string) => {
              // Process Configuration에서는 zone만 생성, facilities는 빈 배열
              processStep.zones[facilityName] = {
                facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
              };
            });

            return processStep;
          });

        state.process_flow = convertedFlow;
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
        // 기존 procedures 형태인 경우 자동 마이그레이션
        if (metadata.procedures && !metadata.process_flow) {
          const convertedFlow = migrateProceduresToProcessFlow(metadata.procedures);
          state.process_flow = convertedFlow;
          state.isCompleted = metadata.isCompleted || false;
        } else {
          // 이미 새로운 형태인 경우
          Object.assign(state, {
            ...initialState,
            ...metadata,
          });
        }
      }),

    setFacilitiesForZone: (processIndex, zoneName, count) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          // 지정된 개수만큼 facilities 생성
          const facilities = Array.from({ length: count }, (_, i) => ({
            id: `${zoneName}_${i + 1}`,
            operating_schedule: {
              today: {
                time_blocks: [],
              },
            },
          }));

          state.process_flow[processIndex].zones[zoneName].facilities = facilities;
        }
      }),
  }))
);

// ==================== Helpers ====================
/**
 * Legacy procedures를 새로운 process_flow 형태로 변환하는 헬퍼 함수
 */
const migrateProceduresToProcessFlow = (procedures: any[]): ProcessStep[] => {
  return procedures
    .sort((a: any, b: any) => a.order - b.order)
    .map((procedure: any, index: number) => {
      const processStep = {
        step: index,
        name: procedure.process, // 원본 이름 그대로 사용 (하드코딩 제거)
        travel_time_minutes: null,
        entry_conditions: [],
        zones: {} as Record<string, any>,
      };

      // facility_names를 zones로 변환 (범용적 처리)
      procedure.facility_names.forEach((facilityName: string) => {
        // Process Configuration에서는 zone만 생성, facilities는 빈 배열
        processStep.zones[facilityName] = {
          facilities: [], // 빈 배열로 시작 - Facility Detail에서 개수 지정 시 채워짐
        };
      });

      return processStep;
    });
};

export const getProcessingProceduresInitialState = () => ({ ...initialState });
