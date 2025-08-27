import { capitalCase } from 'change-case';
import { capitalizeFirst } from '@/app/(protected)/home/_components/HomeFormat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { PRIMARY_COLOR_SCALES } from './colors';

// 최소값 미만은 minPercent로 올리고, 초과분은 가장 큰 값에서만 차감
function formatHistogramWidth(rawWidths: number[], minPercent: number = 5): number[] {
  const total = rawWidths.reduce((a, b) => a + b, 0);
  if (total === 0) return rawWidths.map(() => 100 / rawWidths.length);

  const percents = rawWidths.map((v) => (v / total) * 100);

  let amountToRaise = 0;
  let donatablePool = 0;
  const segmentsToRaise: number[] = [];
  const donorSegments: number[] = [];

  percents.forEach((p, i) => {
    // 0%인 항목은 너비를 조정하지 않습니다.
    if (p > 0 && p < minPercent) {
      amountToRaise += minPercent - p;
      segmentsToRaise.push(i);
    } else if (p > minPercent) {
      // 10% 초과분만 '기부 가능'한 양으로 계산합니다.
      donatablePool += p - minPercent;
      donorSegments.push(i);
    }
  });

  // '기부 가능한' 총량이 '필요한' 총량보다 클 경우에만 안전하게 조정을 실행합니다.
  if (amountToRaise > 0 && donatablePool > amountToRaise) {
    // 기여는 각자의 '여유분'에 비례하여 이루어집니다.
    donorSegments.forEach((i) => {
      const surplus = percents[i] - minPercent;
      const contributionRatio = surplus / donatablePool;
      percents[i] -= amountToRaise * contributionRatio;
    });

    segmentsToRaise.forEach((i) => {
      percents[i] = minPercent;
    });
  }
  // 만약 기부 가능한 양이 충분하지 않으면, 왜곡을 피하기 위해 아무것도 하지 않고 원본 비율을 유지합니다.

  // 부동소수점 계산으로 인한 오차를 가장 큰 항목에 더하여 보정합니다.
  const finalSum = percents.reduce((a, b) => a + b, 0);
  if (Math.abs(finalSum - 100) > 0.01) {
    let maxIdx = -1;
    let maxVal = -1;
    percents.forEach((p, i) => {
      if (p > maxVal) {
        maxVal = p;
        maxIdx = i;
      }
    });
    if (maxIdx !== -1) {
      percents[maxIdx] += 100 - finalSum;
    }
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
  const fixedWidths = formatHistogramWidth(rawWidths, 7);

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('flex w-full min-w-0 overflow-hidden text-center', className)}>
        {chartData &&
          filteredChartData.map(({ title, value }, idx) => {
            const width = fixedWidths[idx];
            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div style={{ width: `${width}%` }} className="min-w-0 cursor-pointer">
                    <div
                      className={cn(
                        'truncate p-3.5 text-lg font-semibold text-white transition-opacity hover:opacity-80',
                        idx === 0 ? 'rounded-l-lg' : '',
                        idx === filteredChartData.length - 1 ? 'rounded-r-lg' : ''
                      )}
                      style={{ background: `${PRIMARY_COLOR_SCALES[idx]}` }}
                    >
                      {value}
                    </div>

                    <p className="mt-1 truncate text-xs font-medium text-default-900">{capitalizeFirst(title)}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <div className="text-center">
                    <div className="font-semibold">{capitalizeFirst(title)}</div>
                    <div className="text-sm">{value}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
      </div>
    </TooltipProvider>
  );
}

export default TheHistogramChart;
