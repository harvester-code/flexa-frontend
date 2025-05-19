'use client';

import { useEffect, useState } from 'react';
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
import HomeLoading from './HomeLoading';
import HomeNoData from './HomeNoData';
import HomeNoScenario from './HomeNoScenario';
import HomeSummaryCard from './HomeSummaryCard';

// const TOOLTIP_MAP = {
//   'Passenger Throughput': 'The number of all passengers processed in a day',
//   'Wait Time': 'Average (or top n%) wait time experienced by passengers across all checkpoints',
//   'Queue Pax': 'Average (or top n%) queue experienced by passengers across all checkpoints',
//   'Facility Utilization': 'Percentage of time during the day that the facility is operational',
// };

const CHART_OPTIONS2: Option[] = [
  { label: 'Wait Time', value: 'waiting_time' },
  { label: 'Queue Pax', value: 'queue_length' },
];

interface HomeSummaryProps {
  scenario: ScenarioData | null;
  calculate_type: string;
  percentile: number | null;
}

function HomeSummary({ scenario, calculate_type, percentile }: HomeSummaryProps) {
  const { data: summaries, isLoading } = useSummaries({ calculate_type, percentile, scenarioId: scenario?.id });

  const [chartData, setChartData] = useState<
    {
      title: string;
      value: string;
      width: number;
    }[]
  >([]);

  // FIXME: 하드코딩 제거하기
  const [chartOption2, setChartOption2] = useState([0]);
  const handleChartOption2 = (buttonIndex: number) => {
    setChartOption2((prevData) => {
      if (prevData.includes(buttonIndex)) {
        if (prevData.length === 1) {
          return prevData;
        }
        return prevData.filter((v) => v !== buttonIndex);
      } else {
        if (prevData.length >= 1) {
          return [...prevData.slice(1), buttonIndex];
        }
        return [...prevData, buttonIndex];
      }
    });
  };

  useEffect(() => {
    if (!summaries) return;

    const key = CHART_OPTIONS2[chartOption2[0]].value;
    const processes = summaries.pax_experience[key];

    // NOTE: 퍼센트를 계산하기 위해서 합계를 계산합니다.
    const sum = Object.values<number | { hour: number; minute: number; second: number }>(processes).reduce(
      (acc: number, curr: number | { hour: number; minute: number; second: number }) => {
        if (typeof curr === 'number') {
          return acc + curr;
        }
        const seconds = curr.hour * 60 * 60 + curr.minute * 60 + curr.second;
        return acc + seconds;
      },
      0
    );

    const chartData_ = Object.entries(processes).map(([process, value], i) => {
      if (typeof value === 'number') {
        const percentage = Math.round((value / sum) * 10000) / 100;

        return {
          title: process,
          value: value.toLocaleString() + 'pax',
          width: percentage,
        };
      }

      const v = value as { hour: number; minute: number; second: number };
      const seconds = v.hour * 60 * 60 + v.minute * 60 + v.second;
      const percentage = Math.round((seconds / sum) * 10000) / 100;

      return {
        title: process,
        value: `${v.hour > 0 ? `${v.hour}h ` : ''} ${v.minute > 0 ? `${v.minute}m ` : ''} ${v.second}s`.trim(),
        width: percentage,
      };
    });

    setChartData(chartData_);
  }, [chartOption2, summaries]);

  if (!scenario) {
    return <HomeNoScenario />;
  }

  if (isLoading) {
    return <HomeLoading />;
  }

  if (!summaries) {
    return <HomeNoData />;
  }

  return (
    <>
      <div className="my-[14px] grid grid-cols-3 grid-rows-2 gap-3 overflow-auto">
        <HomeSummaryCard
          icon={PassengerThroughput}
          title="Pax Throughput"
          value={summaries?.throughput.toLocaleString()}
        />
        <HomeSummaryCard
          showCircle
          icon={WaitTime}
          title="Wait Time"
          value={`${summaries?.waiting_time.hour > 0 ? `${summaries?.waiting_time.hour}h ` : ''} ${summaries?.waiting_time.minute > 0 ? `${summaries?.waiting_time.minute}m ` : ''} ${summaries?.waiting_time.second}s`.trim()}
        />
        <HomeSummaryCard
          showCircle
          icon={PassengerQueue}
          title="Queue Pax"
          value={`${summaries?.queue_length.toLocaleString()} pax`}
        />
        <HomeSummaryCard
          icon={RatioIcon01}
          title="Activated / Installed Ratio"
          value={`${summaries?.facility_utilization.toFixed(1)}%`}
        />
        <HomeSummaryCard
          icon={RatioIcon02}
          title="Processed / Activated Ratio"
          value={`${summaries?.processed_per_activated.toFixed(1)}%`}
        />
        <HomeSummaryCard
          icon={RatioIcon03}
          title="Processed / Installed Ratio"
          value={`${summaries?.processed_per_installed.toFixed(1)}%`}
        />
      </div>

      <div className="rounded border border-default-200 px-4 py-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xl font-semibold">Pax Experience</div>
          <ButtonGroup>
            {CHART_OPTIONS2.map((opt, idx) => (
              <Button
                className={cn(
                  chartOption2.includes(idx)
                    ? 'bg-default-200 font-bold shadow-[inset_0px_-1px_4px_0px_rgba(185,192,212,0.80)]'
                    : ''
                )}
                variant="outline"
                key={idx}
                onClick={() => handleChartOption2(idx)}
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
