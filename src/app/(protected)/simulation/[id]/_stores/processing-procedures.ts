import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProcessStep } from '@/types/simulationTypes';

// ==================== Helpers ====================
/**
 * 프로세스 이름을 정규화하는 공통 함수
 * 예: "Visa-Check" -> "visa_check"
 */
const normalizeProcessName = (name: string): string => {
  return name
    .toLowerCase() // 소문자 변환
    .replace(/[^a-z0-9]/g, '_') // 영문, 숫자 외 모든 문자를 언더스코어로
    .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, ''); // 앞뒤 언더스코어 제거
};

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
  updateOperatingSchedule: (processIndex: number, zoneName: string, timeBlocks: any[]) => void;
  toggleFacilityTimeBlock: (processIndex: number, zoneName: string, facilityId: string, period: string) => void;
  updateTravelTime: (processIndex: number, minutes: number) => void;
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
        // 모든 프로세스 이름 정규화
        state.process_flow = flow.map((process) => ({
          ...process,
          name: normalizeProcessName(process.name),
        }));
      }),

    convertFromProcedures: (procedures, entryType = 'Entry') =>
      set((state) => {
        const convertedFlow = procedures
          .sort((a, b) => a.order - b.order) // order 기준 정렬
          .map((procedure, index) => {
            const processStep = {
              step: index,
              name: normalizeProcessName(procedure.process), // "Visa-Check" -> "visa_check"
              travel_time_minutes: 0, // 사용자가 UI에서 설정
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
          // 이미 새로운 형태인 경우 - 프로세스 이름 정규화 적용
          const normalizedMetadata = { ...metadata };
          
          if (normalizedMetadata.process_flow && Array.isArray(normalizedMetadata.process_flow)) {
            normalizedMetadata.process_flow = normalizedMetadata.process_flow.map((process: ProcessStep) => ({
              ...process,
              name: normalizeProcessName(process.name), // 기존 데이터도 정규화
            }));
          }
          
          Object.assign(state, {
            ...initialState,
            ...normalizedMetadata,
          });
        }
      }),

    setFacilitiesForZone: (processIndex, zoneName, count) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          // 지정된 개수만큼 facilities 생성
          const facilities = Array.from({ length: count }, (_, i) => ({
            id: `${zoneName}_${i + 1}`,
            operating_schedule: {}, // 빈 객체로 초기화, today 키는 컴포넌트에서 동적으로 생성
          }));

          state.process_flow[processIndex].zones[zoneName].facilities = facilities;
        }
      }),

    updateOperatingSchedule: (processIndex, zoneName, timeBlocks) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          const zone = state.process_flow[processIndex].zones[zoneName];

          if (zone.facilities) {
            // 모든 시설에 동일한 스케줄 적용
            zone.facilities.forEach((facility: any) => {
              facility.operating_schedule = {
                today: {
                  time_blocks: timeBlocks.map((block) => ({
                    period: block.period,
                    process_time_seconds: block.processTime,
                    passenger_conditions: block.conditions,
                  })),
                },
              };
            });
          }
        }
      }),

    // 개별 시설의 특정 시간 블록만 토글
    toggleFacilityTimeBlock: (processIndex, zoneName, facilityId, period) =>
      set((state) => {
        if (state.process_flow[processIndex] && state.process_flow[processIndex].zones[zoneName]) {
          const zone = state.process_flow[processIndex].zones[zoneName];
          const facility = zone.facilities?.find((f: any) => f.id === facilityId);
          
          if (facility) {
            // 기존 스케줄 초기화
            if (!facility.operating_schedule) {
              facility.operating_schedule = {};
            }
            if (!facility.operating_schedule.today) {
              facility.operating_schedule.today = { time_blocks: [] };
            }
            
            const timeBlocks = facility.operating_schedule.today.time_blocks || [];
            const [startTime] = period.split('~');
            
            // 시간을 분 단위로 변환
            const timeToMinutes = (timeStr: string) => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            };
            
            const targetMinutes = timeToMinutes(startTime);
            
            // 해당 시간이 포함된 모든 기존 블록 찾기
            const overlappingBlocks = timeBlocks.filter((block: any) => {
              if (!block.period) return false;
              const [blockStart, blockEnd] = block.period.split('~');
              const blockStartMinutes = timeToMinutes(blockStart);
              const blockEndMinutes = blockEnd === '00:00' ? 24 * 60 : timeToMinutes(blockEnd);
              
              return targetMinutes >= blockStartMinutes && targetMinutes < blockEndMinutes;
            });
            
            if (overlappingBlocks.length > 0) {
              // 겹치는 블록들이 있으면 모두 제거 (체크 해제)
              overlappingBlocks.forEach(overlappingBlock => {
                const index = timeBlocks.findIndex((block: any) => 
                  block.period === overlappingBlock.period
                );
                if (index !== -1) {
                  timeBlocks.splice(index, 1);
                }
              });
            } else {
              // 겹치는 블록이 없으면 새로운 10분 블록 추가 (체크)
              timeBlocks.push({
                period,
                process_time_seconds: 30, // 기본값 - 추후 설정 가능하도록 개선 필요
                passenger_conditions: [],
              });
            }
          }
        }
      }),

    updateTravelTime: (processIndex, minutes) =>
      set((state) => {
        if (state.process_flow[processIndex]) {
          state.process_flow[processIndex].travel_time_minutes = minutes;
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
        name: normalizeProcessName(procedure.process), // 정규화 적용
        travel_time_minutes: 0, // 사용자가 UI에서 설정
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
