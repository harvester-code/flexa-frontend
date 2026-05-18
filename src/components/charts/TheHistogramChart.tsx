import { capitalizeFirst } from "@/app/(protected)/home/_components/HomeFormat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

// Primary 색상의 밝기 변화로 구분 (보라색 계열)
const PRIMARY_COLOR_SCALES = [
  "#6b46c1", // violet-600 (가장 진한)
  "#7c3aed", // violet-500
  "#8b5cf6", // violet-400
  "#a78bfa", // violet-300
  "#c4b5fd", // violet-200
  "#ddd6fe", // violet-100
  "#ede9fe", // violet-50
  "#f3f4f6", // gray-100 (연한)
  "#e5e7eb", // gray-200
  "#d1d5db", // gray-300
];

// 최소값 미만은 minPercent로 올리고, 초과분은 가장 큰 값에서만 차감
function formatHistogramWidth(
  rawWidths: number[],
  minPercent: number = 5,
): number[] {
  const total = rawWidths.reduce((a, b) => a + b, 0);
  if (total === 0) return rawWidths.map(() => 100 / rawWidths.length);

  const percents = rawWidths.map((v) => (v / total) * 100);

  let amountToRaise = 0;
  let donatablePool = 0;
  const segmentsToRaise: number[] = [];
  const donorSegments: number[] = [];

  percents.forEach((p, i) => {
    if (p > 0 && p < minPercent) {
      amountToRaise += minPercent - p;
      segmentsToRaise.push(i);
    } else if (p > minPercent) {
      donatablePool += p - minPercent;
      donorSegments.push(i);
    }
  });

  if (amountToRaise > 0 && donatablePool > amountToRaise) {
    donorSegments.forEach((i) => {
      const surplus = percents[i] - minPercent;
      const contributionRatio = surplus / donatablePool;
      percents[i] -= amountToRaise * contributionRatio;
    });

    segmentsToRaise.forEach((i) => {
      percents[i] = minPercent;
    });
  }

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

interface ChartDataItem {
  title: string;
  value: React.ReactNode;
  width: number;
  color?: string;
  group?: string;
  groupLabel?: string;
}

interface LegendItem {
  color: string;
  label: string;
}

interface TheHistogramChartProps {
  chartData: ChartDataItem[];
  legend?: LegendItem[];
  className?: string;
}

function TheHistogramChart({
  chartData,
  legend,
  className,
}: TheHistogramChartProps) {
  const filteredChartData = chartData?.filter(({ width }) => width > 0);
  const rawWidths = filteredChartData.map((d) => d.width);
  const fixedWidths = formatHistogramWidth(rawWidths, 7);

  const isGrouped = filteredChartData.some((d) => d.group);

  if (isGrouped) {
    // 연속된 같은 group끼리 묶기
    type GroupEntry = {
      groupName: string;
      displayLabel: string;
      items: ChartDataItem[];
      widths: number[];
    };
    const groups: GroupEntry[] = [];

    filteredChartData.forEach((item, idx) => {
      const groupName = item.group ?? item.title;
      const displayLabel = item.groupLabel ?? groupName;
      const last = groups[groups.length - 1];
      if (last && last.groupName === groupName) {
        last.items.push(item);
        last.widths.push(fixedWidths[idx]);
      } else {
        groups.push({
          groupName,
          displayLabel,
          items: [item],
          widths: [fixedWidths[idx]],
        });
      }
    });

    return (
      <TooltipProvider delayDuration={0}>
        {legend && legend.length > 0 && (
          <div className="mb-2 flex items-center justify-end gap-4">
            {legend.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-default-600">{item.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className={cn("flex w-full min-w-0 gap-1 text-center", className)}>
          {groups.map((group, gIdx) => {
            const totalGroupWidthPct = group.widths.reduce((a, b) => a + b, 0);

            return (
              <div
                key={gIdx}
                style={{ width: `${totalGroupWidthPct}%` }}
                className="min-w-0 flex-shrink-0"
              >
                <div className="flex overflow-hidden rounded-lg">
                  {group.items.map((item, iIdx) => {
                    const barWidthPct =
                      (group.widths[iIdx] / totalGroupWidthPct) * 100;
                    const backgroundColor =
                      item.color ??
                      PRIMARY_COLOR_SCALES[gIdx % PRIMARY_COLOR_SCALES.length];

                    return (
                      <Tooltip key={iIdx}>
                        <TooltipTrigger asChild>
                          <div
                            style={{
                              width: `${barWidthPct}%`,
                              background: backgroundColor,
                            }}
                            className="flex min-w-0 cursor-pointer items-center justify-center truncate p-4 text-xl font-bold text-white transition-opacity hover:opacity-90"
                          >
                            <span className="tracking-wide">{item.value}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" style={{ background: backgroundColor }}>
                          <div className="text-center">
                            <div className="font-semibold">
                              {capitalizeFirst(group.groupName)}
                            </div>
                            <div className="text-xs opacity-75">
                              {item.title}
                            </div>
                            <div className="text-sm">{item.value}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                <p className="mt-1.5 truncate text-xs font-medium text-default-600">
                  {capitalizeFirst(group.displayLabel)}
                </p>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // 기존 비그룹 모드
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex w-full min-w-0 overflow-hidden text-center",
          className,
        )}
      >
        {filteredChartData.map(({ title, value, color }, idx) => {
          const width = fixedWidths[idx];
          const backgroundColor =
            color ?? PRIMARY_COLOR_SCALES[idx % PRIMARY_COLOR_SCALES.length];

          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <div
                  style={{ width: `${width}%` }}
                  className="min-w-0 cursor-pointer"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center truncate p-4 text-xl font-bold text-white transition-opacity hover:opacity-90",
                      idx === 0 ? "rounded-l-lg" : "",
                      idx === filteredChartData.length - 1
                        ? "rounded-r-lg"
                        : "",
                    )}
                    style={{ background: backgroundColor }}
                  >
                    <span className="tracking-wide">{value}</span>
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium text-default-600">
                    {capitalizeFirst(title)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" style={{ background: backgroundColor }}>
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
