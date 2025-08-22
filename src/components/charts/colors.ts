/**
 * 차트 및 시각화를 위한 색상 팔레트 모음
 * 모든 차트 컴포넌트에서 일관된 색상 시스템을 사용하기 위한 중앙 관리
 */

// Primary color scales (히스토그램, 기본 차트용)
export const PRIMARY_COLOR_SCALES = [
  '#42307D',
  '#53389E',
  '#6941C6',
  '#7F56D9',
  '#9E77ED',
  '#B692F6',
  '#D6BBFB',
  '#E9D7FE',
  '#F4EBFF',
  '#F9F5FF',
] as const;

// Sankey diagram용 색상
export const SANKEY_COLOR_SCALES = [
  '#6E55E0',
  '#4C84BC',
  '#B48CF2',
  '#042440',
  '#69D6D6',
  '#545CA1',
  '#65AFFF',
  '#FF5C7A',
  '#1F2C93',
  '#F2789F',
  '#5C3C9F',
  '#FFA600',
  '#4CAF50',
  '#FF6E40',
  '#C0CA33',
  '#00B8D4',
  '#D3D3D3',
  '#7A7A7A',
] as const;

// Bar chart용 색상 (시뮬레이션용)
export const BarColors = {
  DEFAULT: [
    '#6E55E0',
    '#4C84BC', 
    '#B48CF2',
    '#042440',
    '#69D6D6',
    '#545CA1',
    '#65AFFF',
    '#FF5C7A',
    '#1F2C93',
    '#F2789F',
    '#5C3C9F',
    '#FFA600',
    '#4CAF50',
    '#FF6E40',
    '#C0CA33',
    '#00B8D4',
    '#D3D3D3',
    '#7A7A7A',
    '#4C84BC', // 추가 색상
  ],
  ETC: '#7A7A7A',
} as const;

// Line chart용 색상
export const LineColors = [
  '#42307D', 
  '#6941C6', 
  '#9E77ED', 
  '#D6BBFB', 
  '#F4EBFF'
] as const;

// Sankey gradient용 색상
export const SankeyColors = [
  '#F9F5FF',
  '#F4EBFF',
  '#E9D7FE',
  '#D6BBFB',
  '#B692F6',
  '#9E77ED',
  '#7F56D9',
  '#6941C6',
  '#53389E',
  '#42307D',
] as const;

// 범용 색상 팔레트 (기존 중복 제거)
export const CHART_COLOR_PALETTE = [
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
] as const;

// 차트 관련 기본 색상들
export const CHART_DEFAULTS = {
  PRIMARY: '#6366f1',
  TEXT_PRIMARY: '#374151',
  TEXT_SECONDARY: '#6b7280', 
  GRID: '#f1f5f9',
} as const;

// 타입 추출
export type ChartColorPalette = typeof CHART_COLOR_PALETTE[number];
export type PrimaryColorScale = typeof PRIMARY_COLOR_SCALES[number];
export type SankeyColorScale = typeof SANKEY_COLOR_SCALES[number];
