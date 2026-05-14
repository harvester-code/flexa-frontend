'use client';

import { useMemo, useState } from 'react';
import type { ScenarioData, HomeSummaryData, FacilityMetric } from '@/types/homeTypes';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { Clock, Timer, Building2, Plane, DollarSign, Users, UserCheck, Home, Hourglass, Gauge, Activity, Target } from 'lucide-react';
import { formatTimeTaken, formatUnit } from './HomeFormat';
import HomeChartGuard from './HomeChartGuard';
import HomeSummaryCard from './HomeSummaryCard';
import MissedPaxModal from './MissedPaxModal';
import { useMissedFlightsData } from '@/queries/homeQueries';

interface HomeSummaryProps {
  scenario: ScenarioData | null;
  percentile: number | null;
  data?: HomeSummaryData;
  isLoading?: boolean;
}

function HomeSummary({
  scenario,
  percentile,
  data,
  isLoading: propIsLoading,
}: HomeSummaryProps) {
  const summaryData = data;
  const isLoading = propIsLoading || false;

  const [missedModalOpen, setMissedModalOpen] = useState(false);
  const { data: missedFlightsData, isLoading: isMissedLoading } = useMissedFlightsData({
    scenarioId: scenario?.scenario_id,
    enabled: missedModalOpen,
  });

  const waitTimeChartData = useMemo(() => {
    if (!summaryData?.pax_experience?.waiting_time) return [];

    const processes = summaryData.pax_experience.waiting_time;
    const queueLengths = summaryData.pax_experience.queue_length ?? {};
    const GRAY_COLOR = '#9ca3af';
    const PRIMARY_COLOR_SCALES = ['#6b46c1', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'];

    return Object.entries(processes).flatMap(([process, waitData], processIdx) => {
      const openSeconds = waitData.open_wait.hour * 3600 + waitData.open_wait.minute * 60 + waitData.open_wait.second;
      const queueSeconds = waitData.queue_wait.hour * 3600 + waitData.queue_wait.minute * 60 + waitData.queue_wait.second;
      const queuePax = queueLengths[process];
      const groupLabel = queuePax != null
        ? `${process} (${queuePax.toLocaleString()} Pax)`
        : process;

      return [
        {
          title: 'Pre-open',
          group: process,
          groupLabel,
          value: formatTimeTaken(waitData.open_wait, 'histogram'),
          width: openSeconds > 0 ? openSeconds : 0.001,
          color: GRAY_COLOR,
        },
        {
          title: 'In-service',
          group: process,
          groupLabel,
          value: formatTimeTaken(waitData.queue_wait, 'histogram'),
          width: queueSeconds > 0 ? queueSeconds : 0.001,
          color: PRIMARY_COLOR_SCALES[processIdx % PRIMARY_COLOR_SCALES.length],
        },
      ];
    });
  }, [summaryData]);

  const WAIT_TIME_LEGEND = [
    { color: '#9ca3af', label: 'Pre-open' },
    { color: '#7c3aed', label: 'In-service' },
  ];

  return (
    <HomeChartGuard scenario={scenario} isLoading={isLoading} data={summaryData}>
      <MissedPaxModal
        open={missedModalOpen}
        onClose={() => setMissedModalOpen(false)}
        data={missedFlightsData}
        isLoading={isMissedLoading}
        totalMissed={summaryData?.passenger_summary?.missed ?? 0}
      />

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
                  {formatUnit('pax', 'default', 'lg')}
                </>
              }
            />
            <HomeSummaryCard
              icon={UserCheck}
              title={<span>Completed</span>}
              value={
                <>
                  {summaryData.passenger_summary.completed.toLocaleString()}
                  {formatUnit('pax', 'default', 'lg')}
                </>
              }
            />
            <HomeSummaryCard
              icon={Home}
              title={<span>Missed Pax</span>}
              value={
                <>
                  {summaryData.passenger_summary.missed.toLocaleString()}
                  {formatUnit('pax', 'default', 'lg')}
                </>
              }
              valueClassName="text-2xl font-semibold text-destructive"
              onClick={() => setMissedModalOpen(true)}
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
              value={formatTimeTaken(summaryData.timeMetrics.open_wait, 'default', 'lg')}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>In-Service Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.queue_wait, 'default', 'lg')}
            />
            <HomeSummaryCard
              icon={Hourglass}
              title={<span>Total Wait Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.total_wait, 'default', 'lg')}
            />
            <HomeSummaryCard
              icon={Timer}
              title={<span>Proc. & Queueing Time</span>}
              value={formatTimeTaken(summaryData.timeMetrics.process_time, 'default', 'lg')}
            />
            <HomeSummaryCard
              icon={Building2}
              title={<span>Commercial Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.commercial_dwell_time, 'default', 'lg')}
            />
            <HomeSummaryCard
              icon={Plane}
              title={<span>Total Dwell Time</span>}
              value={formatTimeTaken(summaryData.dwellTimes.airport_dwell_time, 'default', 'lg')}
            />
          </div>
        </>
      )}

      {/* Efficiency 섹션 */}
      {summaryData?.facility_metrics && summaryData.facility_metrics.length > 0 && (
        <EfficiencySection metrics={summaryData.facility_metrics} />
      )}

      {/* Economic Impact 섹션 */}
      {summaryData?.economic_impact && (
        <EconomicImpactSection impact={summaryData.economic_impact} />
      )}

      {/* Pax Experience 섹션 */}
      <div className="mt-3 mb-1 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Pax Experience</div>
          <div className="text-xs text-default-500">Average wait time per process</div>
        </div>
        <div className="flex items-center gap-4">
          {WAIT_TIME_LEGEND.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm" style={{ background: item.color }} />
              <span className="text-xs text-default-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <TheHistogramChart chartData={waitTimeChartData} />
    </HomeChartGuard>
  );
}

