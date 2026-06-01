'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { COMPONENT_TYPICAL_COLORS } from '@/styles/colors';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSimulationStore } from '../../_stores';
import SimulationCardHeader from '../SimulationCardHeader';

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

// Props 제거 - Zustand에서 직접 데이터 가져오기
export default function FlightResultChart() {
  const [selectedCategory, setSelectedCategory] = useState<string>('airline');

  // 🎯 Zustand에서 직접 데이터 가져오기
  const appliedFilterResult = useSimulationStore((s) => s.flight.appliedFilterResult);
  const chartYData = useMemo(
    () => appliedFilterResult?.chart_y_data ?? {},
    [appliedFilterResult?.chart_y_data]
  );
  const chartXData = useMemo(
    () => appliedFilterResult?.chart_x_data ?? [],
    [appliedFilterResult?.chart_x_data]
  );

  // Plotly용 데이터 변환
  const { plotlyData, xAxisLabels } = useMemo(() => {
    const categoryData = chartYData[selectedCategory];
    if (!categoryData) {
      return { plotlyData: [], xAxisLabels: [] };
    }

    const xLabels = chartXData;

    // ✅ 항공사별 총 운항횟수 기준으로 내림차순 정렬 (ETC는 항상 마지막)
    const sortedCategoryData = [...categoryData].sort((a, b) => {
      // ETC는 항상 마지막에 위치
      if (a.name === 'ETC') return 1;
      if (b.name === 'ETC') return -1;

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
      showlegend: true, // ✅ 하나만 있어도 legend 표시
      marker: {
        // ETC는 회색으로, 나머지는 컬러 팔레트 사용
        color: series.name === 'ETC'
          ? '#9CA3AF' // gray-400 색상
          : COMPONENT_TYPICAL_COLORS[index % COMPONENT_TYPICAL_COLORS.length],
      },
      hovertemplate: '<b>%{fullData.name}</b><br>' + 'Time: %{x}<br>' + 'Flights: %{y}<br>' + '<extra></extra>',
    }));

    return { plotlyData: traces, xAxisLabels: xLabels };
  }, [chartYData, chartXData, selectedCategory]);

  // Plotly 레이아웃 설정
  const layout = useMemo(() => ({
    title: {
      text: `Flights by ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} and Time`,
      font: { size: 16, family: 'Pretendard, Arial, sans-serif' },
    },
    barmode: 'stack' as const,
    xaxis: {
      title: { text: 'Time' },
      tickangle: -45,
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    yaxis: {
      title: { text: 'Flights' },
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
  }), [selectedCategory]);

  const config = {
    displayModeBar: true,
    responsive: true,
  };

  if (!appliedFilterResult) {
    return null;
  }

  // 사용 가능한 카테고리 목록
  const categories = Object.keys(chartYData);

  return (
    <Card>
      <SimulationCardHeader
        icon={BarChart3}
        title={`Flight Schedule by ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
        description="Visual overview of flight schedules"
      />

      <CardContent>
        {/* Total Flights and Category Selector in one row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-default-600 text-sm">Total Flights: </span>
            <span className="text-sm font-medium text-default-900">{appliedFilterResult.total.toLocaleString()}</span>
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
