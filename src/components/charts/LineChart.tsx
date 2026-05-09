"use client";

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface LineChartProps {
  chartData: Plotly.Data[];
  chartLayout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  preserveAxisTickFormat?: boolean;
}

function LineChart({ chartData, chartLayout, config = {}, preserveAxisTickFormat = false }: LineChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const yAxis = typeof chartLayout?.yaxis === 'object' ? chartLayout.yaxis : {};
      const xAxis = typeof chartLayout?.xaxis === 'object' ? chartLayout.xaxis : {};
      const mergedLayout = {
        ...chartLayout,
        yaxis: {
          ...yAxis,
          tickformat: preserveAxisTickFormat ? ((yAxis as any)?.tickformat ?? ',d') : ',d',
        },
        xaxis: {
          ...xAxis,
          tickformat: preserveAxisTickFormat ? ((xAxis as any)?.tickformat ?? '%H:%M') : '%H:%M',
        },
        ...(chartLayout?.yaxis2
          ? {
              yaxis2: {
                ...(typeof chartLayout?.yaxis2 === 'object' ? chartLayout.yaxis2 : {}),
                tickformat: ',d',
              },
            }
          : {}),
      };
      Plotly.newPlot(chartRef.current, chartData, mergedLayout, {
        autosizable: true,
        responsive: true,
        ...config,
      });
    }
  }, [chartData, chartLayout, config, preserveAxisTickFormat]);

  return <div ref={chartRef}></div>;
}

export type { LineChartProps };
export default LineChart;
