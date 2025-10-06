import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface BarChartProps {
  chartData: Plotly.Data[];
  chartLayout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
}

function BarChart({ chartData, chartLayout, config }: BarChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const layoutYAxis = typeof chartLayout?.yaxis === 'object' ? chartLayout.yaxis : {};
      const layoutXAxis = typeof chartLayout?.xaxis === 'object' ? chartLayout.xaxis : {};
      const mergedLayout = {
        ...chartLayout,
        yaxis: {
          ...layoutYAxis,
          tickformat: (layoutYAxis as any)?.tickformat ?? ',d',
        },
        xaxis: {
          ...layoutXAxis,
          tickformat: (layoutXAxis as any)?.tickformat ?? '%H:%M',
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

export default BarChart;
