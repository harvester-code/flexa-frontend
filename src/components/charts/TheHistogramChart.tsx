import { capitalCase } from 'change-case';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { cn } from '@/lib/utils';

interface TheHistogramChartProps {
  chartData: {
    title: string;
    value: string;
    width: number;
  }[];
  className?: string;
}

function TheHistogramChart({ chartData, className }: TheHistogramChartProps) {
  const filteredChartData = chartData?.filter(({ width }) => width > 0);

  return (
    <div className={cn('flex text-center', className)}>
      {chartData &&
        filteredChartData.map(({ title, value, width }, idx) => {
          return (
            <div style={{ width: `${width}%` }} key={idx}>
              <div
                className={cn(
                  'truncate p-3.5 text-3xl font-bold text-white',
                  idx === 0 ? 'rounded-l-lg' : '',
                  idx === filteredChartData.length - 1 ? 'rounded-r-lg' : ''
                )}
                style={{ background: `${PRIMARY_COLOR_SCALES[idx]}` }}
              >
                {value}
              </div>

              <p className="mt-1 truncate text-sm font-medium text-default-700">{capitalCase(title)}</p>
            </div>
          );
        })}
    </div>
  );
}

export default TheHistogramChart;
