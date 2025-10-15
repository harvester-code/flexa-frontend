// Primary 20 representative colors for all components
export const COMPONENT_TYPICAL_COLORS = [
  // Original 12 colors
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f97316", // orange
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6366f1", // indigo
  "#84cc16", // lime
  "#14b8a6", // teal
  // Additional 8 distinct colors
  "#78716c", // stone
  "#a855f7", // purple
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#65a30d", // lime-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#9333ea", // purple-600
  "#ca8a04", // yellow-600
] as const;

// Legacy function for backward compatibility - returns style object for Badge component
export function getBadgeColor(index: number) {
  const color =
    COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  const styles = {
    // 10% opacity for background
    backgroundColor: `${color}1A`,
    // Full color for text
    color: color,
    // 20% opacity for border
    borderColor: `${color}33`,
  };

  return {
    bgColor: "", // Empty string for className-based styling
    textColor: "",
    borderColor: "",
    hoverBgColor: "",
    // Inline styles as fallback
    style: {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      borderColor: styles.borderColor,
      borderWidth: "1px",
      borderStyle: "solid",
    },
  };
}

// Helper function to get badge style as inline style object
export function getBadgeStyle(index: number): React.CSSProperties {
  const color =
    COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  return {
    backgroundColor: `${color}1A`,
    color: color,
    borderColor: `${color}33`,
    borderWidth: "1px",
    borderStyle: "solid",
  };
}

// Helper function to get zone gradient style using COMPONENT_TYPICAL_COLORS
export function getZoneGradientStyle(index: number): React.CSSProperties {
  const color =
    COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  // Create gradient with slightly darker shade
  return {
    background: `linear-gradient(135deg, ${color}, ${color}DD)`, // DD = 87% opacity for darker shade
  };
}

// Legacy function for backward compatibility - returns empty className
export function getZoneGradient(index: number): string {
  // Returns empty string since we're using inline styles now
  return "";
}

// Utility functions for color manipulation
export function getColorByIndex(index: number) {
  return COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];
}

// Type exports
export type ComponentTypicalColor = (typeof COMPONENT_TYPICAL_COLORS)[number];
