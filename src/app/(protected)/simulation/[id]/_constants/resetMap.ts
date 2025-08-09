/**
 * 탭별 리셋이 필요한 상태들을 정의하는 맵
 *
 * 각 탭에서 데이터를 로드하거나 변경할 때,
 * 영향을 받는 하위 탭들의 상태를 자동으로 초기화합니다.
 */
export const TAB_RESET_MAP = {
  // Flight Schedule 탭: 플라이트 데이터가 바뀌면 모든 하위 탭 초기화
  FlightSchedule: [
    'passengerSchedule',
    'airportProcessing',
    'facilityConnection',
    'facilityCapacity',
    'scenarioOverview',
  ],

  // Processing Procedures 탭: 프로세스가 바뀌면 시설 관련 탭들 초기화
  ProcessingProcedures: ['facilityConnection', 'facilityCapacity', 'scenarioOverview'],

  // Passenger Schedule 탭: 승객 스케줄이 바뀌면 시설 관련 탭들 초기화
  PassengerSchedule: ['airportProcessing', 'facilityConnection', 'facilityCapacity', 'scenarioOverview'],

  // Facility Connection 탭: 연결이 바뀌면 용량 관련 탭 초기화
  FacilityConnection: ['facilityCapacity', 'scenarioOverview'],

  // Facility Information 탭: 용량 정보가 바뀌면 시뮬레이션 관련 탭 초기화
  FacilityInformation: ['scenarioOverview'],

  // Scenario Overview 탭: 개요이므로 다른 탭에 영향 없음
  ScenarioOverview: [],

  // Simulation 탭: 시뮬레이션 실행이므로 다른 탭에 영향 없음
  Simulation: [],
} as const;

export type TabName = keyof typeof TAB_RESET_MAP;
export type ResetTargetState = (typeof TAB_RESET_MAP)[TabName][number];
