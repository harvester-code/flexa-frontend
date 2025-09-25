/**
 * Central column name to display label mapping
 * 컬럼명을 사용자 친화적인 라벨로 변환하는 중앙 매핑
 */

// Primary column to label mapping - 실제 데이터 컬럼명과 표시명 매핑
export const COLUMN_LABEL_MAP: Record<string, string> = {
  // Airlines & Aircraft
  operating_carrier_iata: "Airline",
  operating_carrier_name: "Airline",
  aircraft_type_icao: "Aircraft Type",
  aircraft_type: "Aircraft Type",

  // Flight
  flight_type: "Flight Type",
  total_seats: "Total Seats",

  // Arrival
  arrival_airport_iata: "Arrival Airport",
  arrival_terminal: "Arrival Terminal",
  arrival_city: "Arrival City",
  arrival_country: "Arrival Country",
  arrival_region: "Arrival Region",

  // Departure
  departure_airport_iata: "Departure Airport",
  departure_terminal: "Departure Terminal",
  departure_city: "Departure City",
  departure_country: "Departure Country",
  departure_region: "Departure Region",

  // Passenger
  passenger_nationality: "Nationality",
  nationality: "Nationality",
  passenger_type: "Passenger Type",
  profile: "Passenger Type",
  passenger_class: "Passenger Class",
  transit_type: "Transit Type",
  group_size_category: "Group Size",

  // Facility
  gate_number: "Gate",
  terminal: "Terminal",
} as const;

// Helper function to get display label for a column
export function getColumnLabel(columnName: string): string {
  return COLUMN_LABEL_MAP[columnName] || columnName;
}

// Helper function to get column name from label (reverse mapping)
export function getColumnName(label: string): string {
  // Create reverse mapping on first call and cache it
  if (!getColumnName.reverseMap) {
    getColumnName.reverseMap = {} as Record<string, string>;

    // Build reverse map, preferring primary fields
    const primaryFields = [
      'operating_carrier_iata', // prefer IATA over name for Airline
      'aircraft_type', // prefer short form
      'nationality', // prefer short form
      'profile', // prefer for Passenger Type storage
    ];

    // First add non-primary mappings
    Object.entries(COLUMN_LABEL_MAP).forEach(([column, label]) => {
      if (!primaryFields.includes(column) && !getColumnName.reverseMap![label]) {
        getColumnName.reverseMap![label] = column;
      }
    });

    // Then override with primary fields
    primaryFields.forEach(column => {
      const label = COLUMN_LABEL_MAP[column];
      if (label) {
        getColumnName.reverseMap![label] = column;
      }
    });
  }

  return getColumnName.reverseMap[label] || label;
}
// Type for the function's cache
getColumnName.reverseMap = null as Record<string, string> | null;

// Export type for the labels
export type ColumnLabel = typeof COLUMN_LABEL_MAP[keyof typeof COLUMN_LABEL_MAP];

// Common label constants for use in comparisons
export const LABELS = {
  AIRLINE: "Airline",
  AIRCRAFT_TYPE: "Aircraft Type",
  FLIGHT_TYPE: "Flight Type",
  ARRIVAL_AIRPORT: "Arrival Airport",
  DEPARTURE_AIRPORT: "Departure Airport",
  ARRIVAL_COUNTRY: "Arrival Country",
  DEPARTURE_COUNTRY: "Departure Country",
  ARRIVAL_REGION: "Arrival Region",
  DEPARTURE_REGION: "Departure Region",
  NATIONALITY: "Nationality",
  PASSENGER_TYPE: "Passenger Type",
  PASSENGER_CLASS: "Passenger Class",
  TRANSIT_TYPE: "Transit Type",
  GROUP_SIZE: "Group Size",
  GATE: "Gate",
  TERMINAL: "Terminal",
} as const;

// Get all unique labels
export function getAllLabels(): string[] {
  const uniqueLabels = new Set(Object.values(COLUMN_LABEL_MAP));
  return Array.from(uniqueLabels).sort();
}

// Check if a string is a known column
export function isKnownColumn(column: string): boolean {
  return column in COLUMN_LABEL_MAP;
}

// Get storage field name for specific contexts (e.g., saving to DB)
export function getStorageFieldName(label: string): string {
  const storagePreference: Record<string, string> = {
    "Airline": "operating_carrier_iata",
    "Passenger Type": "profile",
    "Nationality": "nationality",
  };

  return storagePreference[label] || getColumnName(label);
}