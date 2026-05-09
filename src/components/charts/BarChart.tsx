import LineChart, { type LineChartProps } from './LineChart';

export type { LineChartProps as BarChartProps };

export default function BarChart(props: LineChartProps) {
  return <LineChart {...props} preserveAxisTickFormat />;
}
