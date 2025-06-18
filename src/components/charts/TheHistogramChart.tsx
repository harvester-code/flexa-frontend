import { capitalCase } from 'change-case';
import { capitalizeFirst } from '@/app/(protected)/home/_components/HomeFormat';
import { PRIMARY_COLOR_SCALES } from '@/constants';
import { cn } from '@/lib/utils';

// 최소값 미만은 minPercent로 올리고, 초과분은 가장 큰 값에서만 차감
function formatHistogramWidth(rawWidths: number[], minPercent: number = 5): number[] {
  const total = rawWidths.reduce((a, b) => a + b, 0);
  if (total === 0) return rawWidths.map((_) => 100 / rawWidths.length);

  // 1. 비율로 변환
  let percents = rawWidths.map((v) => (v / total) * 100);

  // 2. 최소값 미만 항목을 minPercent로 올림, 초과분 계산
  let over = 0;
  percents = percents.map((p) => {
    if (p < minPercent) {
      over += minPercent - p;
      return minPercent;
    }
    return p;
  });

  // 3. 가장 큰 값(최대값)에서만 over만큼 차감
  if (over > 0) {
    let maxIdx = percents.reduce((maxIdx, p, i) => (p > percents[maxIdx] ? i : maxIdx), 0);
    percents[maxIdx] -= over;
  }

  // 4. 합이 100이 아닐 수 있으니 가장 큰 값에 보정
  const sum = percents.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    let maxIdx = percents.reduce((maxIdx, p, i) => (p > percents[maxIdx] ? i : maxIdx), 0);
    percents[maxIdx] += 100 - sum;
  }

  return percents;
}

interface TheHistogramChartProps {
  chartData: {
    title: string;
    value: React.ReactNode;
    width: number;
  }[];
  className?: string;
}

function TheHistogramChart({ chartData, className }: TheHistogramChartProps) {
  const filteredChartData = chartData?.filter(({ width }) => width > 0);

  // width 보정: 최소값 미만은 minPercent로 올리고, 초과분은 가장 큰 값에서만 차감
  const rawWidths = filteredChartData.map((d) => d.width);
  const fixedWidths = formatHistogramWidth(rawWidths, 10);

  return (
    <div className={cn('flex w-full min-w-0 overflow-hidden text-center', className)}>
      {chartData &&
        filteredChartData.map(({ title, value }, idx) => {
          const width = fixedWidths[idx];
          return (
            <div style={{ width: `${width}%` }} className="min-w-0" key={idx}>
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

              <p className="mt-1 truncate text-sm font-medium text-default-700">{capitalizeFirst(title)}</p>
            </div>
          );
        })}
    </div>
  );
}

export default TheHistogramChart;
