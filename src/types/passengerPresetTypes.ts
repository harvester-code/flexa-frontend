export interface PassengerPresetData {
  settings?: {
    min_arrival_minutes?: number | null;
  };
  pax_generation?: {
    rules?: Array<{
      conditions: Record<string, string[]>;
      value: Record<string, number>;
    }>;
    default?: {
      load_factor?: number | null;
    };
  };
  pax_demographics?: {
    nationality?: {
      available_values?: string[];
      rules?: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
      }>;
      default?: Record<string, number>;
    };
    profile?: {
      available_values?: string[];
      rules?: Array<{
        conditions: Record<string, string[]>;
        value: Record<string, number>;
      }>;
      default?: Record<string, number>;
    };
  };
  pax_arrival_patterns?: {
    rules?: Array<{
      conditions: Record<string, string[]>;
      value: { mean: number; std: number };
    }>;
    default?: {
      mean?: number | null;
      std?: number | null;
    };
  };
}

export interface PassengerPreset {
  preset_id: string;
  name: string;
  passenger_data: PassengerPresetData;
  created_at: string;
  updated_at: string;
}

export interface PassengerPresetListResponse {
  presets: PassengerPreset[];
  total: number;
}

export interface CreatePassengerPresetParams {
  name: string;
  passenger_data: Record<string, unknown>;
}

export interface UpdatePassengerPresetParams {
  name?: string;
  passenger_data?: Record<string, unknown>;
}
