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
  const { plotlyData, xAxisLabels } = useMemo(() => {
    if (
      !passengerChartResult?.chart_y_data ||
      !validSelectedCategory ||
      !passengerChartResult.chart_y_data[validSelectedCategory] ||
      !passengerChartResult?.chart_x_data
    ) {
      return { plotlyData: [], xAxisLabels: [] };
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

    // Plotly traces 생성 (정렬된 순서로)
    const traces = sortedCategoryData.map((series, index) => ({
      name: series.name,
      x: xLabels,
      y: series.y,
      type: "bar" as const,
      showlegend: true, // ✅ 하나만 있어도 legend 표시
      marker: {
        color: COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length],
      },
      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Time: %{x}<br>" +
        "Passengers: %{y}<br>" +
        "<extra></extra>",
    }));

    return { plotlyData: traces, xAxisLabels: xLabels };
  }, [passengerChartResult, validSelectedCategory]);

  // ✅ 기본 데이터만 있어도 표시할 수 있도록 수정
  if (!passengerChartResult) {
    return null;
  }

  // chart_y_data가 없으면 차트는 숨기고 요약 정보만 표시
  const hasChartData =
    passengerChartResult?.chart_y_data && categories.length > 0;

  // Plotly 레이아웃 설정
  const layout = {
    title: {
      text: `Passenger Show-up Distribution by ${validSelectedCategory && validSelectedCategory.length > 0 ? validSelectedCategory.charAt(0).toUpperCase() + validSelectedCategory.slice(1) : "Category"}`,
      font: { size: 16, family: "Pretendard, Arial, sans-serif" },
    },
    barmode: "stack" as const,
    xaxis: {
      title: { text: "Time" },
      tickangle: -45,
      font: { family: "Pretendard, Arial, sans-serif" },
    },
    yaxis: {
      title: { text: "Number of Passengers" },
      font: { family: "Pretendard, Arial, sans-serif" },
    },
    font: { family: "Pretendard, Arial, sans-serif" },
    margin: { l: 60, r: 60, t: 80, b: 100 },
    height: 500,
    showlegend: true, // ✅ 하나만 있어도 legend 강제 표시
    legend: {
      orientation: "h" as const,
      x: 0,
      y: -0.15,
      font: { family: "Pretendard, Arial, sans-serif" },
      traceorder: "normal" as const, // ✅ traces 순서대로 범례 표시
    },
    hoverlabel: {
      font: { family: "Pretendard, Arial, sans-serif" },
      bgcolor: "white",
      bordercolor: "hsl(var(--border))",
    },
  };

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
        {hasChartData ? (
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
