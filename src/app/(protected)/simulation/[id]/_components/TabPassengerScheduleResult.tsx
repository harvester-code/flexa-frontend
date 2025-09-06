'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { CHART_COLOR_PALETTE } from '@/components/charts/colors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSimulationStore } from '../_stores';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

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
export default function TabPassengerScheduleResult() {
  const [selectedCategory, setSelectedCategory] = useState<string>('airline');

  // 🎯 Zustand에서 직접 데이터 가져오기
  const passengerChartResult = useSimulationStore((s) => s.passenger.chartResult);

  // 🔧 모든 Hook을 조건부 return 이전에 호출 (Rules of Hooks 준수)
  const categories = passengerChartResult?.chart_y_data ? Object.keys(passengerChartResult.chart_y_data) : [];
  const validSelectedCategory = categories.includes(selectedCategory) ? selectedCategory : categories[0];

  // Plotly용 데이터 변환 (조건부 return 이전에 호출)
  const { plotlyData, xAxisLabels } = useMemo(() => {
    if (!passengerChartResult?.chart_y_data?.[validSelectedCategory] || !passengerChartResult?.chart_x_data) {
      return { plotlyData: [], xAxisLabels: [] };
    }

    const categoryData = passengerChartResult.chart_y_data[validSelectedCategory];
    const xLabels = passengerChartResult.chart_x_data;

    // ✅ 승객 수 기준으로 내림차순 정렬
    const sortedCategoryData = [...categoryData].sort((a, b) => {
      const totalPassengersA = a.y.reduce((sum: number, passengers: number) => sum + passengers, 0);
      const totalPassengersB = b.y.reduce((sum: number, passengers: number) => sum + passengers, 0);
      return totalPassengersB - totalPassengersA; // 내림차순 (많은 것부터)
    });

    // Plotly traces 생성 (정렬된 순서로)
    const traces = sortedCategoryData.map((series, index) => ({
      name: series.name,
      x: xLabels,
      y: series.y,
      type: 'bar' as const,
      showlegend: true, // ✅ 하나만 있어도 legend 표시
      marker: {
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      },
      hovertemplate: '<b>%{fullData.name}</b><br>' + 'Time: %{x}<br>' + 'Passengers: %{y}<br>' + '<extra></extra>',
    }));

    return { plotlyData: traces, xAxisLabels: xLabels };
  }, [passengerChartResult, validSelectedCategory]);

  // 🔍 디버그 로그 (데이터가 있을 때만 출력)
  if (passengerChartResult) {
    console.log('🎨 TabPassengerScheduleResult render check:', {
      hasData: !!passengerChartResult,
      dataKeys: Object.keys(passengerChartResult),
      hasChartXData: !!passengerChartResult?.chart_x_data,
      hasChartYData: !!passengerChartResult?.chart_y_data,
      chartXDataLength: passengerChartResult?.chart_x_data?.length,
      chartYDataKeys: passengerChartResult?.chart_y_data
        ? Object.keys(passengerChartResult.chart_y_data)
        : 'no chart_y_data',
    });
  }

  // ✅ 모든 Hook 호출 후 조건부 return (Rules of Hooks 준수)
  if (!passengerChartResult || !passengerChartResult.chart_y_data || !passengerChartResult.chart_x_data) {
    // 🔇 불필요한 로그 제거 (부모에서 조건부 렌더링으로 처리됨)
    return null;
  }

  // 카테고리가 없으면 렌더링하지 않음
  if (categories.length === 0) {
    return null;
  }

  // Plotly 레이아웃 설정
  const layout = {
    title: {
      text: `Passenger Show-up Distribution by ${validSelectedCategory.charAt(0).toUpperCase() + validSelectedCategory.slice(1)}`,
      font: { size: 16, family: 'Pretendard, Arial, sans-serif' },
    },
    barmode: 'stack' as const,
    xaxis: {
      title: { text: 'Time' },
      tickangle: -45,
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    yaxis: {
      title: { text: 'Number of Passengers' },
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    font: { family: 'Pretendard, Arial, sans-serif' },
    margin: { l: 60, r: 60, t: 80, b: 100 },
    height: 500,
    showlegend: true, // ✅ 하나만 있어도 legend 강제 표시
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: -0.15,
      font: { family: 'Pretendard, Arial, sans-serif' },
      traceorder: 'normal' as const, // ✅ traces 순서대로 범례 표시
    },
    hoverlabel: {
      font: { family: 'Pretendard, Arial, sans-serif' },
      bgcolor: 'white',
      bordercolor: 'hsl(var(--border))',
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
            <CardTitle className="text-lg font-semibold text-default-900">Passenger Schedule Chart</CardTitle>
            <p className="text-sm text-default-500">Visual representation of passenger show-up time data</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Total Passengers and Category Selector in one row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <div>
              <span className="text-default-600 text-sm">Total Passengers: </span>
              <span className="text-sm font-medium text-default-900">
                {passengerChartResult.total.toLocaleString()}
              </span>
            </div>
            {passengerChartResult.summary && (
              <div className="text-default-600 flex gap-4 text-sm">
                <span>
                  Flights: <span className="font-medium text-default-900">{passengerChartResult.summary.flights}</span>
                </span>
                <span>
                  Load Factor:{' '}
                  <span className="font-medium text-default-900">{passengerChartResult.summary.load_factor}%</span>
                </span>
                <span>
                  Avg Seats:{' '}
                  <span className="font-medium text-default-900">{passengerChartResult.summary.avg_seats}</span>
                </span>
              </div>
            )}
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chart */}
        <div className="w-full" style={{ height: '500px' }}>
          <BarChart chartData={plotlyData} chartLayout={layout} config={config} />
        </div>
      </CardContent>
    </Card>
  );
}
