import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps extends React.HTMLAttributes<HTMLDivElement> {
  chartData: Plotly.Data[];
  chartLayout?: Partial<Plotly.Layout>;
  chartConfig?: Partial<Plotly.Config>;
}

function PlotlyChart({ chartData, chartConfig, chartLayout, ...rest }: PlotlyChartProps) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      Plotly.newPlot(chartRef.current, chartData, chartLayout, {
        autosizable: true,
        responsive: true,
        ...chartConfig,
      });
    }
  }, [chartData, chartConfig, chartLayout]);

  return <div ref={chartRef} {...rest}></div>;
}

export default PlotlyChart;
