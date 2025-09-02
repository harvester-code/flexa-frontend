'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SimulationLoading from '../../_components/SimulationLoading';
import { useSimulationStore } from '../_stores';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

function TabFlightScheduleChart() {
  // 🆕 1원칙: 통합 store에서만 데이터 가져오기
  const chartData = useSimulationStore((state) => state.flight.appliedFilterResult);

  // 차트 데이터가 없으면 렌더링 안함
  if (!chartData) return null;

  const totalFlights = chartData.total || 0;
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold text-default-900">Flight Schedule Chart</div>
                <p className="text-sm font-normal text-default-500">Visual representation of flight data</p>
              </div>
            </CardTitle>
            <Badge variant="secondary">Total Flights: {totalFlights}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart
            chartData={
              chartData?.chart_y_data?.airline
                ? [...chartData.chart_y_data.airline]
                    .sort((a, b) => a.order - b.order)
                    .map((item) => ({
                      x: chartData.chart_x_data,
                      y: item.y,
                      name: item.name,
                      type: 'bar',
                      marker: { opacity: 1, cornerradius: 7 },
                      hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                    }))
                : []
            }
            chartLayout={{
              barmode: 'stack',
              margin: { l: 30, r: 10, t: 0, b: 30 },
              legend: { x: 1, y: 1.2, xanchor: 'right', yanchor: 'top', orientation: 'h' },
              bargap: 0.4,
            }}
            config={{ displayModeBar: false }}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default React.memo(TabFlightScheduleChart);
