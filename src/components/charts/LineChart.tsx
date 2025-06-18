import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface LineChartProps {
  chartData: Plotly.Data[];
  chartLayout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
}

function LineChart({ chartData, chartLayout, config = {} }: LineChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const mergedLayout = {
        ...chartLayout,
        yaxis: {
          ...(typeof chartLayout?.yaxis === 'object' ? chartLayout.yaxis : {}),
          tickformat: ',d',
        },
        xaxis: {
          ...(typeof chartLayout?.xaxis === 'object' ? chartLayout.xaxis : {}),
          tickformat: '%H:%M',
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
  }, [chartData, chartLayout, config]);

  return <div ref={chartRef}></div>;
}

export default LineChart;