/** Efficiency 섹션 (IIFE 제거하여 별도 컴포넌트로 추출) */
function EfficiencySection({ metrics }: { metrics: FacilityMetric[] }) {
  const totalMetrics = metrics.find((m) => m.process === 'total');
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
              {formatUnit('%', 'default', 'lg')}
            </>
          }
        />
        <HomeSummaryCard
          icon={Activity}
          title={<span>Workforce Effi.</span>}
          value={
            <>
              {(totalMetrics.utilization_rate * 100).toFixed(1)}
              {formatUnit('%', 'default', 'lg')}
            </>
          }
        />
        <HomeSummaryCard
          icon={Target}
          title={<span>Overall Effi.</span>}
          value={
            <>
              {(totalMetrics.total_rate * 100).toFixed(1)}
              {formatUnit('%', 'default', 'lg')}
            </>
          }
        />
      </div>
    </>
  );
}

/** Economic Impact 섹션 (IIFE 제거하여 별도 컴포넌트로 추출) */
function EconomicImpactSection({ impact }: { impact: NonNullable<HomeSummaryData['economic_impact']> }) {
  const ctx = impact.airport_context;
  const perCapitaData = ctx?.gdp_ppp_per_capita || ctx?.gdp_per_capita;

  return (
    <>
      <div className="mt-3 mb-2 flex items-center justify-between">
        <div className="text-lg font-semibold">Monetary Value of Time</div>
        {ctx && perCapitaData && (
          <div className="text-sm text-default-500">
            Based on GDP per Capita of {ctx.country_name} {perCapitaData.formatted} ({perCapitaData.year}) | Source: World Bank
          </div>
        )}
      </div>
      <div className="mb-0 grid grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
        <HomeSummaryCard
          icon={DollarSign}
          title={<span>Cost of Waiting</span>}
          value={
            <span className="text-2xl text-red-600">
              -<span className="text-base">USD</span> {Math.round(Math.abs(impact.total_wait_value)).toLocaleString()}
            </span>
          }
        />
        <HomeSummaryCard
          icon={DollarSign}
          title={<span>Cost of Proc. & Wait</span>}
          value={
            <span className="text-2xl text-red-600">
              -<span className="text-base">USD</span> {Math.round(Math.abs(impact.process_time_value)).toLocaleString()}
            </span>
          }
        />
        <HomeSummaryCard
          icon={DollarSign}
          title={<span>Value of Comm. Dwell Time</span>}
          value={
            <span className="text-2xl text-green-600">
              +<span className="text-base">USD</span> {Math.round(impact.commercial_dwell_value).toLocaleString()}
            </span>
          }
        />
      </div>
    </>
  );
}

export default HomeSummary;
