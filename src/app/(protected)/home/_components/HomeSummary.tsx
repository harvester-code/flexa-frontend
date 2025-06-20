'use client';

import { JSX, ReactNode, useEffect, useMemo, useState } from 'react';
import { Option } from '@/types/commons';
import { ScenarioData } from '@/types/simulations';
import { useSummaries } from '@/queries/homeQueries';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import {
  PassengerQueue,
  PassengerThroughput,
  RatioIcon01,
  RatioIcon02,
  RatioIcon03,
  WaitTime,
} from '@/components/icons';
import { Button, ButtonGroup } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import HomeErrors from './HomeErrors';
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
  calculate_type: string;
  percentile: number | null;
}

function HomeSummary({ scenario, calculate_type, percentile }: HomeSummaryProps) {
  const {
    data: summaryData,
    isLoading,
    isError,
  } = useSummaries({ calculate_type, percentile, scenarioId: scenario?.id });

  const [selectedChartType, setSelectedChartType] = useState(CHART_OPTIONS[0].value);

  const chartData = useMemo(() => {
    if (!summaryData?.pax_experience) return [];

    const processes = summaryData.pax_experience[selectedChartType];

    if (selectedChartType === 'waiting_time') {
      const entries = Object.entries(processes as Record<string, { hour: number; minute: number; second: number }>);
      const allZero = entries.every(([, value]) => value.hour === 0 && value.minute === 0 && value.second === 0);

      return entries.map(([process, value]) => {
        const seconds = value.hour * 60 * 60 + value.minute * 60 + value.second;
        return {
          title: process,
          value: formatTimeTaken(value),
          width: seconds > 0 ? seconds : allZero ? 1 : 0.001,
        };
      });
    }

    const entries = Object.entries(processes as Record<string, number>);
    const allZero = entries.every(([, value]) => value === 0);
    return entries.map(([process, value]) => {
      return {
        title: process,
        value: (
          <>
            {value.toLocaleString()}
            {formatUnit('pax')}
          </>
        ),
        width: value > 0 ? value : allZero ? 1 : 0.001,
      };
    });
  }, [selectedChartType, summaryData]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (isError) {
    return <HomeErrors />;
  }

  if (!summaryData) {
    return <HomeNoData />;
  }

  return (
    <>
      <div className="my-[14px] grid grid-cols-3 grid-rows-2 gap-3 overflow-auto">
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
          value={formatTimeTaken(summaryData?.waiting_time)}
          kpiType={calculate_type === 'mean' ? 'mean' : calculate_type === 'topN' ? 'topN' : undefined}
          percentile={calculate_type === 'topN' ? (percentile ?? undefined) : undefined}
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
          kpiType={calculate_type === 'mean' ? 'mean' : calculate_type === 'topN' ? 'topN' : undefined}
          percentile={calculate_type === 'topN' ? (percentile ?? undefined) : undefined}
        />
        <HomeSummaryCard
          icon={RatioIcon01}
          title={
            <span className="flex items-center">
              Activated / Installed Ratio (AIR)
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
              Processed / Activated Ratio (PAR)
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
              Processed / Installed Ratio (PIR)
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

      <div className="rounded border border-default-200 px-4 py-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xl font-semibold">Pax Experience</div>
          <ButtonGroup>
            {CHART_OPTIONS.map((opt) => (
              <Button
                className={cn(
                  selectedChartType === opt.value
                    ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                    : ''
                )}
                variant="outline"
                key={opt.value}
                onClick={() => setSelectedChartType(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <TheHistogramChart chartData={chartData} />
      </div>
    </>
  );
}

export default HomeSummary;
