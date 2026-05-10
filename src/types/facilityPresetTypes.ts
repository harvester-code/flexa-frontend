export interface FacilityPreset {
  preset_id: string;
  name: string;
  process_flow: Record<string, unknown>[];
  reference_date: string | null;
  schedule_interval_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityPresetListResponse {
  presets: FacilityPreset[];
  total: number;
}

export interface CreateFacilityPresetParams {
  name: string;
  process_flow: Record<string, unknown>[];
  reference_date?: string | null;
  schedule_interval_minutes?: number | null;
}

export interface UpdateFacilityPresetParams {
  name?: string;
  process_flow?: Record<string, unknown>[];
  reference_date?: string | null;
  schedule_interval_minutes?: number | null;
}
