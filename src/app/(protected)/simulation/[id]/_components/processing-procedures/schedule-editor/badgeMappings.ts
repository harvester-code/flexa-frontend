import { Plane, Navigation, MapPin, Globe, Users } from "lucide-react";

// Skip primary color (index 3 - violet #8b5cf6)
const PRIMARY_COLOR_INDEX = 3;

// Helper to adjust color index to skip primary color
const adjustColorIndex = (index: number): number => {
  return index >= PRIMARY_COLOR_INDEX ? index + 1 : index;
};

// Predefined color indices for each category (skipping primary color)
export const CATEGORY_COLOR_INDICES: Record<string, number> = {
  "Airline": adjustColorIndex(0),           // 0 -> 0: blue
  "Aircraft Type": adjustColorIndex(1),     // 1 -> 1: emerald
  "Flight Type": adjustColorIndex(2),       // 2 -> 2: orange
  "Arrival Airport": adjustColorIndex(3),   // 3 -> 4: amber (skip violet)
  "Arrival Country": adjustColorIndex(4),   // 4 -> 5: red
  "Arrival Region": adjustColorIndex(5),    // 5 -> 6: cyan
  "Departure Airport": adjustColorIndex(6), // 6 -> 7: pink
  "Departure Country": adjustColorIndex(7), // 7 -> 8: indigo
  "Departure Region": adjustColorIndex(8),  // 8 -> 9: lime
  "Gate": adjustColorIndex(9),              // 9 -> 10: teal
  "Terminal": adjustColorIndex(10),         // 10 -> 11: stone
  "Day of Week": adjustColorIndex(11),      // 11 -> 12: purple (different from primary)
  "Hour of Day": adjustColorIndex(12),      // 12 -> 13: sky
  "Passenger Class": adjustColorIndex(13),  // 13 -> 14: fuchsia
  "Passenger Type": adjustColorIndex(14),   // 14 -> 15: lime-600
  "Transit Type": adjustColorIndex(15),     // 15 -> 16: red-600
  "Nationality": adjustColorIndex(16),      // 16 -> 17: cyan-600
  "Group Size": adjustColorIndex(17),       // 17 -> 18: purple-600
};

// Central configuration for badge field mappings
// 새로운 뱃지를 추가할 때는 이 배열에만 추가하면 됩니다
export const BADGE_FIELD_MAPPINGS = [
  // Flight related
  { field: "operating_carrier_name", category: "Airline", icon: Plane },
  { field: "operating_carrier_iata", category: "Airline", icon: Plane, primaryField: false },
  { field: "aircraft_type", category: "Aircraft Type", icon: Plane },
  { field: "flight_type", category: "Flight Type", icon: Navigation },

  // Location related
  { field: "arrival_airport_iata", category: "Arrival Airport", icon: MapPin },
  { field: "arrival_country", category: "Arrival Country", icon: Globe },
  { field: "arrival_region", category: "Arrival Region", icon: Globe },
  { field: "departure_airport_iata", category: "Departure Airport", icon: MapPin },
  { field: "departure_country", category: "Departure Country", icon: Globe },
  { field: "departure_region", category: "Departure Region", icon: Globe },

  // Facility related
  { field: "gate_number", category: "Gate", icon: MapPin },
  { field: "terminal", category: "Terminal", icon: MapPin },

  // Time related
  { field: "day_of_week", category: "Day of Week", icon: Navigation },
  { field: "hour_of_day", category: "Hour of Day", icon: Navigation },

  // Passenger related
  { field: "passenger_class", category: "Passenger Class", icon: Users },
  { field: "passenger_type", category: "Passenger Type", icon: Users },
  { field: "profile", category: "Passenger Type", icon: Users, primaryField: false },
  { field: "transit_type", category: "Transit Type", icon: Users },
  { field: "passenger_nationality", category: "Nationality", icon: Globe },
  { field: "nationality", category: "Nationality", icon: Globe, primaryField: false },
  { field: "group_size_category", category: "Group Size", icon: Users },
];

// Build maps from the centralized configuration
export const fieldToCategoryMap: Record<string, string> = {};
export const categoryToFieldMap: Record<string, string> = {};
export const categoryToIconMap: Record<string, any> = {};

BADGE_FIELD_MAPPINGS.forEach(({ field, category, icon, primaryField = true }) => {
  fieldToCategoryMap[field] = category;

  // For category to field, use the primary field (default true)
  if (primaryField && !categoryToFieldMap[category]) {
    categoryToFieldMap[category] = field;
  }

  // Map category to icon
  if (!categoryToIconMap[category]) {
    categoryToIconMap[category] = icon;
  }
});

// Helper functions
export const getCategoryNameFromField = (field: string): string => {
  return fieldToCategoryMap[field] || field;
};

export const getCategoryFieldName = (category: string): string => {
  return categoryToFieldMap[category] || category;
};

export const getCategoryIcon = (category: string): any => {
  return categoryToIconMap[category] || Navigation;
};

// Special field transformations for storage
export const getStorageFieldName = (category: string): string => {
  // Special cases for storage format
  const storageFieldMap: Record<string, string> = {
    "Airline": "operating_carrier_iata", // Use IATA code for storage
    "Passenger Type": "profile", // Use profile for storage
    "Nationality": "nationality", // Use nationality for storage
  };

  return storageFieldMap[category] || categoryToFieldMap[category] || category;
};

// Get consistent color index for a category
export const getCategoryColorIndex = (category: string): number => {
  return CATEGORY_COLOR_INDICES[category] ?? 0;
};