// Badge color palette for consistent visual hierarchy
export const BADGE_COLOR_PALETTE = [
  // Cyan
  {
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    hoverBgColor: 'hover:bg-cyan-200',
  },
  // Emerald
  {
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    hoverBgColor: 'hover:bg-emerald-200',
  },
  // Amber
  {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    hoverBgColor: 'hover:bg-amber-200',
  },
  // Rose
  {
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    hoverBgColor: 'hover:bg-rose-200',
  },
  // Sky
  {
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    hoverBgColor: 'hover:bg-sky-200',
  },
  // Purple
  {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    hoverBgColor: 'hover:bg-purple-200',
  },
  // Indigo
  {
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    hoverBgColor: 'hover:bg-indigo-200',
  },
  // Teal
  {
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    hoverBgColor: 'hover:bg-teal-200',
  },
  // Orange
  {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    hoverBgColor: 'hover:bg-orange-200',
  },
  // Lime
  {
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-700',
    borderColor: 'border-lime-200',
    hoverBgColor: 'hover:bg-lime-200',
  },
  // Pink
  {
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    hoverBgColor: 'hover:bg-pink-200',
  },
  // Violet
  {
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    hoverBgColor: 'hover:bg-violet-200',
  },
] as const;

// Helper function to get color by index (cycles through palette)
export function getBadgeColor(index: number) {
  return BADGE_COLOR_PALETTE[index % BADGE_COLOR_PALETTE.length];
}

// Zone grid gradient colors (for ProcessFlowDesigner) - matches BADGE_COLOR_PALETTE order
export const ZONE_GRADIENT_COLORS = [
  'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',      // 1. Cyan
  'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700', // 2. Emerald
  'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',   // 3. Amber
  'from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700',       // 4. Rose
  'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700',          // 5. Sky
  'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700', // 6. Purple
  'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700', // 7. Indigo
  'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',       // 8. Teal
  'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700', // 9. Orange
  'from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700',       // 10. Lime
  'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',       // 11. Pink
  'from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700', // 12. Violet
] as const;

// Helper function to get zone gradient by index
export function getZoneGradient(index: number) {
  return ZONE_GRADIENT_COLORS[index % ZONE_GRADIENT_COLORS.length];
}