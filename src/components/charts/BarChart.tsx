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
      Plotly.newPlot(chartRef.current, chartData, chartLayout, {
        autosizable: true,
        responsive: true,
        ...config,
      });
    }
  }, [chartData, chartLayout, config]);

  return <div ref={chartRef}></div>;
}

export default BarChart;
