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
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup';
import { cn } from '@/lib/utils';
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
  data?: any; // 배치 API에서 받은 summary 데이터
  commonData?: any; // 공통 데이터 (missed_flight_passengers 등)
  isLoading?: boolean; // 배치 API 로딩 상태
}

function HomeSummary({
  scenario,
  calculate_type,
  percentile,
  data,
  commonData,
  isLoading: propIsLoading,
}: HomeSummaryProps) {
  // 부모 컴포넌트에서 데이터를 받아서 사용 (개별 API 호출 제거)
  const summaryData = data;
  const isLoading = propIsLoading || false;

  const [selectedChartType, setSelectedChartType] = useState(CHART_OPTIONS[0].value);
  const [accordionOpen, setAccordionOpen] = useState(false);

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

  if (!summaryData) {
    return <HomeNoData />;
  }

  return (
    <>
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
        <TheHistogramChart chartData={chartData} />
      </div>

      {/* KPI 카드 */}
      <div className="mb-0 grid grid-cols-1 grid-rows-6 gap-3 overflow-auto md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
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
          kpiType={calculate_type === 'mean' ? 'mean' : calculate_type === 'top' ? 'top' : undefined}
          percentile={calculate_type === 'top' ? (percentile ?? undefined) : undefined}
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
          kpiType={calculate_type === 'mean' ? 'mean' : calculate_type === 'top' ? 'top' : undefined}
          percentile={calculate_type === 'top' ? (percentile ?? undefined) : undefined}
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

      {/* Missed Pax~Early Bird Ratio Metric 카드: Pax Experience 아래 */}
      <div className="mt-[14px]">
        {/* open 상태에 따라 트리거(화살표)를 상단/하단에 한 번만 렌더링 */}
        {!accordionOpen && (
          <div className="mt-[14px] flex justify-center">
            <Button variant="btn-link" onClick={() => setAccordionOpen(true)}>
              <svg
                className="h-6 w-6 text-muted-foreground transition-transform duration-200"
                style={{ transform: 'rotate(0deg)' }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        )}

        <Accordion type="single" collapsible value={accordionOpen ? 'metrics' : undefined}>
          <AccordionItem value="metrics" className="border-none">
            <AccordionContent className="px-0 pb-0 pt-0">
              <div className="my-0 grid grid-cols-1 grid-rows-6 gap-3 overflow-auto md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
                <HomeSummaryCard
                  icon={PassengerQueue}
                  title={
                    <span className="flex items-center">
                      Missed Pax
                      <HomeTooltip content="The ratio of processed capacity to total installed capacity.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {commonData?.etc_info?.performance_kpi?.missed_flight_passengers?.value?.toLocaleString() ||
                        'N/A'}
                      {formatUnit('pax')}
                    </>
                  }
                />
                <HomeSummaryCard
                  icon={PassengerThroughput}
                  title={
                    <span className="flex items-center">
                      Ontime Pax
                      <HomeTooltip content="Number of passengers who completed all processes before flight departure.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {commonData?.etc_info?.performance_kpi?.ontime_flight_passengers?.value?.toLocaleString() ||
                        'N/A'}
                      {formatUnit('pax')}
                    </>
                  }
                />
                <HomeSummaryCard
                  icon={WaitTime}
                  title={
                    <span className="flex items-center">
                      Avg. Dwell Time
                      <HomeTooltip content="Average passenger dwell time at airport (arrival to actual departure from airport).">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {commonData?.etc_info?.performance_kpi?.[
                        'avg_airport_dwell_time(min)'
                      ]?.value?.toLocaleString() || 'N/A'}
                      {formatUnit('min')}
                    </>
                  }
                />
                <HomeSummaryCard
                  icon={RatioIcon01}
                  title={
                    <span className="flex items-center">
                      Commercial Facility Usage Time
                      <HomeTooltip content="Average available time for commercial facilities after final process completion.">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {commonData?.etc_info?.commercial_info?.[
                        'commercial_facility_usage_time_avg(min)'
                      ]?.value?.toLocaleString() || 'N/A'}
                      {formatUnit('min')}
                    </>
                  }
                />
                <HomeSummaryCard
                  icon={RatioIcon02}
                  title={
                    <span className="flex items-center">
                      Shopping Available
                      <HomeTooltip content="Shopping availability based on average spare time (Possible if positive, Impossible if negative)">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={<>{commonData?.etc_info?.commercial_info?.shopping_available?.value || 'N/A'}</>}
                />
                <HomeSummaryCard
                  icon={RatioIcon03}
                  title={
                    <span className="flex items-center">
                      Rush Hour
                      <HomeTooltip content="Peak hour when most passengers arrive at the airport">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={<>{commonData?.etc_info?.operational_insights?.rush_hour?.value || 'N/A'}</>}
                />
                <HomeSummaryCard
                  icon={() => <NavIcon02 />} // 병목 프로세스
                  title={
                    <span className="flex items-center">
                      Bottleneck Process
                      <HomeTooltip content="Process with the longest average waiting time (improvement priority)">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {capitalizeFirst(commonData?.etc_info?.operational_insights?.bottleneck_process?.value) || 'N/A'}
                    </>
                  }
                />
                <HomeSummaryCard
                  icon={() => <NavIcon01 />} // 얼리버드 비율
                  title={
                    <span className="flex items-center">
                      Early Bird Ratio
                      <HomeTooltip content="Percentage of passengers arriving 2+ hours before departure">
                        <span className="ml-1 size-3 cursor-pointer">ⓘ</span>
                      </HomeTooltip>
                    </span>
                  }
                  value={
                    <>
                      {commonData?.etc_info?.operational_insights?.['early_bird_ratio(%)']?.value?.toLocaleString() ||
                        'N/A'}
                      {formatUnit('%')}
                    </>
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* open 상태에 따라 하단에만 화살표 렌더링 */}
        {accordionOpen && (
          <div className="mt-[14px] flex justify-center">
            <Button variant="btn-link" onClick={() => setAccordionOpen(false)}>
              <svg
                className="h-6 w-6 rotate-180 text-muted-foreground transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default HomeSummary;
