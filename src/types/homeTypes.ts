// Home 도메인에서 사용하는 공통 타입들
export interface Option {
  label: string;
  value: string;
  [key: string]: string | undefined;
}

// Home 도메인에서 사용하는 시나리오 데이터 타입
export interface ScenarioData {
  airport: string;
  created_at: string;
  editor: string;
  id: string;
  scenario_id: string;
  is_active: boolean;
  memo: string;
  name: string;
  status: 'yet' | 'running' | 'done';
  target_flight_schedule_date: string | null;
  terminal: string;
  updated_at: string;
  user_id: string;
  simulation_start_at: string | null;
  simulation_end_at: string | null;
  has_simulation_data?: boolean; // S3에 simulation-pax.parquet 파일 존재 여부
}

// Home 도메인에서 사용하는 시나리오 응답 타입 (단순화됨)
export interface ScenariosDataResponse extends Array<ScenarioData & { 
  first_name?: string;
  last_name?: string;  
  email?: string;
}> {}
