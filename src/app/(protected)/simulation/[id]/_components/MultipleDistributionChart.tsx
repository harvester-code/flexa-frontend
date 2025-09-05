'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// import { useSimulationStore } from '../_stores/store'; // 🔴 zustand 연결 제거

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center text-gray-500">Loading chart...</div>,
});

// 정규분포 확률밀도함수 계산
const normalPDF = (x: number, mean: number, std: number): number => {
  const variance = std * std;
  const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
  const exponent = -((x - mean) ** 2) / (2 * variance);
  return coefficient * Math.exp(exponent);
};

// 정규분포 데이터 생성
const generateNormalDistribution = (mean: number, std: number) => {
  const start = Math.max(0, mean - 4 * std);
  const end = mean + 4 * std;
  const step = (end - start) / 200;

  const x: number[] = [];
  const y: number[] = [];

  for (let i = start; i <= end; i += step) {
    x.push(i);
    y.push(normalPDF(i, mean, std));
  }

  return { x, y };
};

// 색상 팔레트 (여러 곡선 구분용)
const colorPalette = [
  '#8B5CF6', // Primary (Default)
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#3B82F6', // Blue
  '#8B5A2B', // Brown
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
  '#06B6D4', // Cyan
];

interface MultipleDistributionChartProps {
  height?: number;
}

const MultipleDistributionChart: React.FC<MultipleDistributionChartProps> = ({ height = 400 }) => {
  // 🔴 zustand 연결 제거 - useMemo로 안정화
  const passengerData = useMemo(
    () => ({
      pax_demographics: {
        nationality: { rules: [] },
        profile: { rules: [] },
      },
    }),
    []
  );

  const plotData = useMemo(() => {
    const traces = [];
    let colorIndex = 0;

    // Default 분포 추가
    const defaultValues = passengerData.pax_arrival_patterns?.default;

    if (defaultValues?.mean && defaultValues?.std) {
      const data = generateNormalDistribution(defaultValues.mean, defaultValues.std);
      traces.push({
        x: data.x,
        y: data.y,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `Default (μ=${defaultValues.mean}, σ=${defaultValues.std})`,
        line: {
          color: colorPalette[colorIndex % colorPalette.length],
          width: 3,
        },
        fill: 'tonexty' as const,
        fillcolor: `${colorPalette[colorIndex % colorPalette.length]}20`, // 투명도 추가
      });
      colorIndex++;
    }

    // 각 Rule의 분포 추가
    const rules = passengerData.pax_arrival_patterns?.rules || [];

    rules.forEach((rule, index) => {
      if (rule.value?.mean && rule.value?.std) {
        const data = generateNormalDistribution(rule.value.mean, rule.value.std);
        traces.push({
          x: data.x,
          y: data.y,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: `Rule ${index + 1} (μ=${rule.value.mean}, σ=${rule.value.std})`,
          line: {
            color: colorPalette[colorIndex % colorPalette.length],
            width: 2,
          },
          fill: 'tonexty' as const,
          fillcolor: `${colorPalette[colorIndex % colorPalette.length]}15`, // 더 투명하게
        });
        colorIndex++;
      }
    });

    return traces;
  }, [passengerData.pax_arrival_patterns]);

  if (plotData.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 p-6 text-center">
        <p className="text-gray-500">No distributions to display. Please set default values or add rules.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Show-up Time Distributions</h3>
      <Plot
        data={plotData}
        layout={{
          title: {
            text: 'Overlapping Normal Distribution Curves',
            font: { size: 16 },
          },
          xaxis: {
            title: 'Time (minutes)',
            showgrid: true,
            zeroline: false,
            rangemode: 'tozero',
          },
          yaxis: {
            title: 'Probability Density',
            showgrid: true,
            zeroline: false,
          },
          margin: { t: 60, r: 40, b: 60, l: 80 },
          height,
          showlegend: true,
          legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: 'rgba(0,0,0,0.1)',
            borderwidth: 1,
          },
          hovermode: 'x unified',
          plot_bgcolor: 'rgba(0,0,0,0)',
          paper_bgcolor: 'rgba(0,0,0,0)',
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};

export default MultipleDistributionChart;
