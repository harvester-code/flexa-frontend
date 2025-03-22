import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface BarChartProps {
  chartData: Plotly.Data[];
  chartLayout?: Partial<Plotly.Layout>;
}

function BarChart({ chartData, chartLayout }: BarChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, chartData, chartLayout, {
        autosizable: true,
        responsive: true,
      });
    }
  }, [chartData, chartLayout]);

  return <div ref={chartRef}></div>;
}

export default BarChart;
