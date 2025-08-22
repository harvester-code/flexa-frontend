'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { PassengerShowUpResponse } from '@/types/simulationTypes';
import { CHART_COLOR_PALETTE } from '@/components/charts/colors';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useScenarioStore } from '../../_store/useScenarioStore';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

interface TabPassengerScheduleResultProps {
  data?: PassengerShowUpResponse; // optional로 변경 (zustand에서 가져올 수 있도록)
}

export default function TabPassengerScheduleResult({ data: propData }: TabPassengerScheduleResultProps) {
  // zustand store에서 API 응답 데이터 가져오기
  const { apiResponseData } = useScenarioStore(
    useShallow((s) => ({
      apiResponseData: s.passengerSchedule.apiResponseData,
    }))
  );

  // props로 받은 데이터가 있으면 그것을 우선 사용, 없으면 zustand store에서 가져온 데이터 사용
  const data = propData || apiResponseData;

  // 데이터가 없으면 렌더링하지 않음
  if (!data) return null;
  const [selectedCategory, setSelectedCategory] = useState<string>('airline');

  // 사용 가능한 카테고리 목록
  const categories = Object.keys(data.bar_chart_y_data);

  // Plotly용 데이터 변환
  const { plotlyData, xAxisLabels } = useMemo(() => {
    if (!data.bar_chart_y_data[selectedCategory]) return { plotlyData: [], xAxisLabels: [] };

    const categoryData = data.bar_chart_y_data[selectedCategory];

    // X축 라벨 변환
    const xLabels = data.bar_chart_x_data.map((timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    });

    // Plotly traces 생성
    const traces = categoryData.map((series, index) => ({
      name: series.name,
      x: xLabels,
      y: series.y,
      type: 'bar' as const,
      marker: {
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      },
      hovertemplate: '<b>%{fullData.name}</b><br>' + 'Time: %{x}<br>' + 'Passengers: %{y:,}<br>' + '<extra></extra>',
    }));

    return { plotlyData: traces, xAxisLabels: xLabels };
  }, [data, selectedCategory]);

  // Plotly 레이아웃 설정
  const layout = {
    title: {
      text: `Passenger Arrival Distribution by ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`,
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
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: -0.15,
      font: { family: 'Pretendard, Arial, sans-serif' },
    },
    hoverlabel: {
      font: { family: 'Pretendard, Arial, sans-serif' },
      bgcolor: 'white',
      bordercolor: '#ccc',
    },
  };

  const config = {
    displayModeBar: true,
    responsive: true,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Passenger Show-up Chart - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </CardTitle>
              <p className="text-sm text-gray-600">Visual representation of passenger arrival data</p>
            </div>
          </div>
          <div className="rounded-lg bg-gray-100 px-3 py-2">
            <span className="text-sm font-medium text-gray-600">Total Passengers: </span>
            <span className="text-lg font-bold text-primary">{data.total.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.summary.flights.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Flights</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.summary.avg_seats}</div>
            <div className="text-sm text-gray-600">Avg Seats</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.summary.load_factor}%</div>
            <div className="text-sm text-gray-600">Load Factor</div>
          </div>
        </div>

        {/* Category Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-4">
            {plotlyData.map((trace, index) => (
              <div key={trace.name} className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                />
                <span className="text-sm text-gray-700">{trace.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="w-full" style={{ height: '500px' }}>
          <BarChart chartData={plotlyData} chartLayout={layout} config={config} />
        </div>
      </CardContent>
    </Card>
  );
}
