'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SimulationLoading from '../../_components/SimulationLoading';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

interface TabFlightScheduleChartProps {
  loadingFlightSchedule: boolean;
  chartData: any;
  loadError: boolean;
}

function TabFlightScheduleChart({ loadingFlightSchedule, chartData, loadError }: TabFlightScheduleChartProps) {
  // 로딩 중일 때
  if (loadingFlightSchedule) {
    return <SimulationLoading minHeight="min-h-[200px]" />;
  }

  // 차트 데이터 존재 여부 확인
  const hasChartData = chartData && chartData.data && Object.keys(chartData.data).length > 0;
  const totalFlights = chartData?.total || 0;

  // 차트 데이터가 있을 때 (total 조건 제거)
  if (hasChartData) {
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
                  <div className="text-lg font-bold text-gray-900">Flight Schedule Chart</div>
                  <p className="text-sm font-normal text-gray-600">Visual representation of flight data</p>
                </div>
              </CardTitle>
              <Badge variant="secondary">Total Flights: {totalFlights}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart
              chartData={
                Object.keys(chartData?.data || {}).length > 0
                  ? [...(chartData?.data?.[Object.keys(chartData?.data)[0]] || [])]
                      .sort((a, b) => b.order - a.order)
                      .map((item) => {
                        return {
                          x: chartData?.x,
                          y: item.y,
                          name: item.name,
                          type: 'bar',
                          marker: { opacity: 1, cornerradius: 7 },
                          hovertemplate: item.y?.map((val) => `[%{x}] ${val}`),
                        };
                      })
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

  // 로드 에러가 있을 때
  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 text-lg font-medium">Unable to load data</div>
            <div className="mb-6 text-sm">Please check the airport name or date and re-enter the information</div>
            <div className="flex gap-2">
              <Button variant="outline">Clear Search</Button>
              <Button variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Inquire About Data Access
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // 데이터가 없을 때는 아무것도 표시하지 않음
  return null;
}

export default React.memo(TabFlightScheduleChart);
