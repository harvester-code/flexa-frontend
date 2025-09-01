'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { CHART_COLOR_PALETTE } from '@/components/charts/colors';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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

  // Summary 통계 계산
  const summary = useMemo(() => {
    const chartData = data.chart_y_data[selectedCategory] || [];

    // 피크 시간대 계산 (가장 많은 항공편이 있는 시간)
    let maxFlights = 0;
    let peakHourIndex = 0;

    if (chartData.length > 0) {
      const totalByHour = chartData[0].y.map((_, hourIndex) =>
        chartData.reduce((sum, series) => sum + (series.y[hourIndex] || 0), 0)
      );

      maxFlights = Math.max(...totalByHour);
      peakHourIndex = totalByHour.indexOf(maxFlights);
    }

    const peakHour = data.chart_x_data[peakHourIndex] || '00:00';
    const totalAirlines = selectedCategory === 'airline' ? chartData.length : data.chart_y_data.airline?.length || 0;

    return {
      flights: data.total,
      peak_hour: peakHour,
      airlines: totalAirlines,
    };
  }, [data, selectedCategory]);

  // Plotly용 데이터 변환
  const { plotlyData, xAxisLabels } = useMemo(() => {
    if (!data.chart_y_data[selectedCategory]) return { plotlyData: [], xAxisLabels: [] };

    const categoryData = data.chart_y_data[selectedCategory];
    const xLabels = data.chart_x_data;

    // Plotly traces 생성
    const traces = categoryData.map((series, index) => ({
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
        <div className="flex items-center justify-between">
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
          <div className="rounded-lg bg-gray-100 px-3 py-2">
            <span className="text-sm font-medium text-default-500">Total Flights: </span>
            <span className="text-lg font-semibold text-primary">{data.total.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold text-default-900">{summary.flights.toLocaleString()}</div>
            <div className="text-sm text-default-500">Total Flights</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold text-default-900">{summary.peak_hour}</div>
            <div className="text-sm text-default-500">Peak Hour</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold text-default-900">{summary.airlines}</div>
            <div className="text-sm text-default-500">Airlines</div>
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
                    : 'border-gray-300 text-default-900 hover:bg-gray-50'
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
                  style={{ backgroundColor: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] }}
                />
                <span className="text-sm text-default-900">{trace.name}</span>
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
