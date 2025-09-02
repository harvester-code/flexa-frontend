'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { CHART_COLOR_PALETTE } from '@/components/charts/colors';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

interface FlightScheduleChartData {
  total: number;
  chart_x_data: string[];
  chart_y_data: {
    [category: string]: Array<{
      name: string;
      order: number;
      y: number[];
      acc_y?: number[];
    }>;
  };
}

interface TabFlightScheduleResultProps {
  data: FlightScheduleChartData;
}

export default function TabFlightScheduleResult({ data }: TabFlightScheduleResultProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('airline');

  // 사용 가능한 카테고리 목록
  const categories = Object.keys(data.chart_y_data);

  // Plotly용 데이터 변환
  const { plotlyData, xAxisLabels } = useMemo(() => {
    if (!data.chart_y_data[selectedCategory]) return { plotlyData: [], xAxisLabels: [] };

    const categoryData = data.chart_y_data[selectedCategory];
    const xLabels = data.chart_x_data;

    // ✅ 항공사별 총 운항횟수 기준으로 내림차순 정렬
    const sortedCategoryData = [...categoryData].sort((a, b) => {
      const totalFlightsA = a.y.reduce((sum: number, flights: number) => sum + flights, 0);
      const totalFlightsB = b.y.reduce((sum: number, flights: number) => sum + flights, 0);
      return totalFlightsB - totalFlightsA; // 내림차순 (많은 것부터)
    });

    // Plotly traces 생성 (정렬된 순서로)
    const traces = sortedCategoryData.map((series, index) => ({
      name: series.name,
      x: xLabels,
      y: series.y,
      type: 'bar' as const,
      marker: {
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      },
      hovertemplate: '<b>%{fullData.name}</b><br>' + 'Time: %{x}<br>' + 'Flights: %{y}<br>' + '<extra></extra>',
    }));

    return { plotlyData: traces, xAxisLabels: xLabels };
  }, [data, selectedCategory]);

  // Plotly 레이아웃 설정
  const layout = {
    title: {
      text: `Flight Schedule Distribution by ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`,
      font: { size: 16, family: 'Pretendard, Arial, sans-serif' },
    },
    barmode: 'stack' as const,
    xaxis: {
      title: { text: 'Time' },
      tickangle: -45,
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    yaxis: {
      title: { text: 'Number of Flights' },
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    font: { family: 'Pretendard, Arial, sans-serif' },
    margin: { l: 60, r: 60, t: 80, b: 100 },
    height: 500,
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-default-900">
              Flight Schedule Chart - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </CardTitle>
            <p className="text-sm text-default-500">Visual representation of flight schedule data</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Total Flights and Category Selector in one row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-default-600 text-sm">Total Flights: </span>
            <span className="text-sm font-medium text-default-900">{data.total.toLocaleString()}</span>
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
