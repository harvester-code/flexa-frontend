'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// PlotlyChart를 동적으로 로드
const PlotlyChart = dynamic(() => import('@/components/ThePlotlyChart'), { ssr: false });

// 차트 설정 상수
const CHART_CONSTANTS = {
  DISTRIBUTION_POINTS: 200,
  STANDARD_DEVIATION_RANGE: 4,
  DEFAULT_X_MIN: -250,
  DEFAULT_X_MAX: 50,
  DEFAULT_ALPHA: 0.1,
  LINE_WIDTH: 2,
  COLORS: {
    DEFAULT: '#6366f1',
    TEXT_PRIMARY: '#374151',
    TEXT_SECONDARY: '#6b7280',
    GRID: '#f1f5f9',
  },
  FONTS: {
    FAMILY: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
    SIZE_LARGE: 13,
    SIZE_MEDIUM: 12,
    SIZE_SMALL: 11,
  },
  MARGINS: {
    LEFT: 60,
    RIGHT: 60,
    TOP: 20,
    BOTTOM: 60,
  },
} as const;

interface AirlineParamWithColor {
  iata: string;
  name: string;
  mean: number;
  stdDev: number;
  color?: string;
}

interface TabPassengerScheduleNormalDistributionProps {
  // 단일 항공사용 props (기존 호환성)
  mean?: number;
  stdDev?: number;
  color?: string;

  // 다중 항공사용 props (새로 추가)
  airlineParams?: AirlineParamWithColor[];

  title?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  height?: number;
  width?: string;
  className?: string;

  // 차트 설정 props
  fillOpacity?: number;
  lineWidth?: number;
  distributionPoints?: number;
  standardDeviationRange?: number;
  defaultXRange?: { min: number; max: number };
  showGrid?: boolean;
  gridColor?: string;
}

// 정규분포 계산 함수
function normalDistribution(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  return coefficient * Math.exp(exponent);
}

// 정규분포 차트 데이터 생성
function generateNormalDistributionData(
  mean: number,
  stdDev: number,
  points: number = CHART_CONSTANTS.DISTRIBUTION_POINTS,
  stdDevRange: number = CHART_CONSTANTS.STANDARD_DEVIATION_RANGE
) {
  // 평균을 중심으로 ±n 표준편차 범위로 설정
  const xMin = mean - stdDevRange * stdDev;
  const xMax = mean + stdDevRange * stdDev;

  const xValues: number[] = [];
  const yValues: number[] = [];

  for (let i = 0; i <= points; i++) {
    const x = xMin + (i * (xMax - xMin)) / points;
    const y = normalDistribution(x, mean, stdDev);
    xValues.push(x);
    yValues.push(y);
  }

  return { x: xValues, y: yValues, xMin, xMax };
}

