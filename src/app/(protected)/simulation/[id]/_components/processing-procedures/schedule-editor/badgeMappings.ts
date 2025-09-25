import { Plane, Navigation, MapPin, Globe, Users } from "lucide-react";
import { getColumnLabel, getStorageFieldName as getStorageField, LABELS } from "@/styles/columnMappings";

// Skip primary color (index 3 - violet #8b5cf6)
const PRIMARY_COLOR_INDEX = 3;

// Helper to adjust color index to skip primary color
const adjustColorIndex = (index: number): number => {
  return index >= PRIMARY_COLOR_INDEX ? index + 1 : index;
};

// Predefined color indices for each category (skipping primary color)
export const CATEGORY_COLOR_INDICES: Record<string, number> = {
  [LABELS.AIRLINE]: adjustColorIndex(0),           // 0 -> 0: blue
  [LABELS.AIRCRAFT_TYPE]: adjustColorIndex(1),     // 1 -> 1: emerald
  [LABELS.FLIGHT_TYPE]: adjustColorIndex(2),       // 2 -> 2: orange
  [LABELS.ARRIVAL_AIRPORT]: adjustColorIndex(3),   // 3 -> 4: amber (skip violet)
  [LABELS.ARRIVAL_COUNTRY]: adjustColorIndex(4),   // 4 -> 5: red
  [LABELS.ARRIVAL_REGION]: adjustColorIndex(5),    // 5 -> 6: cyan
  [LABELS.DEPARTURE_AIRPORT]: adjustColorIndex(6), // 6 -> 7: pink
  [LABELS.DEPARTURE_COUNTRY]: adjustColorIndex(7), // 7 -> 8: indigo
  [LABELS.DEPARTURE_REGION]: adjustColorIndex(8),  // 8 -> 9: lime
  [LABELS.GATE]: adjustColorIndex(9),              // 9 -> 10: teal
  [LABELS.TERMINAL]: adjustColorIndex(10),         // 10 -> 11: stone
  [LABELS.PASSENGER_CLASS]: adjustColorIndex(11),  // 11 -> 12: purple (different from primary)
  [LABELS.PASSENGER_TYPE]: adjustColorIndex(12),   // 12 -> 13: sky
  [LABELS.TRANSIT_TYPE]: adjustColorIndex(13),     // 13 -> 14: fuchsia
  [LABELS.NATIONALITY]: adjustColorIndex(14),      // 14 -> 15: lime-600
  [LABELS.GROUP_SIZE]: adjustColorIndex(15),       // 15 -> 16: red-600
};

// Icon mapping for categories
const CATEGORY_ICON_MAP: Record<string, any> = {
  [LABELS.AIRLINE]: Plane,
  [LABELS.AIRCRAFT_TYPE]: Plane,
  [LABELS.FLIGHT_TYPE]: Navigation,
  [LABELS.ARRIVAL_AIRPORT]: MapPin,
  [LABELS.ARRIVAL_COUNTRY]: Globe,
  [LABELS.ARRIVAL_REGION]: Globe,
  [LABELS.DEPARTURE_AIRPORT]: MapPin,
  [LABELS.DEPARTURE_COUNTRY]: Globe,
  [LABELS.DEPARTURE_REGION]: Globe,
  [LABELS.GATE]: MapPin,
  [LABELS.TERMINAL]: MapPin,
  [LABELS.PASSENGER_CLASS]: Users,
  [LABELS.PASSENGER_TYPE]: Users,
  [LABELS.TRANSIT_TYPE]: Users,
  [LABELS.NATIONALITY]: Globe,
  [LABELS.GROUP_SIZE]: Users,
};

// Helper functions using centralized column mappings
export const getCategoryNameFromField = (field: string): string => {
  return getColumnLabel(field);
};

export const getCategoryFieldName = (category: string): string => {
  // This is now handled by getStorageFieldName for consistency
  return getStorageField(category);
};

export const getCategoryIcon = (category: string): any => {
  return CATEGORY_ICON_MAP[category] || Navigation;
};

export const getStorageFieldName = (category: string): string => {
  return getStorageField(category);
};

// Get consistent color index for a category
export const getCategoryColorIndex = (category: string): number => {
  return CATEGORY_COLOR_INDICES[category] ?? 0;
};