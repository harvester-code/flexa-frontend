import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface DonutChartProps {
  chartData: Plotly.Data[];
  chartLayout?: Partial<Plotly.Layout>;
  className?: string;
}

function DonutChart({ chartData, chartLayout, className }: DonutChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, chartData, chartLayout, {
        autosizable: true,
        responsive: true,
      });
    }
  }, [chartData, chartLayout]);

  return <div ref={chartRef} className={className}></div>;
}

export default DonutChart;
