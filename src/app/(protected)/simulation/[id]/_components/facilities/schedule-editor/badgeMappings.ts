import { Plane, Navigation, MapPin, Globe, Users } from "lucide-react";
import { getColumnLabel, getStorageFieldName as getStorageField, LABELS } from "@/styles/columnMappings";

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
  [LABELS.NATIONALITY]: Globe,
  [LABELS.PASSENGER_TYPE]: Users,
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
  // Skip primary color (index 3 - violet #8b5cf6)
  const PRIMARY_COLOR_INDEX = 3;

  // Helper to adjust color index to skip primary color
  const adjustColorIndex = (index: number): number => {
    return index >= PRIMARY_COLOR_INDEX ? index + 1 : index;
  };

  // Predefined color indices for each category (skipping primary color)
  const CATEGORY_COLOR_INDICES: Record<string, number> = {
    [LABELS.AIRLINE]: adjustColorIndex(0),
    [LABELS.AIRCRAFT_TYPE]: adjustColorIndex(1),
    [LABELS.FLIGHT_TYPE]: adjustColorIndex(2),
    [LABELS.ARRIVAL_AIRPORT]: adjustColorIndex(3),
    [LABELS.ARRIVAL_COUNTRY]: adjustColorIndex(4),
    [LABELS.ARRIVAL_REGION]: adjustColorIndex(5),
    [LABELS.DEPARTURE_AIRPORT]: adjustColorIndex(6),
    [LABELS.DEPARTURE_COUNTRY]: adjustColorIndex(7),
    [LABELS.DEPARTURE_REGION]: adjustColorIndex(8),
    [LABELS.NATIONALITY]: adjustColorIndex(9),
    [LABELS.PASSENGER_TYPE]: adjustColorIndex(10),
  };

  return CATEGORY_COLOR_INDICES[category] ?? 0;
};