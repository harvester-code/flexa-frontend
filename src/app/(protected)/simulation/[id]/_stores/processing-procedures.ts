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

    convertFromProcedures: (procedures, entryType = 'Airline') =>
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

            // facility_names를 zones로 변환
            procedure.facility_names.forEach((facilityName: string) => {
              if (facilityName.startsWith('VC')) {
                // VC1, VC2, VC3 -> VC zone
                if (!processStep.zones.VC) processStep.zones.VC = { facilities: [] };
                processStep.zones.VC.facilities.push({
                  id: facilityName,
                  operating_schedule: { today: { time_blocks: [] } },
                });
              } else if (facilityName.match(/^[A-C]$/)) {
                // A, B, C -> 각각 개별 zone
                processStep.zones[facilityName] = {
                  facilities: [
                    {
                      id: `${facilityName}1`,
                      operating_schedule: { today: { time_blocks: [] } },
                    },
                  ],
                };
              } else if (facilityName.startsWith('DG')) {
                // DG1, DG2, DG3 -> 각각 개별 zone
                processStep.zones[facilityName] = {
                  facilities: [
                    {
                      id: `${facilityName}_1`,
                      operating_schedule: { today: { time_blocks: [] } },
                    },
                  ],
                };
              }
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
        // 모든 facility를 개별 zone으로 처리 (하드코딩 제거)
        processStep.zones[facilityName] = {
          facilities: [
            {
              id: facilityName,
              operating_schedule: { today: { time_blocks: [] } },
            },
          ],
        };
      });

      return processStep;
    });
};

export const getProcessingProceduresInitialState = () => ({ ...initialState });