// HEX 색상을 RGBA로 변환하는 함수
function hexToRgba(hex: string, alpha: number): string {
  // #이 있으면 제거
  hex = hex.replace('#', '');

  // 3자리 hex를 6자리로 변환
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // 6자리가 아니면 기본값 반환
  if (hex.length !== 6) {
    return `rgba(99, 102, 241, ${alpha})`;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // NaN 체크
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(99, 102, 241, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TabPassengerScheduleNormalDistribution({
  mean,
  stdDev,
  color = '#6366f1',
  airlineParams,
  title = 'Normal Distribution',
  xAxisTitle = 'Time before departure (minutes)',
  yAxisTitle = 'Probability Density',
  height = 400,
  width = '100%',
  className = '',
  fillOpacity = CHART_CONSTANTS.DEFAULT_ALPHA,
  lineWidth = CHART_CONSTANTS.LINE_WIDTH,
  distributionPoints = CHART_CONSTANTS.DISTRIBUTION_POINTS,
  standardDeviationRange = CHART_CONSTANTS.STANDARD_DEVIATION_RANGE,
  defaultXRange = { min: CHART_CONSTANTS.DEFAULT_X_MIN, max: CHART_CONSTANTS.DEFAULT_X_MAX },
  showGrid = true,
  gridColor = CHART_CONSTANTS.COLORS.GRID,
}: TabPassengerScheduleNormalDistributionProps) {
  // 차트 데이터 생성
  const chartData = useMemo(() => {
    if (airlineParams && airlineParams.length > 0) {
      // 다중 항공사 모드
      return airlineParams.map((param, index) => {
        const normalData = generateNormalDistributionData(
          param.mean,
          param.stdDev,
          distributionPoints,
          standardDeviationRange
        );

        // 색상 처리
        let fillColor = `rgba(99, 102, 241, ${fillOpacity})`;
        let lineColor: string = CHART_CONSTANTS.COLORS.DEFAULT;

        if (param.color) {
          lineColor = param.color;

          if (param.color.startsWith('#')) {
            fillColor = hexToRgba(param.color, fillOpacity);
          } else if (param.color.startsWith('hsl')) {
            // HSL 형식 처리
            const hslMatch = param.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
              const [, h, s, l] = hslMatch;
              fillColor = `hsla(${h}, ${s}%, ${l}%, ${fillOpacity})`;
            } else {
              fillColor = param.color.replace(')', `, ${fillOpacity})`).replace('hsl', 'hsla');
            }
          } else if (param.color.startsWith('rgb')) {
            // RGB 형식 처리
            const rgbMatch = param.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              const [, r, g, b] = rgbMatch;
              fillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
            } else {
              fillColor = param.color.replace(')', `, ${fillOpacity})`).replace('rgb', 'rgba');
            }
          } else {
            // 알 수 없는 형식은 기본값 사용
            fillColor = `rgba(99, 102, 241, ${fillOpacity})`;
          }
        }

        return {
          x: normalData.x,
          y: normalData.y,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: param.name,
          line: {
            color: lineColor,
            width: lineWidth,
          },
          fill: 'tozeroy' as const,
          fillcolor: fillColor,
        };
      });
    } else if (mean !== undefined && stdDev !== undefined) {
      // 단일 항공사 모드 (기존 호환성)
      const normalData = generateNormalDistributionData(mean, stdDev, distributionPoints, standardDeviationRange);

      return [
        {
          x: normalData.x,
          y: normalData.y,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: title,
          line: {
            color: color,
            width: lineWidth,
          },
          fill: 'tozeroy' as const,
          fillcolor: hexToRgba(color, fillOpacity),
        },
      ];
    } else {
      return [];
    }
  }, [airlineParams, mean, stdDev, color, title, fillOpacity, lineWidth, distributionPoints, standardDeviationRange]);

  // 차트 레이아웃
  const chartLayout = useMemo(() => {
    // 다중 모드일 때 전체 범위 계산
    let xMin = defaultXRange.min;
    let xMax = defaultXRange.max;

    if (airlineParams && airlineParams.length > 0) {
      const allRanges = airlineParams.map((param) => {
        const data = generateNormalDistributionData(
          param.mean,
          param.stdDev,
          distributionPoints,
          standardDeviationRange
        );
        return { xMin: data.xMin, xMax: data.xMax };
      });

      xMin = Math.min(...allRanges.map((r) => r.xMin));
      xMax = Math.max(...allRanges.map((r) => r.xMax));
    } else if (mean !== undefined && stdDev !== undefined) {
      const normalData = generateNormalDistributionData(mean, stdDev, distributionPoints, standardDeviationRange);
      xMin = normalData.xMin;
      xMax = normalData.xMax;
    }

    return {
      showlegend: true,
      legend: {
        x: 1,
        y: 1,
        xanchor: 'right' as const,
        yanchor: 'top' as const,
        orientation: 'v' as const,
        font: {
          family: CHART_CONSTANTS.FONTS.FAMILY,
          size: CHART_CONSTANTS.FONTS.SIZE_MEDIUM,
          color: CHART_CONSTANTS.COLORS.TEXT_PRIMARY,
        },
      },
      xaxis: {
        title: {
          text: xAxisTitle,
          font: {
            family: CHART_CONSTANTS.FONTS.FAMILY,
            size: CHART_CONSTANTS.FONTS.SIZE_LARGE,
            color: CHART_CONSTANTS.COLORS.TEXT_PRIMARY,
          },
        },
        range: [xMin, xMax],
        showgrid: showGrid,
        gridcolor: gridColor,
        zeroline: false,
        tickfont: {
          family: CHART_CONSTANTS.FONTS.FAMILY,
          size: CHART_CONSTANTS.FONTS.SIZE_SMALL,
          color: CHART_CONSTANTS.COLORS.TEXT_SECONDARY,
        },
      },
      yaxis: {
        title: {
          text: yAxisTitle,
          font: {
            family: CHART_CONSTANTS.FONTS.FAMILY,
            size: CHART_CONSTANTS.FONTS.SIZE_LARGE,
            color: CHART_CONSTANTS.COLORS.TEXT_PRIMARY,
          },
        },
        showgrid: showGrid,
        gridcolor: gridColor,
        zeroline: false,
        tickfont: {
          family: CHART_CONSTANTS.FONTS.FAMILY,
          size: CHART_CONSTANTS.FONTS.SIZE_SMALL,
          color: CHART_CONSTANTS.COLORS.TEXT_SECONDARY,
        },
      },
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      margin: {
        l: CHART_CONSTANTS.MARGINS.LEFT,
        r: CHART_CONSTANTS.MARGINS.RIGHT,
        t: CHART_CONSTANTS.MARGINS.TOP,
        b: CHART_CONSTANTS.MARGINS.BOTTOM,
      },
      font: {
        family: CHART_CONSTANTS.FONTS.FAMILY,
        size: CHART_CONSTANTS.FONTS.SIZE_MEDIUM,
        color: CHART_CONSTANTS.COLORS.TEXT_PRIMARY,
      },
    };
  }, [
    airlineParams,
    mean,
    stdDev,
    xAxisTitle,
    yAxisTitle,
    distributionPoints,
    standardDeviationRange,
    defaultXRange,
    showGrid,
    gridColor,
  ]);

  return (
    <div className={`w-full ${className}`} style={{ width, height }}>
      <PlotlyChart
        chartData={chartData}
        chartLayout={chartLayout}
        chartConfig={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
