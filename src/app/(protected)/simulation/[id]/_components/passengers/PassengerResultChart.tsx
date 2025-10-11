"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { COMPONENT_TYPICAL_COLORS } from "@/styles/colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useSimulationStore } from "../../_stores";

const BarChart = dynamic(() => import("@/components/charts/BarChart"), {
  ssr: false,
});

interface PassengerScheduleChartData {
  total: number;
  chart_x_data: string[];
  chart_y_data: {
    [category: string]: Array<{
      name: string;
      order: number;
      y: number[];
    }>;
  };
  summary?: {
    flights: number;
    avg_seats: number;
    load_factor: number;
    min_arrival_minutes: number;
  };
}

// Props 제거 - Zustand에서 직접 데이터 가져오기
export default function PassengerResultChart() {
  const [selectedCategory, setSelectedCategory] = useState<string>("airline");

  // 🎯 Zustand에서 직접 데이터 가져오기
  const passengerChartResult = useSimulationStore(
    (s) => s.passenger.chartResult
  );

  // 🔧 모든 Hook을 조건부 return 이전에 호출 (Rules of Hooks 준수)
  const categories = passengerChartResult?.chart_y_data
    ? Object.keys(passengerChartResult.chart_y_data).filter(
        (key) => key && key.length > 0
      )
    : [];
  const validSelectedCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : categories.length > 0
      ? categories[0]
      : "airline";

  // Plotly용 데이터 변환 (조건부 return 이전에 호출)
  const plotlyData = useMemo(() => {
    if (
      !passengerChartResult?.chart_y_data ||
      !validSelectedCategory ||
      !passengerChartResult.chart_y_data[validSelectedCategory] ||
      !passengerChartResult?.chart_x_data
    ) {
      return [];
    }

    const categoryData =
      passengerChartResult.chart_y_data[validSelectedCategory];
    const xLabels = passengerChartResult.chart_x_data;

    // ✅ 승객 수 기준으로 내림차순 정렬
    const sortedCategoryData = [...categoryData].sort((a, b) => {
      const totalPassengersA = a.y.reduce(
        (sum: number, passengers: number) => sum + passengers,
        0
      );
      const totalPassengersB = b.y.reduce(
        (sum: number, passengers: number) => sum + passengers,
        0
      );
      return totalPassengersB - totalPassengersA; // 내림차순 (많은 것부터)
    });

    // etc를 마지막으로 이동
    const etcIndex = sortedCategoryData.findIndex(item => item.name.toLowerCase() === 'etc');
    let reorderedData = [...sortedCategoryData];

    if (etcIndex !== -1) {
      const etcData = reorderedData.splice(etcIndex, 1)[0];
      reorderedData.push(etcData);
    }

    // Plotly traces 생성 (정렬된 순서로)
    // x축에 0부터 시작하는 인덱스 사용 (Plotly에서 array tickmode 사용 시 필요)
    const traces = reorderedData.map((series, index) => ({
      name: series.name === 'etc' ? 'ETC' : series.name, // etc를 대문자로
      x: xLabels.map((_, i) => i), // 인덱스 배열 사용
      y: series.y,
      type: "bar" as const,
      showlegend: true, // ✅ 하나만 있어도 legend 표시
      marker: {
        color: series.name.toLowerCase() === 'etc'
          ? '#9CA3AF' // etc는 회색
          : COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length],
      },
      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Time: %{customdata}<br>" +
        "Passengers: %{y}<br>" +
        "<extra></extra>",
      customdata: xLabels, // 호버 시 실제 시간 표시용
    }));

    return traces;
  }, [passengerChartResult, validSelectedCategory]);

  // x축 레이블 처리 및 그리드 위치 계산
  const { xAxisLabels, gridPositions } = useMemo(() => {
    if (!passengerChartResult?.chart_x_data) return { xAxisLabels: [], gridPositions: [] };

    const xLabels = passengerChartResult.chart_x_data;
    const totalPoints = xLabels.length;
    let showMinutes: number[];

    if (totalPoints <= 30) {
      showMinutes = [0, 10, 20, 30, 40, 50];
    } else if (totalPoints <= 60) {
      showMinutes = [0, 20, 40];
    } else if (totalPoints <= 90) {
      showMinutes = [0, 30];
    } else {
      showMinutes = [0];
    }

    const gridPos: number[] = [];
    const labels = xLabels.map((label, index) => {
      const [date, time] = label.split(' ');
      const [hour, minute] = time.split(':');
      const minutes = parseInt(minute);

      if (showMinutes.includes(minutes)) {
        gridPos.push(index); // 레이블이 표시되는 위치 저장
        if (minutes === 0) {
          // 자정(00:00)은 시간만 표시 (날짜는 annotation으로 별도 표시)
          return `<b>${hour}:${minute}</b>`;
        }
        return `${hour}:${minute}`;
      }
      return '';
    });

    return { xAxisLabels: labels, gridPositions: gridPos };
  }, [passengerChartResult]);

  // 날짜 변경 위치 찾기
  const dateChangeIndices = useMemo(() => {
    const xLabels = passengerChartResult?.chart_x_data || [];
    const indices: number[] = [];

    if (xLabels.length > 0) {
      let prevDate = xLabels[0].split(' ')[0];
      xLabels.forEach((label, index) => {
        const currentDate = label.split(' ')[0];
        if (currentDate !== prevDate) {
          indices.push(index);
          prevDate = currentDate;
        }
      });
    }

    return indices;
  }, [passengerChartResult]);

  // Plotly 레이아웃 설정
  const layout = useMemo(() => {
    const xLabels = passengerChartResult?.chart_x_data || [];
    let dateRangeText = '';

    if (xLabels.length > 0) {
      const startDate = xLabels[0].split(' ')[0];
      const endDate = xLabels[xLabels.length - 1].split(' ')[0];
      dateRangeText = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
    }

    return {
      title: {
        text: `Passenger Show-up Distribution by ${validSelectedCategory.charAt(0).toUpperCase() + validSelectedCategory.slice(1)}<br><sub>${dateRangeText}</sub>`,
        font: { size: 16, family: "Pretendard, Arial, sans-serif" },
      },
      barmode: "stack" as const,
      xaxis: {
        title: { text: "Time" },
        tickangle: -45,
        font: { family: "Pretendard, Arial, sans-serif" },
        tickmode: "array" as const,
        ticktext: xAxisLabels,
        tickvals: xAxisLabels.map((_, index) => index),
        showgrid: false, // 기본 그리드 비활성화
      },
      yaxis: {
        title: { text: "Number of Passengers" },
        font: { family: "Pretendard, Arial, sans-serif" },
        showgrid: true,
        gridcolor: "rgba(200, 200, 200, 0.3)",
      },
      font: { family: "Pretendard, Arial, sans-serif" },
      margin: { l: 60, r: 60, t: 100, b: 120 },
      height: 500,
      showlegend: true,
      legend: {
        orientation: "h" as const,
        x: 0,
        y: -0.25,  // 더 아래로 이동
        font: { family: "Pretendard, Arial, sans-serif" },
        traceorder: "normal" as const,
      },
      hoverlabel: {
        font: { family: "Pretendard, Arial, sans-serif" },
        bgcolor: "white",
        bordercolor: "hsl(var(--border))",
      },
      // shapes를 사용해서 커스텀 그리드 추가
      shapes: [
        // 레이블이 표시되는 위치에만 그리드 표시
        ...gridPositions.map(pos => ({
          type: 'line' as const,
          x0: pos,
          x1: pos,
          y0: 0,
          y1: 1,
          yref: 'paper' as const,
          line: {
            color: 'rgba(200, 200, 200, 0.3)',
            width: 1,
          },
        })),
        // 날짜 변경선은 다르게 표시
        ...dateChangeIndices.map(pos => ({
          type: 'line' as const,
          x0: pos,
          x1: pos,
          y0: 0,
          y1: 1,
          yref: 'paper' as const,
          line: {
            color: 'rgba(255, 100, 100, 0.4)',
            width: 2,
            dash: 'dot' as const,
          },
        })),
      ],
      // 날짜 annotation 추가
      annotations: [
        ...dateChangeIndices.map(pos => {
          const dateLabel = xLabels[pos] ? xLabels[pos].split(' ')[0] : '';
          return {
            x: pos,
            y: 1.05,
            yref: 'paper' as const,
            text: `<b>${dateLabel.substring(5)}</b>`, // MM-DD 형식
            showarrow: false,
            font: {
              size: 12,
              color: 'rgba(255, 100, 100, 0.8)',
              family: "Pretendard, Arial, sans-serif",
            },
            xanchor: 'center' as const,
            yanchor: 'bottom' as const,
            bgcolor: 'white',
            bordercolor: 'rgba(255, 100, 100, 0.4)',
            borderwidth: 1,
            borderpad: 4,
          };
        }),
      ],
    };
  }, [xAxisLabels, gridPositions, dateChangeIndices, validSelectedCategory, passengerChartResult]);

  // ✅ 기본 데이터만 있어도 표시할 수 있도록 수정
  if (!passengerChartResult) {
    return null;
  }

  // chart_y_data가 없으면 차트는 숨기고 요약 정보만 표시
  const hasChartData =
    passengerChartResult?.chart_y_data && categories.length > 0;

  const config = {
    displayModeBar: true,
    responsive: true,
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-default-900">
              Passenger Schedule Chart
            </CardTitle>
            <p className="text-sm text-default-500">
              Visual representation of passenger show-up time data
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Total Passengers and Category Selector in one row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <div>
              <span className="text-default-600 text-sm">
                Total Passengers:{" "}
              </span>
              <span className="text-sm font-medium text-default-900">
                {passengerChartResult.total.toLocaleString()}
              </span>
            </div>
            {passengerChartResult.summary && (
              <div className="text-default-600 flex gap-4 text-sm">
                <span>
                  Flights:{" "}
                  <span className="font-medium text-default-900">
                    {passengerChartResult.summary.flights}
                  </span>
                </span>
                <span>
                  Load Factor:{" "}
                  <span className="font-medium text-default-900">
                    {passengerChartResult.summary.load_factor}%
                  </span>
                </span>
                <span>
                  Avg Seats:{" "}
                  <span className="font-medium text-default-900">
                    {passengerChartResult.summary.avg_seats}
                  </span>
                </span>
              </div>
            )}
          </div>
          {hasChartData && (
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((category) => category && category.length > 0)
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category && category.length > 0
                        ? category.charAt(0).toUpperCase() + category.slice(1)
                        : category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Chart - chart_y_data가 있을 때만 렌더링 */}
        {hasChartData && plotlyData.length > 0 ? (
          <div className="w-full" style={{ height: "500px" }}>
            <BarChart
              chartData={plotlyData}
              chartLayout={layout}
              config={config}
            />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Chart data not available
              </p>
              <p className="text-xs text-gray-400">
                The API response is missing chart_y_data
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
