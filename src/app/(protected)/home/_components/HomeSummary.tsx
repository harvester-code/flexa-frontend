'use client';

import { useMemo, useState } from 'react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Clock, Timer, Building2, Plane, DollarSign, Users, UserCheck, Home, Hourglass, Gauge, Activity, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { capitalizeFirst, formatTimeTaken, formatUnit } from './HomeFormat';
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';
import HomeSummaryCard from './HomeSummaryCard';
import HomeTooltip from './HomeTooltip';

const CHART_OPTIONS: Option[] = [
  { label: 'Wait Time', value: 'waiting_time' },
  { label: 'Queue Pax', value: 'queue_length' },
];

interface HomeSummaryProps {
  scenario: ScenarioData | null;
  percentile: number | null;
  data?: any; // 배치 API에서 받은 summary 데이터
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeSummary({
  scenario,
  percentile,
  data,
  isLoading: propIsLoading,
}: HomeSummaryProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const summaryData = data;
  const isLoading = propIsLoading || false;

  const [selectedChartType, setSelectedChartType] = useState(CHART_OPTIONS[0].value);

  const waitTimeChartData = useMemo(() => {
    if (!summaryData?.pax_experience?.waiting_time) return [];

    const processes = summaryData.pax_experience.waiting_time;
    const GRAY_COLOR = '#9ca3af'; // gray-400 (Open Wait)
    const PRIMARY_COLOR_SCALES = ['#6b46c1', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];

    // 8칸으로 펼치기: 각 프로세스마다 open_wait, queue_wait 2개
    return Object.entries(processes).flatMap(([process, waitData]: [string, any], processIdx) => {
      const openSeconds = waitData.open_wait.hour * 3600 + waitData.open_wait.minute * 60 + waitData.open_wait.second;
      const queueSeconds = waitData.queue_wait.hour * 3600 + waitData.queue_wait.minute * 60 + waitData.queue_wait.second;

      return [
        {
          title: process,
          value: formatTimeTaken(waitData.open_wait, 'histogram'),
          width: openSeconds > 0 ? openSeconds : 0.001,
          color: GRAY_COLOR, // Open Wait는 회색
        },
        {
          title: process,
          value: formatTimeTaken(waitData.queue_wait, 'histogram'),
          width: queueSeconds > 0 ? queueSeconds : 0.001,
          color: PRIMARY_COLOR_SCALES[processIdx % PRIMARY_COLOR_SCALES.length], // Queue Wait는 보라색
        },
      ];
    });
  }, [summaryData]);

  const queueLengthChartData = useMemo(() => {
    if (!summaryData?.pax_experience?.queue_length) return [];

    const processes = summaryData.pax_experience.queue_length;
    const entries = Object.entries(processes as Record<string, number>);
    const allZero = entries.every(([, value]) => value === 0);

    return entries.map(([process, value]) => ({
      title: process,
      value: (
        <>
          {value.toLocaleString()}
          {formatUnit('pax', 'histogram')}
        </>
      ),
      width: value > 0 ? value : allZero ? 1 : 0.001,
    }));
  }, [summaryData]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!summaryData) {
    return <HomeNoData />;
  }

  return (
    <>
      {/* Throughputs 섹션 */}
      {summaryData?.passenger_summary && (
        <>
          <div className="mt-[14px] mb-2 text-lg font-semibold">Throughputs</div>
          <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
            <HomeSummaryCard
              icon={Users}
              title={<span>Passengers</span>}
              value={
                <>
                  {summaryData.passenger_summary.total.toLocaleString()}
                  {formatUnit('pax')}
                </>
              }
            />
            <HomeSummaryCard
              icon={UserCheck}
              title={<span>Completed</span>}
              value={
                <>
                  {summaryData.passenger_summary.completed.toLocaleString()}
                  {formatUnit('pax')}
                </>
              }
            />
            <HomeSummaryCard
              icon={Home}
              title={<span>Missed Pax</span>}
              value={
                <>
                  {summaryData.passenger_summary.missed.toLocaleString()}
                  {formatUnit('pax')}
                </>
              }
            />
          </div>
        </>
      )}

      {/* Time & Delay 섹션 */}
      {summaryData?.timeMetrics && summaryData?.dwellTimes && (
        <>
          <div className="mt-3 mb-2 flex items-center gap-2 text-lg font-semibold">
            Time & Delay
            <span className="inline-flex h-5 items-center rounded border border-primary bg-primary px-2 text-xs font-medium text-primary-foreground">
              {percentile ? `Top ${percentile}%` : 'Mean'}
            </span>
          </div>
          <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
            <HomeSummaryCard
              icon={Clock}
              title={<span>Pre-Open Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.open_wait)}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>In-Service Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.queue_wait)}
            />
            <HomeSummaryCard
              icon={Hourglass}
              title={<span>Total Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.total_wait)}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>Proc. & Queueing Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.process_time)}
            />
            <HomeSummaryCard
              icon={Building2}
              title={<span>Commercial Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.commercial_dwell_time)}
            />
            <HomeSummaryCard
              icon={Plane}
              title={<span>Total Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.airport_dwell_time)}
            />
          </div>
        </>
      )}

      {/* Efficiency 섹션 */}
      {summaryData?.facility_metrics && summaryData.facility_metrics.length > 0 && (() => {
        // "total" process만 찾기
        const totalMetrics = summaryData.facility_metrics.find((m: any) => m.process === 'total');
        if (!totalMetrics) return null;

        return (
          <>
            <div className="mt-3 mb-2 text-lg font-semibold">Efficiency</div>
            <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
              <HomeSummaryCard
                icon={Gauge}
                title={<span>Facility Effi.</span>}
                value={
                  <>
                    {(totalMetrics.operating_rate * 100).toFixed(1)}
                    {formatUnit('%')}
                  </>
                }
              />
              <HomeSummaryCard
                icon={Activity}
                title={<span>Workforce Effi.</span>}
                value={
                  <>
                    {(totalMetrics.utilization_rate * 100).toFixed(1)}
                    {formatUnit('%')}
                  </>
                }
              />
              <HomeSummaryCard
                icon={Target}
                title={<span>Overall Effi.</span>}
                value={
                  <>
                    {(totalMetrics.total_rate * 100).toFixed(1)}
                    {formatUnit('%')}
                  </>
                }
              />
            </div>
          </>
        );
      })()}

      {/* Economic Impact 섹션 */}
      {summaryData?.economic_impact && (
        <>
          <div className="mt-3 mb-2 flex items-center justify-between">
            <div className="text-lg font-semibold">Monetary Value of Time</div>
            {summaryData.economic_impact.airport_context && (() => {
              const ctx = summaryData.economic_impact.airport_context;
              const gdpData = ctx.gdp_ppp || ctx.gdp;
              const gdpType = ctx.gdp_ppp ? 'GDP PPP' : 'GDP';

              return (
                <div className="text-xs text-default-500">
                  Based on {ctx.country_name} {gdpType} {gdpData?.formatted} ({gdpData?.year}) | Source: World Bank
                </div>
              );
            })()}
          </div>
          <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Cost of Waiting</span>}
              value={
                <span className="text-lg text-red-600">
                  -<span className="text-xs">USD</span> {Math.round(Math.abs(summaryData.economic_impact.total_wait_value)).toLocaleString()}
                </span>
              }
            />
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Cost of Proc. & Wait</span>}
              value={
                <span className="text-lg text-red-600">
                  -<span className="text-xs">USD</span> {Math.round(Math.abs(summaryData.economic_impact.process_time_value)).toLocaleString()}
                </span>
              }
            />
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Value of Comm. Dwell Time</span>}
              value={
                <span className="text-lg text-green-600">
                  +<span className="text-xs">USD</span> {Math.round(summaryData.economic_impact.commercial_dwell_value).toLocaleString()}
                </span>
              }
            />
          </div>
        </>
      )}

      {/* Pax Experience 섹션 */}
      <div className="mt-3 mb-2 flex items-center justify-between">
        <div className="text-lg font-semibold">Pax Experience</div>
        <ToggleButtonGroup
          options={CHART_OPTIONS}
          selectedValue={selectedChartType}
          onSelect={(opt) => setSelectedChartType(opt.value)}
          labelExtractor={(opt) => opt.label}
        />
      </div>
      <TheHistogramChart chartData={selectedChartType === 'waiting_time' ? waitTimeChartData : queueLengthChartData} />
    </>
  );
}

export default HomeSummary;
