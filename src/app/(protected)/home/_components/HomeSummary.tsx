'use client';

import { useMemo, useState } from 'react';
import { Option } from '@/types/homeTypes';
import { ScenarioData } from '@/types/homeTypes';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import {
  NavIcon01,
  NavIcon02,
  PassengerQueue,
  PassengerThroughput,
  RatioIcon01,
  RatioIcon02,
  RatioIcon03,
  WaitTime,
} from '@/components/icons';
import { Clock, Timer, Building2, Plane, DollarSign } from 'lucide-react';
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
              icon={PassengerThroughput}
              title={<span>Passengers</span>}
              value={
                <>
                  {summaryData.passenger_summary.total.toLocaleString()}
                  {formatUnit('pax')}
                </>
              }
            />
            <HomeSummaryCard
              icon={PassengerQueue}
              title={<span>Completed</span>}
              value={
                <>
                  {summaryData.passenger_summary.completed.toLocaleString()}
                  {formatUnit('pax')}
                </>
              }
            />
            <HomeSummaryCard
              icon={NavIcon01}
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

      {/* Pax Experience를 KPI 카드보다 위로 이동 */}
      <div className="my-[14px] rounded border border-input px-5 py-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Pax Experience</div>
          <ToggleButtonGroup
            options={CHART_OPTIONS}
            selectedValue={selectedChartType}
            onSelect={(opt) => setSelectedChartType(opt.value)}
            labelExtractor={(opt) => opt.label}
          />
        </div>
        <TheHistogramChart chartData={selectedChartType === 'waiting_time' ? waitTimeChartData : queueLengthChartData} />
      </div>

      {/* KPI 카드 - 모든 메트릭을 하나의 그리드에 표시 */}
      <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
        <HomeSummaryCard
          icon={PassengerThroughput}
          title={<span>Pax Throughput</span>}
          value={
            <>
              {summaryData?.throughput.toLocaleString()}
              {formatUnit('pax')}
            </>
          }
        />

        <HomeSummaryCard
          icon={WaitTime}
          title={<span>Wait Time</span>}
          value={formatTimeTaken(summaryData?.waiting_time?.total)}
          kpiType={percentile ? 'top' : 'mean'}
          percentile={percentile ?? undefined}
        />

        <HomeSummaryCard
          icon={PassengerQueue}
          title={<span>Queue Pax</span>}
          value={
            <>
              {summaryData?.queue_length.toLocaleString()}
              {formatUnit('pax')}
            </>
          }
          kpiType={percentile ? 'top' : 'mean'}
          percentile={percentile ?? undefined}
        />

        <HomeSummaryCard
          icon={RatioIcon01}
          title={
            <span className="flex items-center">
              Activated / Installed Ratio (A/I Ratio)
              <HomeTooltip content="The ratio of activated capacity to total installed capacity.">
                <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
              </HomeTooltip>
            </span>
          }
          value={
            <>
              {Math.round(Number(summaryData?.facility_utilization))}
              {formatUnit('%')}
            </>
          }
        />

        <HomeSummaryCard
          icon={RatioIcon02}
          title={
            <span className="flex items-center">
              Processed / Activated Ratio (P/A Ratio)
              <HomeTooltip content="The ratio of processed capacity to activated capacity.">
                <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
              </HomeTooltip>
            </span>
          }
          value={
            <>
              {Math.round(Number(summaryData?.processed_per_activated))}
              {formatUnit('%')}
            </>
          }
        />

        <HomeSummaryCard
          icon={RatioIcon03}
          title={
            <span className="flex items-center">
              Processed / Installed Ratio (P/I Ratio)
              <HomeTooltip content="The ratio of processed capacity to total installed capacity.">
                <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
              </HomeTooltip>
            </span>
          }
          value={
            <>
              {Math.round(Number(summaryData?.processed_per_installed))}
              {formatUnit('%')}
            </>
          }
        />

      </div>

      {/* Time & Delay 섹션 */}
      {summaryData?.timeMetrics && summaryData?.dwellTimes && (
        <>
          <div className="mt-3 mb-2 text-lg font-semibold">Time & Delay</div>
          <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
            <HomeSummaryCard
              icon={Clock}
              title={<span>Pre-Open Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.open_wait)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>In-Service Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.queue_wait)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
            />
            <HomeSummaryCard
              icon={WaitTime}
              title={<span>Total Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.total_wait)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>Proc. & Queueing Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.process_time)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
            />
            <HomeSummaryCard
              icon={Building2}
              title={<span>Commercial Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.commercial_dwell_time)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
            />
            <HomeSummaryCard
              icon={Plane}
              title={<span>Total Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.airport_dwell_time)}
              kpiType={percentile ? 'top' : 'mean'}
              percentile={percentile ?? undefined}
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
                icon={RatioIcon01}
                title={<span>Facility Effi.</span>}
                value={
                  <>
                    {(totalMetrics.operating_rate * 100).toFixed(2)}
                    {formatUnit('%')}
                  </>
                }
              />
              <HomeSummaryCard
                icon={RatioIcon02}
                title={<span>Workforce Effi.</span>}
                value={
                  <>
                    {(totalMetrics.utilization_rate * 100).toFixed(2)}
                    {formatUnit('%')}
                  </>
                }
              />
              <HomeSummaryCard
                icon={RatioIcon03}
                title={<span>Overall Effi.</span>}
                value={
                  <>
                    {(totalMetrics.total_rate * 100).toFixed(2)}
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
          <div className="mt-3 mb-2 text-lg font-semibold">Monetary Value of Time</div>
          <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Cost of Waiting</span>}
              value={
                <span className="text-red-600">
                  -${Math.abs(summaryData.economic_impact.total_wait_value).toLocaleString()}
                </span>
              }
            />
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Cost of Proc. & Wait</span>}
              value={
                <span className="text-red-600">
                  -${Math.abs(summaryData.economic_impact.process_time_value).toLocaleString()}
                </span>
              }
            />
            <HomeSummaryCard
              icon={DollarSign}
              title={<span>Value of Comm. Dwell Time</span>}
              value={
                <span className="text-green-600">
                  USD {summaryData.economic_impact.commercial_dwell_value.toLocaleString()}
                </span>
              }
            />
          </div>
        </>
      )}
    </>
  );
}

export default HomeSummary;
