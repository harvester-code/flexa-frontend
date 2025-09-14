// Primary 20 representative colors for all components
export const COMPONENT_TYPICAL_COLORS = [
  // Original 12 colors
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
  '#f97316', // orange
  '#a855f7', // purple
  '#14b8a6', // teal
  // Additional 8 distinct colors
  '#78716c', // stone
  '#0ea5e9', // sky
  '#d946ef', // fuchsia
  '#65a30d', // lime-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#9333ea', // purple-600
  '#ca8a04', // yellow-600
] as const;

// Helper function to generate badge styles using COMPONENT_TYPICAL_COLORS with opacity
export function getBadgeStyles(index: number) {
  const color = COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  return {
    // 10% opacity for background
    backgroundColor: `${color}1A`,
    // Full color for text
    color: color,
    // 20% opacity for border
    borderColor: `${color}33`,
    // CSS variables for hover effect (20% opacity)
    '--hover-bg': `${color}33`,
  };
}

// Legacy function for backward compatibility - returns style object for Badge component
export function getBadgeColor(index: number) {
  const styles = getBadgeStyles(index);
  return {
    bgColor: '', // Empty string for className-based styling
    textColor: '',
    borderColor: '',
    hoverBgColor: '',
    // Inline styles as fallback
    style: {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      borderColor: styles.borderColor,
      borderWidth: '1px',
      borderStyle: 'solid',
    }
  };
}

// Helper function to get badge style as inline style object
export function getBadgeStyle(index: number): React.CSSProperties {
  const styles = getBadgeStyles(index);
  return {
    backgroundColor: styles.backgroundColor,
    color: styles.color,
    borderColor: styles.borderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
  };
}

// Helper function for hover effect
export function getBadgeHoverStyle(index: number): React.CSSProperties {
  const color = COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];
  return {
    backgroundColor: `${color}33`, // 20% opacity on hover
  };
}

// Helper function to get zone gradient style using COMPONENT_TYPICAL_COLORS
export function getZoneGradientStyle(index: number): React.CSSProperties {
  const color = COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  // Create gradient with slightly darker shade
  return {
    background: `linear-gradient(135deg, ${color}, ${color}DD)`, // DD = 87% opacity for darker shade
  };
}

// Legacy function for backward compatibility - returns empty className
export function getZoneGradient(index: number): string {
  // Returns empty string since we're using inline styles now
  return '';
}

// Helper function for zone hover effect
export function getZoneHoverStyle(index: number): React.CSSProperties {
  const color = COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];

  return {
    background: `linear-gradient(135deg, ${color}DD, ${color}BB)`, // Darker on hover
  };
}

// Utility functions for color manipulation
export function getColorByIndex(index: number) {
  return COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length];
}

// Type exports
export type ComponentTypicalColor = typeof COMPONENT_TYPICAL_COLORS[number];