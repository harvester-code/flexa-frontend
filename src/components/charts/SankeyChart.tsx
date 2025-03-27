import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface SankeyChartProps {
  chartData: Plotly.Data[];
  chartLayout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
}

function SankeyChart({ chartData, chartLayout, config }: SankeyChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, chartData, chartLayout, {
        autosizable: true,
        responsive: true,
        ...config,
      });
    }
  }, [chartData, chartLayout]);

  return <div ref={chartRef}></div>;
}

export default SankeyChart;
