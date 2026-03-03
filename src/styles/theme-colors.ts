/**
 * 🎨 Theme Colors - Single source of truth for semantic colors
 *
 * ⚠️ Keep in sync with globals.css :root variables (--color-*)
 * Used by: Plotly charts, inline styles, components that need hex at render time
 */
export const THEME_COLORS = {
  // Schedule Editor
  selectionBorder: "#7c3aed",
  selectionBg: "#f3e8ff", // purple-100
  copyBorder: "#8b5cf6",
  disabledBg: "#d1d5db",
  disabledText: "#4b5563",
  disabledBorder: "#9ca3af",

  // Chart - Show-up Time
  chartDeparture: "#EF4444",
  chartFinalArrival: "#2563EB",
  chartGrid: "#E5E7EB",
  chartLegendBg: "rgba(255, 255, 255, 0.9)",
  chartLegendBorder: "#E5E7EB",

  // Chart palette (Plotly traces)
  chartPalette: [
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#6366F1",
    "#EC4899",
  ] as const,
} as const;
